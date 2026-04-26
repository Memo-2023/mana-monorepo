/**
 * Milestones Year Recap Aggregator
 *
 * Pure: takes a TimelineEntry[] + a year and returns a per-year summary.
 * Counts per direction + category, top entries by recency. No metrics
 * fancier than counts (this isn't augur — there's nothing to "verify"
 * about a milestone).
 *
 * Stable shape so a future LLM-phrasing layer can narrate it.
 */

import { MILESTONE_CATEGORIES, type MilestoneCategory } from './categories';
import { filterByYear, type TimelineEntry, type Direction } from './timeline-query';

export interface MilestonesRecap {
	year: number;
	total: number;
	firsts: number;
	lasts: number;
	byCategory: Record<MilestoneCategory, { firsts: number; lasts: number; total: number }>;
	/** Top-N entries by anchor date desc. Cap = 5 each. */
	topFirsts: TimelineEntry[];
	topLasts: TimelineEntry[];
	/** Months that had any activity, in chronological order ('YYYY-MM'). */
	activeMonths: string[];
}

const TOP_CAP = 5;

function emptyByCategory(): MilestonesRecap['byCategory'] {
	const out = {} as MilestonesRecap['byCategory'];
	for (const cat of MILESTONE_CATEGORIES) {
		out[cat] = { firsts: 0, lasts: 0, total: 0 };
	}
	return out;
}

function countByDirection(entries: TimelineEntry[], direction: Direction): number {
	return entries.filter((e) => e.direction === direction).length;
}

function topByDirection(
	entries: TimelineEntry[],
	direction: Direction,
	cap = TOP_CAP
): TimelineEntry[] {
	return entries.filter((e) => e.direction === direction).slice(0, cap); // entries are pre-sorted desc by anchor date
}

function uniqueActiveMonths(entries: TimelineEntry[]): string[] {
	const set = new Set<string>();
	for (const e of entries) {
		const anchor = e.date ?? e.createdAt;
		if (anchor.length >= 7) set.add(anchor.slice(0, 7));
	}
	return [...set].sort();
}

export function buildMilestonesRecap(allEntries: TimelineEntry[], year: number): MilestonesRecap {
	const inYear = filterByYear(allEntries, year);

	const byCategory = emptyByCategory();
	for (const e of inYear) {
		const slot = byCategory[e.category];
		if (!slot) continue;
		slot.total += 1;
		if (e.direction === 'first') slot.firsts += 1;
		else slot.lasts += 1;
	}

	return {
		year,
		total: inYear.length,
		firsts: countByDirection(inYear, 'first'),
		lasts: countByDirection(inYear, 'last'),
		byCategory,
		topFirsts: topByDirection(inYear, 'first'),
		topLasts: topByDirection(inYear, 'last'),
		activeMonths: uniqueActiveMonths(inYear),
	};
}
