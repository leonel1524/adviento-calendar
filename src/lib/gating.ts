/**
 * Reglas de desbloqueo del calendario de adviento.
 *
 * Un día se abre a las 9:00 a.m. hora de Venezuela (VET) del día que le
 * corresponde en diciembre. Para que el momento sea EXACTO sin importar la
 * zona horaria del visitante, se calcula como un instante UTC fijo:
 *
 *   9:00 a.m. VET === 13:00 UTC  (Venezuela es UTC-4 todo el año, sin DST)
 *
 * Este módulo es la única fuente de verdad y se usa tanto en el HTML
 * (renderizado en el build, que corre en UTC) como en el navegador.
 */

/** Año del calendario. Cambiar acá si se reutiliza el proyecto otro año. */
export const ADVIENTO_YEAR = 2026;

/** Hora de apertura, en hora de Venezuela (formato 24h). */
export const UNLOCK_HOUR_VET = 9;

/** Venezuela es UTC-4 todo el año (no aplica horario de verano). */
export const VET_UTC_OFFSET = -4;

/** Diciembre es el mes 11 (los meses van de 0 a 11). */
const DECEMBER = 11;

/**
 * Instante exacto (en milisegundos, UTC) en que se abre un día.
 * Ej: día 1 -> 2026-12-01T13:00:00Z -> 9:00 a.m. en Caracas.
 */
export function unlockInstant(day: number): number {
	const utcHour = UNLOCK_HOUR_VET - VET_UTC_OFFSET; // 9 - (-4) = 13
	return Date.UTC(ADVIENTO_YEAR, DECEMBER, day, utcHour, 0, 0, 0);
}

/** ¿Está abierto el día indicado? `now` permite inyectar el momento en pruebas. */
export function isDayUnlocked(day: number, now: number = Date.now()): boolean {
	return now >= unlockInstant(day);
}

/** Texto del momento de apertura. Ej: "1 de diciembre a las 9:00 a.m." */
export function unlockMoment(day: number): string {
	return `${day} de diciembre a las ${UNLOCK_HOUR_VET}:00 a.m.`;
}
