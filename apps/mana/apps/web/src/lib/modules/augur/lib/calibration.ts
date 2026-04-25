/**
 * Augur — Calibration & Hit-Rate Math
 *
 * Pure deterministic stats. No I/O, no Dexie, no Svelte runes — every
 * function takes already-decrypted `AugurEntry[]` and returns plain
 * data. The OracleView consumes these results and renders.
 *
 * Two flavours of "is the user calibrated?":
 *
 *  1. **Hit-Rate** — what fraction of resolved entries came true?
 *     Counts `fulfilled` as 1, `partly` as 0.5, `not-fulfilled` as 0.
 *     `open` entries are excluded — they have no ground truth yet.
 *
 *  2. **Brier Score** — only meaningful when the user provided a
 *     `probability` at capture time. Squared error between forecast
 *     probability and outcome (1 / 0.5 / 0). Lower = better; 0.25 =
 *     "always 50/50". Surfaces "are your numerical bets calibrated?"
 *     separately from "did your gut feeling come true?".
 *
 * Vibe-hit-rate is the same logic per `good`/`bad`/`mysterious`. It
 * answers: "when you marked something as a 'good sign', how often was
 * it actually good news?"
 */

import type { AugurEntry, AugurOutcome, AugurSourceCategory, AugurVibe } from '../types';

/** Outcome → numeric value for hit-rate / Brier math. */
export function outcomeValue(outcome: AugurOutcome): number | null {
	switch (outcome) {
		case 'fulfilled':
			return 1;
		case 'partly':
			return 0.5;
		case 'not-fulfilled':
			return 0;
		case 'open':
			return null;
	}
}

/** True if the entry has a resolved outcome we can score. */
export function isScored(e: AugurEntry): boolean {
	return outcomeValue(e.outcome) != null;
}

export interface SourceCalibration {
	sourceCategory: AugurSourceCategory;
	n: number;
	hitRate: number; // 0..1, weighted (partly = 0.5)
	fulfilled: number;
	partly: number;
	notFulfilled: number;
	/** Brier score over entries with `probability` set. null if no such entries. */
	brier: number | null;
	brierN: number;
}

/** One row per `sourceCategory` that has at least one resolved entry. */
export function calibrationPerSource(entries: AugurEntry[]): SourceCalibration[] {
	const buckets = new Map<AugurSourceCategory, AugurEntry[]>();
	for (const e of entries) {
		if (!isScored(e)) continue;
		const arr = buckets.get(e.sourceCategory) ?? [];
		arr.push(e);
		buckets.set(e.sourceCategory, arr);
	}

	const rows: SourceCalibration[] = [];
	for (const [sourceCategory, group] of buckets) {
		let weighted = 0;
		let fulfilled = 0;
		let partly = 0;
		let notFulfilled = 0;
		let brierSum = 0;
		let brierN = 0;
		for (const e of group) {
			const v = outcomeValue(e.outcome)!;
			weighted += v;
			if (e.outcome === 'fulfilled') fulfilled++;
			else if (e.outcome === 'partly') partly++;
			else if (e.outcome === 'not-fulfilled') notFulfilled++;
			if (e.probability != null) {
				const diff = e.probability - v;
				brierSum += diff * diff;
				brierN++;
			}
		}
		rows.push({
			sourceCategory,
			n: group.length,
			hitRate: weighted / group.length,
			fulfilled,
			partly,
			notFulfilled,
			brier: brierN > 0 ? brierSum / brierN : null,
			brierN,
		});
	}
	rows.sort((a, b) => b.n - a.n);
	return rows;
}

export interface VibeHitRate {
	vibe: AugurVibe;
	n: number;
	hitRate: number; // 0..1, weighted
	/**
	 * For 'good' / 'bad' vibes, how often did the directionality match?
	 *  - good vibe + fulfilled → directional hit
	 *  - bad vibe + not-fulfilled → directional hit (your "warning" was right
	 *    that it wouldn't happen)
	 *  - mysterious → no direction expected, returns null.
	 */
	directionalHitRate: number | null;
}

export function vibeHitRates(entries: AugurEntry[]): VibeHitRate[] {
	const order: AugurVibe[] = ['good', 'mysterious', 'bad'];
	const rows: VibeHitRate[] = [];
	for (const vibe of order) {
		const group = entries.filter((e) => e.vibe === vibe && isScored(e));
		if (group.length === 0) {
			rows.push({ vibe, n: 0, hitRate: 0, directionalHitRate: null });
			continue;
		}
		let weighted = 0;
		let directionalHit = 0;
		let directionalN = 0;
		for (const e of group) {
			const v = outcomeValue(e.outcome)!;
			weighted += v;
			if (vibe === 'good') {
				directionalN++;
				if (e.outcome === 'fulfilled') directionalHit++;
				else if (e.outcome === 'partly') directionalHit += 0.5;
			} else if (vibe === 'bad') {
				directionalN++;
				if (e.outcome === 'not-fulfilled') directionalHit++;
				else if (e.outcome === 'partly') directionalHit += 0.5;
			}
		}
		rows.push({
			vibe,
			n: group.length,
			hitRate: weighted / group.length,
			directionalHitRate: directionalN > 0 ? directionalHit / directionalN : null,
		});
	}
	return rows;
}

export interface OverallStats {
	total: number;
	resolved: number;
	open: number;
	hitRate: number | null;
	brier: number | null;
	brierN: number;
}

export function overallStats(entries: AugurEntry[]): OverallStats {
	let resolved = 0;
	let open = 0;
	let weighted = 0;
	let brierSum = 0;
	let brierN = 0;
	for (const e of entries) {
		if (e.outcome === 'open') {
			open++;
			continue;
		}
		const v = outcomeValue(e.outcome);
		if (v == null) continue;
		resolved++;
		weighted += v;
		if (e.probability != null) {
			const diff = e.probability - v;
			brierSum += diff * diff;
			brierN++;
		}
	}
	return {
		total: entries.length,
		resolved,
		open,
		hitRate: resolved > 0 ? weighted / resolved : null,
		brier: brierN > 0 ? brierSum / brierN : null,
		brierN,
	};
}

/** UI threshold: below this, OracleView shows the cold-start empty state. */
export const ORACLE_COLD_START_MIN = 20;
