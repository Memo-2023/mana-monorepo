/**
 * Phase derivation — leitet die Zyklusphase aus dem Datum und der Zyklus-Historie ab.
 */

import {
	DEFAULT_PERIOD_LENGTH,
	DEFAULT_LUTEAL_LENGTH,
	DEFAULT_BLEEDING_DAYS,
	type Period,
	type PeriodPhase,
} from '../types';

/** Tage zwischen zwei ISO-Daten (a - b) */
export function daysBetween(a: string, b: string): number {
	const ms = new Date(a).getTime() - new Date(b).getTime();
	return Math.round(ms / 86_400_000);
}

/** Findet den Zyklus, der das gegebene Datum enthält. Periods müssen nach startDate sortiert sein. */
export function findPeriodForDate(date: string, periods: Period[]): Period | null {
	const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
	let match: Period | null = null;
	for (const c of sorted) {
		if (c.startDate <= date) match = c;
		else break;
	}
	return match;
}

/** Tag-Nummer innerhalb des Zyklus (Tag 1 = startDate). null wenn date vor dem Zyklus liegt. */
export function getPeriodDayNumber(date: string, period: Period): number | null {
	const diff = daysBetween(date, period.startDate);
	if (diff < 0) return null;
	return diff + 1;
}

/**
 * Leitet die Phase ab, in der ein Datum liegt.
 *
 * Heuristik:
 *  - Periode: Tag 1..periodLength
 *  - Eisprung: periodLength - lutealLength (±1 Tag)
 *  - Vorher = Follikelphase, danach = Lutealphase
 */
export function derivePhase(
	date: string,
	periods: Period[],
	avgPeriodLength = DEFAULT_PERIOD_LENGTH
): PeriodPhase {
	const period = findPeriodForDate(date, periods);
	if (!period) return 'unknown';

	const dayNum = getPeriodDayNumber(date, period);
	if (dayNum === null) return 'unknown';

	const bleedingLength =
		period.periodEndDate && period.periodEndDate >= period.startDate
			? daysBetween(period.periodEndDate, period.startDate) + 1
			: DEFAULT_BLEEDING_DAYS;

	const periodLength = period.length ?? avgPeriodLength;
	const ovulationDay = periodLength - DEFAULT_LUTEAL_LENGTH;

	if (dayNum <= bleedingLength) return 'menstruation';
	if (Math.abs(dayNum - ovulationDay) <= 1) return 'ovulation';
	if (dayNum < ovulationDay) return 'follicular';
	return 'luteal';
}
