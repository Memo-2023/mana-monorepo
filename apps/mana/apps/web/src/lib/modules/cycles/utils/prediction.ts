/**
 * Prediction — einfache Vorhersagen über gleitenden Mittelwert.
 */

import { DEFAULT_CYCLE_LENGTH, DEFAULT_LUTEAL_LENGTH, type Cycle } from '../types';
import { daysBetween } from './phase';

/** Durchschnittliche Zykluslänge aus den letzten N geschlossenen Zyklen. */
export function averageCycleLength(cycles: Cycle[], window = 6): number {
	const closed = cycles
		.filter((c) => !c.isPredicted && typeof c.length === 'number' && (c.length ?? 0) > 0)
		.sort((a, b) => b.startDate.localeCompare(a.startDate))
		.slice(0, window);
	if (closed.length === 0) return DEFAULT_CYCLE_LENGTH;
	const sum = closed.reduce((acc, c) => acc + (c.length ?? 0), 0);
	return Math.round(sum / closed.length);
}

/** Vorhergesagter Start der nächsten Periode (ISO-Date). */
export function predictNextPeriodStart(cycles: Cycle[]): string | null {
	const real = cycles.filter((c) => !c.isPredicted);
	if (real.length === 0) return null;
	const latest = real.sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
	const avg = averageCycleLength(real);
	const start = new Date(latest.startDate);
	start.setUTCDate(start.getUTCDate() + avg);
	return start.toISOString().slice(0, 10);
}

/** Tage bis zur nächsten Periode. Negativ = überfällig. null wenn keine Daten. */
export function daysUntilNextPeriod(cycles: Cycle[]): number | null {
	const next = predictNextPeriodStart(cycles);
	if (!next) return null;
	return daysBetween(next, new Date().toISOString().slice(0, 10));
}

/** Fruchtbares Fenster für den aktuellen Zyklus (5 Tage vor + Eisprung). */
export function predictFertileWindow(cycles: Cycle[]): { start: string; end: string } | null {
	const real = cycles.filter((c) => !c.isPredicted);
	if (real.length === 0) return null;
	const latest = real.sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
	const avg = averageCycleLength(real);
	const ovulationDay = avg - DEFAULT_LUTEAL_LENGTH;
	const start = new Date(latest.startDate);
	start.setUTCDate(start.getUTCDate() + ovulationDay - 5);
	const end = new Date(latest.startDate);
	end.setUTCDate(end.getUTCDate() + ovulationDay + 1);
	return {
		start: start.toISOString().slice(0, 10),
		end: end.toISOString().slice(0, 10),
	};
}

/** Statistik-Snapshot über alle echten Zyklen. */
export function computeCycleStats(cycles: Cycle[]) {
	const real = cycles.filter((c) => !c.isPredicted && typeof c.length === 'number');
	const lengths = real.map((c) => c.length as number);
	const total = real.length;
	const avg = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
	const shortest = lengths.length ? Math.min(...lengths) : 0;
	const longest = lengths.length ? Math.max(...lengths) : 0;
	return { total, avg, shortest, longest };
}
