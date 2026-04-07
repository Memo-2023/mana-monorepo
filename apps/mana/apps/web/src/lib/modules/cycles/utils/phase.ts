/**
 * Phase derivation — leitet die Zyklusphase aus dem Datum und der Zyklus-Historie ab.
 */

import {
	DEFAULT_CYCLE_LENGTH,
	DEFAULT_LUTEAL_LENGTH,
	DEFAULT_PERIOD_LENGTH,
	type Cycle,
	type CyclePhase,
} from '../types';

/** Tage zwischen zwei ISO-Daten (a - b) */
export function daysBetween(a: string, b: string): number {
	const ms = new Date(a).getTime() - new Date(b).getTime();
	return Math.round(ms / 86_400_000);
}

/** Findet den Zyklus, der das gegebene Datum enthält. Cycles müssen nach startDate sortiert sein. */
export function findCycleForDate(date: string, cycles: Cycle[]): Cycle | null {
	const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
	let match: Cycle | null = null;
	for (const c of sorted) {
		if (c.startDate <= date) match = c;
		else break;
	}
	return match;
}

/** Tag-Nummer innerhalb des Zyklus (Tag 1 = startDate). null wenn date vor dem Zyklus liegt. */
export function getCycleDayNumber(date: string, cycle: Cycle): number | null {
	const diff = daysBetween(date, cycle.startDate);
	if (diff < 0) return null;
	return diff + 1;
}

/**
 * Leitet die Phase ab, in der ein Datum liegt.
 *
 * Heuristik:
 *  - Periode: Tag 1..periodLength
 *  - Eisprung: cycleLength - lutealLength (±1 Tag)
 *  - Vorher = Follikelphase, danach = Lutealphase
 */
export function derivePhase(
	date: string,
	cycles: Cycle[],
	avgCycleLength = DEFAULT_CYCLE_LENGTH
): CyclePhase {
	const cycle = findCycleForDate(date, cycles);
	if (!cycle) return 'unknown';

	const dayNum = getCycleDayNumber(date, cycle);
	if (dayNum === null) return 'unknown';

	const periodLength =
		cycle.periodEndDate && cycle.periodEndDate >= cycle.startDate
			? daysBetween(cycle.periodEndDate, cycle.startDate) + 1
			: DEFAULT_PERIOD_LENGTH;

	const cycleLength = cycle.length ?? avgCycleLength;
	const ovulationDay = cycleLength - DEFAULT_LUTEAL_LENGTH;

	if (dayNum <= periodLength) return 'menstruation';
	if (Math.abs(dayNum - ovulationDay) <= 1) return 'ovulation';
	if (dayNum < ovulationDay) return 'follicular';
	return 'luteal';
}
