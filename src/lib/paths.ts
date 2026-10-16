/**
 * Utilidades de rutas para que los enlaces funcionen tanto en desarrollo
 * como desplegado en un subdirectorio (GitHub Pages: /adviento-calendar/).
 */

/** Base del sitio sin barra final. En dev es "" y en GitHub Pages "/adviento-calendar". */
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Construye una ruta interna absoluta respetando el base. Ej: path('calendar') -> '/adviento-calendar/calendar' */
export function path(route: string): string {
	return `${BASE}/${route.replace(/^\/+/, '')}`;
}
