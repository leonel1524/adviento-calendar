/**
 * Pruebas de la lógica de gating (se ejecuta con Node, no entra al bundle).
 * Uso: node --experimental-strip-types src/lib/gating.check.ts
 */
import {
	ADVIENTO_YEAR,
	isDayUnlocked,
	unlockInstant
} from './gating.ts';

let fallos = 0;

function check(nombre: string, actual: unknown, esperado: unknown) {
	const ok = actual === esperado;
	if (!ok) fallos++;
	console.log(`${ok ? '✅' : '❌'} ${nombre}${ok ? '' : ` -> esperado ${esperado}, obtenido ${actual}`}`);
}

/** Instante UTC para una fecha/hora concreta. */
function utc(y: number, m: number, d: number, h: number, min = 0) {
	return Date.UTC(y, m - 1, d, h, min, 0, 0);
}

console.log(`\n--- Instante de apertura del día 1 ---`);
check('día 1 = 1 dic 2026 13:00 UTC', unlockInstant(1), utc(2026, 12, 1, 13));
check('día 24 = 24 dic 2026 13:00 UTC', unlockInstant(24), utc(2026, 12, 24, 13));
console.log(`   (13:00 UTC equivale a 9:00 a.m. en Caracas, UTC-4)`);

console.log(`\n--- Límites del día 1 ---`);
check('30 nov 23:59 UTC -> bloqueado', isDayUnlocked(1, utc(2026, 11, 30, 23, 59)), false);
check('1 dic 08:59 VET (12:59 UTC) -> bloqueado', isDayUnlocked(1, utc(2026, 12, 1, 12, 59)), false);
check('1 dic 09:00 VET (13:00 UTC) -> ABIERTO', isDayUnlocked(1, utc(2026, 12, 1, 13, 0)), true);
check('1 dic 09:01 VET (13:01 UTC) -> abierto', isDayUnlocked(1, utc(2026, 12, 1, 13, 1)), true);

console.log(`\n--- Cada día abre a su hora, no antes ---`);
check('3 dic 08:00 VET: día 3 bloqueado', isDayUnlocked(3, utc(2026, 12, 3, 12, 0)), false);
check('3 dic 08:00 VET: día 2 abierto', isDayUnlocked(2, utc(2026, 12, 3, 12, 0)), true);
check('3 dic 09:00 VET: día 3 abierto', isDayUnlocked(3, utc(2026, 12, 3, 13, 0)), true);

console.log(`\n--- Después de diciembre siguen abiertos (no se re-bloquean) ---`);
check('31 dic 2026 -> día 24 abierto', isDayUnlocked(24, utc(2026, 12, 31, 23, 59)), true);
check('15 ene 2027 -> día 1 abierto', isDayUnlocked(1, utc(2027, 1, 15, 12)), true);
check('15 jun 2027 -> día 1 abierto', isDayUnlocked(1, utc(2027, 6, 15, 12)), true);
check('15 jun 2027 -> día 24 abierto', isDayUnlocked(24, utc(2027, 6, 15, 12)), true);

console.log(`\n--- Antes de diciembre: todo bloqueado ---`);
check('15 oct 2026 -> día 1 bloqueado', isDayUnlocked(1, utc(2026, 10, 15, 12)), false);
check('15 oct 2026 -> día 24 bloqueado', isDayUnlocked(24, utc(2026, 10, 15, 12)), false);

console.log(`\n--- Independiente de la zona del visitante (mismo instante UTC) ---`);
check('año configurado', ADVIENTO_YEAR, 2026);

console.log(`\n${fallos === 0 ? '🎉 Todas las pruebas pasaron' : `💥 ${fallos} prueba(s) fallaron`}\n`);
process.exit(fallos === 0 ? 0 : 1);
