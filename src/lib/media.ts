import { path } from './paths';

/**
 * Resuelve el `src` de un bloque multimedia.
 *
 * Convención de rutas (pensada para que el panel de administración solo tenga
 * que guardar un texto simple):
 *   - `media/foto.jpg`            -> archivo subido, vive en `public/media/`
 *   - `/media/foto.jpg`           -> igual (se le quita la barra inicial)
 *   - `https://...`               -> se usa tal cual (YouTube, Vimeo, un CDN)
 */
export function resolveMediaSrc(src: string): string {
	if (/^https?:\/\//i.test(src)) return src;
	return path(src.replace(/^\/+/, ''));
}

/**
 * Si el video viene de YouTube o Vimeo, devuelve la URL para incrustarlo en un
 * iframe (esos servicios no se pueden reproducir con un `<video>` normal).
 * Devuelve `null` si es un archivo de video propio.
 */
export function toVideoEmbed(src: string): string | null {
	const youtube = src.match(
		/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i
	);
	if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;

	const vimeo = src.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
	if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

	return null;
}

/** Segundos -> "1:05" (para mostrar la duración de audios y videos). */
export function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${String(s).padStart(2, '0')}`;
}
