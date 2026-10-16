import raw from './days.json';

export type ContentBlock =
	| { type: 'text'; text: string }
	| { type: 'image'; src: string; alt: string; caption?: string }
	| { type: 'video'; src: string; poster?: string; label?: string }
	| { type: 'audio'; src: string; label?: string };

export interface AdvientoDay {
	day: number;
	title?: string;
	blocks: ContentBlock[];
}

const TIPOS_VALIDOS = ['text', 'image', 'video', 'audio'] as const;

/**
 * El contenido vive en `days.json` para que el panel de administración
 * (`npm run admin`) pueda leerlo y escribirlo sin tocar código.
 * Acá se valida para que un error de contenido se vea al construir y no
 * como una cajita vacía en el calendario.
 */
function validar(valor: unknown): AdvientoDay[] {
	if (!Array.isArray(valor)) {
		throw new Error('days.json: se esperaba un array de días');
	}

	return valor.map((dia, i) => {
		if (typeof dia !== 'object' || dia === null) {
			throw new Error(`days.json: el día en la posición ${i} no es un objeto`);
		}
		const d = dia as Record<string, unknown>;
		if (typeof d.day !== 'number') {
			throw new Error(`days.json: falta el número de día en la posición ${i}`);
		}
		if (!Array.isArray(d.blocks)) {
			throw new Error(`days.json: el día ${d.day} no tiene "blocks"`);
		}
		d.blocks.forEach((bloque, j) => {
			const b = bloque as Record<string, unknown>;
			if (typeof b?.type !== 'string') {
				throw new Error(`days.json: el bloque ${j} del día ${d.day} no tiene "type"`);
			}
			if (!TIPOS_VALIDOS.includes(b.type as (typeof TIPOS_VALIDOS)[number])) {
				throw new Error(
					`days.json: el bloque ${j} del día ${d.day} tiene un tipo desconocido: "${b.type}"`
				);
			}
			if (b.type === 'text' && typeof b.text !== 'string') {
				throw new Error(`days.json: el bloque de texto ${j} del día ${d.day} no tiene "text"`);
			}
			if (b.type !== 'text' && typeof b.src !== 'string') {
				throw new Error(`days.json: el bloque ${b.type} ${j} del día ${d.day} no tiene "src"`);
			}
		});
		return d as unknown as AdvientoDay;
	});
}

export const days: AdvientoDay[] = validar(raw);
