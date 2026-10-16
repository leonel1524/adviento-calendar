#!/usr/bin/env node
/**
 * Panel de administración local del calendario de adviento.
 *
 *   npm run admin
 *
 * Levanta un servidor HTTP SOLO en localhost (nunca se publica, no forma parte
 * del build del sitio) que permite editar el contenido de los 24 días:
 *
 *   GET  /                  -> la interfaz del panel
 *   GET  /api/state         -> contenido + archivos + estado de git
 *   PUT  /api/days          -> guarda src/data/days.json
 *   POST /api/upload        -> guarda un archivo en public/media/
 *   POST /api/media/delete  -> borra un archivo de public/media/
 *   POST /api/reveal        -> abre el archivo en el Finder
 *   POST /api/publish       -> commit + push (re-despliega el sitio)
 *
 * Además arranca `npm run dev` (Astro) para tener vista previa en vivo.
 */
import { createServer } from 'node:http';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
	readFileSync,
	writeFileSync,
	renameSync,
	existsSync,
	mkdirSync,
	readdirSync,
	statSync,
	unlinkSync
} from 'node:fs';
import { join, extname, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.ADMIN_REPO_DIR || join(AQUI, '..', '..'));
const ARCHIVO_CONTENIDO = join(REPO, 'src', 'data', 'days.json');
const CARPETA_MEDIA = join(REPO, 'public', 'media');
const PUERTO = Number(process.env.ADMIN_PORT || 4400);
// Puerto propio y dedicado para la vista previa: así el panel nunca se confunde
// con un `npm run dev` viejo que esté corriendo con otra configuración.
const PUERTO_DEV = Number(process.env.ADMIN_DEV_PORT || 4391);

/** Base del sitio leída de astro.config.mjs (en dev Astro también sirve bajo el base). */
function baseDelSitio() {
	try {
		const cfg = readFileSync(join(REPO, 'astro.config.mjs'), 'utf8');
		const m = cfg.match(/base:\s*'([^']*)'/);
		return (m ? m[1] : '').replace(/\/+$/, '');
	} catch {
		return '';
	}
}

const BASE_SITIO = baseDelSitio();
const ORIGEN_DEV = `http://localhost:${PUERTO_DEV}`;
// Se ajusta con la URL real que imprime Astro (puede cambiar de puerto si está ocupado).
let previewBase = `${ORIGEN_DEV}${BASE_SITIO}`;
let devListo = false;

const TIPOS = ['text', 'image', 'video', 'audio'];
const EXTENSIONES = {
	'.jpg': 'image',
	'.jpeg': 'image',
	'.png': 'image',
	'.webp': 'image',
	'.gif': 'image',
	'.avif': 'image',
	'.svg': 'image',
	'.mp4': 'video',
	'.webm': 'video',
	'.mov': 'video',
	'.m4v': 'video',
	'.mp3': 'audio',
	'.m4a': 'audio',
	'.ogg': 'audio',
	'.oga': 'audio',
	'.wav': 'audio',
	'.aac': 'audio',
	'.flac': 'audio'
};
const MAX_ARCHIVO = 95 * 1024 * 1024; // GitHub rechaza archivos de más de 100 MB
const AVISO_ARCHIVO = 50 * 1024 * 1024; // arriba de esto GitHub avisa

// ---------------------------------------------------------------- utilidades

function leerContenido() {
	return JSON.parse(readFileSync(ARCHIVO_CONTENIDO, 'utf8'));
}

/** Escribe el JSON de forma atómica (archivo temporal + rename). */
function escribirContenido(dias) {
	const tmp = `${ARCHIVO_CONTENIDO}.tmp`;
	writeFileSync(tmp, JSON.stringify(dias, null, 2) + '\n', 'utf8');
	renameSync(tmp, ARCHIVO_CONTENIDO);
}

/**
 * Valida la forma del contenido. Espeja las reglas de `src/data/days.ts`:
 * si acá pasa, el build no va a fallar.
 */
function validar(dias) {
	const errores = [];
	if (!Array.isArray(dias)) return ['El contenido debe ser una lista de días'];

	dias.forEach((d, i) => {
		if (!d || typeof d !== 'object') {
			errores.push(`Día en la posición ${i}: no es un objeto`);
			return;
		}
		if (typeof d.day !== 'number') errores.push(`Posición ${i}: falta el número de día`);
		if (d.title !== undefined && typeof d.title !== 'string') {
			errores.push(`Día ${d.day}: el título debe ser texto`);
		}
		if (!Array.isArray(d.blocks) || d.blocks.length === 0) {
			errores.push(`Día ${d.day}: necesita al menos un bloque de contenido`);
			return;
		}
		d.blocks.forEach((b, j) => {
			const donde = `Día ${d.day}, bloque ${j + 1}`;
			if (!b || typeof b !== 'object') {
				errores.push(`${donde}: no es un objeto`);
				return;
			}
			if (!TIPOS.includes(b.type)) {
				errores.push(`${donde}: tipo inválido "${b.type}"`);
				return;
			}
			if (b.type === 'text') {
				if (typeof b.text !== 'string' || !b.text.trim()) {
					errores.push(`${donde}: el texto está vacío`);
				}
			} else if (typeof b.src !== 'string' || !b.src.trim()) {
				errores.push(`${donde}: falta el archivo o la URL`);
			}
			if (b.type === 'image' && (typeof b.alt !== 'string' || !b.alt.trim())) {
				errores.push(`${donde}: la descripción de la imagen (alt) es obligatoria`);
			}
		});
	});

	return errores;
}

/** Revisa que los archivos locales referenciados existan. */
function faltantes(dias) {
	const faltan = new Set();
	for (const d of dias) {
		for (const b of d.blocks || []) {
			if (!b.src || /^https?:\/\//i.test(b.src)) continue;
			const rel = b.src.replace(/^\/+/, '');
			if (!rel.startsWith('media/')) continue;
			if (!existsSync(join(REPO, 'public', rel))) {
				faltan.add(`día ${d.day}: ${rel}`);
			}
		}
	}
	return [...faltan];
}

function listarMedia() {
	if (!existsSync(CARPETA_MEDIA)) return [];
	return readdirSync(CARPETA_MEDIA)
		.filter((f) => !f.startsWith('.'))
		.map((f) => {
			const st = statSync(join(CARPETA_MEDIA, f));
			return {
				nombre: f,
				ruta: `media/${f}`,
				tipo: EXTENSIONES[extname(f).toLowerCase()] || 'otro',
				bytes: st.size,
				modificado: st.mtimeMs
			};
		})
		.sort((a, b) => b.modificado - a.modificado);
}

/** Nombre de archivo seguro: sin acentos, sin espacios, sin mayúsculas raras. */
function nombreSeguro(original) {
	// Se pasa a minúsculas ANTES de separar la extensión: si no,
	// "Foto.PNG" no recorta el ".PNG" y el nombre queda "...-png.png".
	const limpio = basename(original).toLowerCase();
	const ext = extname(limpio);
	const base =
		basename(limpio, ext)
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'archivo';
	return { base, ext };
}

async function git(args) {
	const { stdout } = await execFileAsync('git', args, { cwd: REPO, maxBuffer: 10 * 1024 * 1024 });
	return stdout.trim();
}

async function estadoGit() {
	try {
		const [rama, cambios, ultimos] = await Promise.all([
			git(['rev-parse', '--abbrev-ref', 'HEAD']),
			git(['status', '--porcelain']),
			git(['log', '--oneline', '-3'])
		]);
		return {
			rama,
			pendientes: cambios ? cambios.split('\n') : [],
			ultimos: ultimos ? ultimos.split('\n') : []
		};
	} catch (e) {
		return { rama: '?', pendientes: [], ultimos: [], error: String(e.message || e) };
	}
}

function json(res, codigo, datos) {
	const cuerpo = JSON.stringify(datos);
	res.writeHead(codigo, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Length': Buffer.byteLength(cuerpo),
		'Cache-Control': 'no-store'
	});
	res.end(cuerpo);
}

function leerCuerpo(req, limite = 2 * 1024 * 1024) {
	return new Promise((ok, mal) => {
		const trozos = [];
		let total = 0;
		req.on('data', (c) => {
			total += c.length;
			if (total > limite) {
				mal(new Error(`El archivo supera el límite de ${Math.round(limite / 1024 / 1024)} MB`));
				req.destroy();
				return;
			}
			trozos.push(c);
		});
		req.on('end', () => ok(Buffer.concat(trozos)));
		req.on('error', mal);
	});
}

// ------------------------------------------------------------------ servidor

// Arranca Astro dev para la vista previa. Siempre en un puerto propio: si
// reutilizáramos un `npm run dev` viejo (de antes de un cambio de config)
// la vista previa apuntaría a una URL sin el base y daría 404.
let hijoDev = null;
function asegurarDev() {
	console.log(`   vista previa: arrancando "npm run dev -- --port ${PUERTO_DEV}"...`);
	hijoDev = spawn('npm', ['run', 'dev', '--', '--port', String(PUERTO_DEV)], {
		cwd: REPO,
		stdio: ['ignore', 'pipe', 'pipe'],
		env: process.env
	});

	// Astro imprime la URL real (ej. "Local  http://localhost:4391/adviento-calendar"),
	// incluso si el puerto pedido estaba ocupado y usó otro.
	const revisar = (d, esError) => {
		const texto = String(d);
		(esError ? process.stderr : process.stdout).write(`   [astro] ${texto}`);
		const m = texto.match(/https?:\/\/localhost:\d+\S*/);
		if (m && !devListo) {
			previewBase = m[0].replace(/\/+$/, '');
			devListo = true;
			console.log(`   vista previa lista en ${previewBase}`);
		}
	};
	hijoDev.stdout.on('data', (d) => revisar(d, false));
	hijoDev.stderr.on('data', (d) => revisar(d, true));
	hijoDev.on('error', (e) => console.error(`   no se pudo arrancar Astro: ${e.message}`));
}

function cerrarTodo() {
	if (hijoDev && !hijoDev.killed) hijoDev.kill('SIGTERM');
}
process.on('SIGINT', () => {
	cerrarTodo();
	process.exit(0);
});
process.on('SIGTERM', () => {
	cerrarTodo();
	process.exit(0);
});
process.on('exit', cerrarTodo);

const servidor = createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${PUERTO}`);
	const ruta = url.pathname;

	try {
		// --- interfaz ---
		if (req.method === 'GET' && (ruta === '/' || ruta === '/index.html')) {
			const html = readFileSync(join(AQUI, 'ui.html'), 'utf8');
			res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
			res.end(html);
			return;
		}

		// --- archivos subidos (para miniaturas dentro del panel) ---
		if (req.method === 'GET' && ruta.startsWith('/media/')) {
			const nombre = basename(decodeURIComponent(ruta.slice('/media/'.length)));
			const destino = join(CARPETA_MEDIA, nombre);
			if (!destino.startsWith(CARPETA_MEDIA) || !existsSync(destino)) {
				json(res, 404, { error: 'No existe' });
				return;
			}
			const ext = extname(nombre).toLowerCase();
			const tipos = {
				'.jpg': 'image/jpeg',
				'.jpeg': 'image/jpeg',
				'.png': 'image/png',
				'.webp': 'image/webp',
				'.gif': 'image/gif',
				'.avif': 'image/avif',
				'.svg': 'image/svg+xml',
				'.mp4': 'video/mp4',
				'.webm': 'video/webm',
				'.mov': 'video/quicktime',
				'.mp3': 'audio/mpeg',
				'.m4a': 'audio/mp4',
				'.wav': 'audio/wav',
				'.ogg': 'audio/ogg'
			};
			const datos = readFileSync(destino);
			res.writeHead(200, {
				'Content-Type': tipos[ext] || 'application/octet-stream',
				'Content-Length': datos.length
			});
			res.end(datos);
			return;
		}

		// --- estado ---
		if (req.method === 'GET' && ruta === '/api/state') {
			json(res, 200, {
				dias: leerContenido(),
				media: listarMedia(),
				git: await estadoGit(),
				previewBase,
				devListo,
				repo: REPO,
				limites: { maxMB: MAX_ARCHIVO / 1024 / 1024, avisoMB: AVISO_ARCHIVO / 1024 / 1024 }
			});
			return;
		}

		// --- guardar contenido ---
		if (req.method === 'PUT' && ruta === '/api/days') {
			const cuerpo = JSON.parse((await leerCuerpo(req)).toString('utf8'));
			const dias = cuerpo.dias;

			const errores = validar(dias);
			if (errores.length) {
				json(res, 400, { error: 'El contenido tiene problemas', errores });
				return;
			}

			const anterior = JSON.stringify(leerContenido());
			escribirContenido(dias);
			const avisos = faltantes(dias);

			json(res, 200, {
				ok: true,
				sinCambios: anterior === JSON.stringify(dias),
				avisos,
				media: listarMedia()
			});
			return;
		}

		// --- subir archivo ---
		if (req.method === 'POST' && ruta === '/api/upload') {
			const original = url.searchParams.get('nombre') || 'archivo';
			const dia = url.searchParams.get('dia');
			const { base, ext } = nombreSeguro(original);

			if (!EXTENSIONES[ext]) {
				json(res, 400, {
					error: `Extensión no permitida: ${ext || '(sin extensión)'}. Permitidas: ${Object.keys(EXTENSIONES).join(', ')}`
				});
				return;
			}

			const datos = await leerCuerpo(req, MAX_ARCHIVO);
			mkdirSync(CARPETA_MEDIA, { recursive: true });

			const prefijo = dia ? `dia-${String(dia).padStart(2, '0')}-` : '';
			let nombre = `${prefijo}${base}${ext}`;
			let n = 2;
			while (existsSync(join(CARPETA_MEDIA, nombre))) {
				nombre = `${prefijo}${base}-${n}${ext}`;
				n++;
			}
			writeFileSync(join(CARPETA_MEDIA, nombre), datos);

			json(res, 200, {
				ok: true,
				ruta: `media/${nombre}`,
				nombre,
				bytes: datos.length,
				tipo: EXTENSIONES[ext],
				aviso:
					datos.length > AVISO_ARCHIVO
						? `El archivo pesa ${(datos.length / 1024 / 1024).toFixed(1)} MB. GitHub avisa desde los 50 MB y rechaza arriba de 100 MB; para videos largos conviene subirlos a YouTube (no listado) y pegar el enlace.`
						: null
			});
			return;
		}

		// --- borrar archivo ---
		if (req.method === 'POST' && ruta === '/api/media/delete') {
			const { ruta: rel } = JSON.parse((await leerCuerpo(req)).toString('utf8'));
			const nombre = basename(String(rel || ''));
			const destino = join(CARPETA_MEDIA, nombre);
			if (!destino.startsWith(CARPETA_MEDIA) || !existsSync(destino)) {
				json(res, 404, { error: 'No existe ese archivo' });
				return;
			}
			unlinkSync(destino);
			json(res, 200, { ok: true, media: listarMedia() });
			return;
		}

		// --- mostrar en el Finder ---
		if (req.method === 'POST' && ruta === '/api/reveal') {
			const { ruta: rel } = JSON.parse((await leerCuerpo(req)).toString('utf8'));
			const destino = join(REPO, 'public', String(rel || '').replace(/^\/+/, ''));
			if (existsSync(destino)) {
				spawn('open', ['-R', destino], { detached: true, stdio: 'ignore' }).unref();
			}
			json(res, 200, { ok: true });
			return;
		}

		// --- publicar (commit + push) ---
		if (req.method === 'POST' && ruta === '/api/publish') {
			const { mensaje } = JSON.parse((await leerCuerpo(req)).toString('utf8'));
			const pasos = [];

			await git(['add', '-A']);
			const estado = await git(['status', '--porcelain']);
			if (!estado) {
				json(res, 200, { ok: true, nada: true, pasos: ['Sin cambios para publicar'] });
				return;
			}
			pasos.push(estado);

			const cambios = estado.split('\n').filter(Boolean).length;
			const titulo =
				(mensaje && mensaje.trim()) ||
				`content: actualizar calendario desde el panel (${cambios} archivo${cambios === 1 ? '' : 's'})`;
			await git(['commit', '-m', titulo]);
			pasos.push(`commit: ${titulo}`);

			let empujado = false;
			try {
				const { stdout, stderr } = await execFileAsync('git', ['push'], {
					cwd: REPO,
					maxBuffer: 10 * 1024 * 1024
				});
				const salida = `${stdout}${stderr}`.trim();
				pasos.push(salida ? `push ok: ${salida}` : 'push ok');
				empujado = true;
			} catch (e) {
				pasos.push(`push falló: ${e.stdout || e.stderr || e.message}`);
			}

			json(res, 200, {
				ok: true,
				empujado,
				pasos,
				git: await estadoGit()
			});
			return;
		}

		json(res, 404, { error: `Ruta no encontrada: ${ruta}` });
	} catch (e) {
		json(res, 500, { error: String(e.message || e) });
	}
});

servidor.listen(PUERTO, '127.0.0.1', async () => {
	console.log(`\n  🎄 Panel de administración del calendario`);
	console.log(`   repo: ${REPO}`);
	console.log(`   panel:  http://localhost:${PUERTO}`);
	if (process.env.ADMIN_NO_DEV !== '1') asegurarDev();
	console.log(`\n   Abrí el panel en el navegador: http://localhost:${PUERTO}`);
	console.log(`   (Ctrl+C para detener)\n`);
});
