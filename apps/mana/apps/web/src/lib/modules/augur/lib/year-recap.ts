/**
 * Augur — Year Recap Aggregator
 *
 * Pure: takes the full augur entry list + a year and returns a structured
 * snapshot suitable for both the YearRecapView and the `augur_year_recap`
 * MCP tool. No I/O.
 *
 * The shape is stable so a future LLM-phrasing layer (M6 stretch) can
 * narrate from it without re-implementing the maths.
 */

import {
	calibrationPerSource,
	overallStats,
	vibeHitRates,
	type SourceCalibration,
	type VibeHitRate,
} from './calibration';
import type { AugurEntry, AugurKind, AugurOutcome, AugurSourceCategory, AugurVibe } from '../types';

export interface YearRecap {
	year: number;
	total: number;
	resolved: number;
	open: number;
	hitRate: number | null;
	brier: number | null;
	brierN: number;
	byKind: Record<AugurKind, number>;
	byVibe: Record<AugurVibe, number>;
	byOutcome: Record<AugurOutcome, number>;
	topCategories: { category: AugurSourceCategory; n: number; hitRate: number }[];
	bestSource: SourceCalibration | null;
	worstSource: SourceCalibration | null;
	vibeRows: VibeHitRate[];
	mostFulfilled: AugurEntry[];
	mostSurprising: AugurEntry[];
}

function isInYear(e: AugurEntry, year: number): boolean {
	return e.encounteredAt.startsWith(`${year}-`);
}

export function buildYearRecap(entries: AugurEntry[], year: number): YearRecap {
	const inYear = entries.filter((e) => isInYear(e, year));

	const stats = overallStats(inYear);
	const vibeRows = vibeHitRates(inYear);
	const sourceRows = calibrationPerSource(inYear);

	const byKind: Record<AugurKind, number> = { omen: 0, fortune: 0, hunch: 0 };
	const byVibe: Record<AugurVibe, number> = { good: 0, bad: 0, mysterious: 0 };
	const byOutcome: Record<AugurOutcome, number> = {
		open: 0,
		fulfilled: 0,
		partly: 0,
		'not-fulfilled': 0,
	};
	for (const e of inYear) {
		byKind[e.kind]++;
		byVibe[e.vibe]++;
		byOutcome[e.outcome]++;
	}

	const topCategories = sourceRows
		.slice()
		.sort((a, b) => b.n - a.n)
		.slice(0, 5)
		.map((r) => ({ category: r.sourceCategory, n: r.n, hitRate: r.hitRate }));

	const eligible = sourceRows.filter((r) => r.n >= 3);
	const bestSource =
		eligible.length > 0 ? [...eligible].sort((a, b) => b.hitRate - a.hitRate)[0] : null;
	const worstSource =
		eligible.length > 0 ? [...eligible].sort((a, b) => a.hitRate - b.hitRate)[0] : null;

	const mostFulfilled = inYear
		.filter((e) => e.outcome === 'fulfilled')
		.sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))
		.slice(0, 5);

	// "Surprising" = good vibe → not-fulfilled, OR bad vibe → fulfilled. The
	// universe disagreed with the user's gut. These tend to be the most
	// learning-worthy moments at year-end.
	const mostSurprising = inYear
		.filter(
			(e) =>
				(e.vibe === 'good' && e.outcome === 'not-fulfilled') ||
				(e.vibe === 'bad' && e.outcome === 'fulfilled')
		)
		.slice(0, 5);

	return {
		year,
		total: inYear.length,
		resolved: stats.resolved,
		open: stats.open,
		hitRate: stats.hitRate,
		brier: stats.brier,
		brierN: stats.brierN,
		byKind,
		byVibe,
		byOutcome,
		topCategories,
		bestSource,
		worstSource,
		vibeRows,
		mostFulfilled,
		mostSurprising,
	};
}
