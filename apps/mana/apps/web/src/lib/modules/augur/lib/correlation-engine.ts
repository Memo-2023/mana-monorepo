/**
 * Augur — Correlation Engine
 *
 * Cross-module mining: for every augur entry, look at the user's mood
 * level and sleep quality / duration in the days *after* `encounteredAt`
 * and compare those windows against the user's overall baseline.
 *
 * Pure functions: no Dexie, no Svelte runes. Caller (OracleView via
 * `signal-bridge.svelte.ts`) supplies pre-aggregated maps.
 *
 * Honest framing in the UI is non-negotiable: this finds *correlations
 * within the user's own data*, not causation. The threshold logic
 * below (n ≥ 5, |Δ| ≥ 0.3 baseline-stdev) errs on the side of silence.
 */

import type { AugurEntry, AugurKind, AugurVibe } from '../types';

export const CORRELATION_MIN_N = 5;
/** A finding is shown when the bucket mean differs from baseline by at
 *  least this many standard-deviations. 0.3σ is a soft signal — well
 *  below "statistically significant" but enough to be worth noticing. */
export const CORRELATION_MIN_STDEV_DELTA = 0.3;

export type CorrelationDimension = 'vibe' | 'kind';
export type CorrelationMetric = 'mood-level' | 'sleep-quality' | 'sleep-duration';
export type CorrelationWindow = 1 | 3 | 7;

export interface CorrelationFinding {
	dimension: CorrelationDimension;
	bucket: AugurVibe | AugurKind;
	metric: CorrelationMetric;
	windowDays: CorrelationWindow;
	baseline: number;
	bucketMean: number;
	delta: number;
	deltaSigmas: number;
	n: number;
}

/** Map from YYYY-MM-DD to the mean mood level on that day, or undefined. */
export type MoodByDate = Map<string, number>;

export interface SleepDay {
	quality: number;
	durationMin: number;
}
export type SleepByDate = Map<string, SleepDay>;

/** Calendar shift on a YYYY-MM-DD date; positive = forward. */
function addDays(iso: string, delta: number): string {
	const d = new Date(iso);
	d.setUTCDate(d.getUTCDate() + delta);
	return d.toISOString().slice(0, 10);
}

function mean(xs: number[]): number {
	if (xs.length === 0) return 0;
	let s = 0;
	for (const x of xs) s += x;
	return s / xs.length;
}

function stdev(xs: number[]): number {
	if (xs.length < 2) return 0;
	const m = mean(xs);
	let s = 0;
	for (const x of xs) s += (x - m) ** 2;
	return Math.sqrt(s / (xs.length - 1));
}

function metricValue(
	metric: CorrelationMetric,
	mood: MoodByDate,
	sleep: SleepByDate,
	date: string
): number | null {
	switch (metric) {
		case 'mood-level':
			return mood.get(date) ?? null;
		case 'sleep-quality':
			return sleep.get(date)?.quality ?? null;
		case 'sleep-duration':
			return sleep.get(date)?.durationMin ?? null;
	}
}

/** Pull every value for the metric in [date+1 .. date+windowDays]. */
function readWindow(
	metric: CorrelationMetric,
	mood: MoodByDate,
	sleep: SleepByDate,
	startDate: string,
	windowDays: CorrelationWindow
): number[] {
	const xs: number[] = [];
	for (let d = 1; d <= windowDays; d++) {
		const v = metricValue(metric, mood, sleep, addDays(startDate, d));
		if (v != null) xs.push(v);
	}
	return xs;
}

function bucketKey(dim: CorrelationDimension, e: AugurEntry): AugurVibe | AugurKind {
	return dim === 'vibe' ? e.vibe : e.kind;
}

/** All buckets the engine considers, in stable display order. */
const VIBE_BUCKETS: AugurVibe[] = ['good', 'mysterious', 'bad'];
const KIND_BUCKETS: AugurKind[] = ['omen', 'fortune', 'hunch'];
const WINDOWS: CorrelationWindow[] = [3];
const METRICS: CorrelationMetric[] = ['mood-level', 'sleep-quality', 'sleep-duration'];

export function computeCorrelations(
	entries: AugurEntry[],
	mood: MoodByDate,
	sleep: SleepByDate
): CorrelationFinding[] {
	if (entries.length === 0) return [];

	const out: CorrelationFinding[] = [];

	for (const metric of METRICS) {
		// Build the user's baseline distribution for this metric — every value
		// the metric ever took, regardless of augur entries. Used both for the
		// baseline mean and the σ that drives the signal threshold.
		const baselineValues: number[] =
			metric === 'mood-level'
				? Array.from(mood.values())
				: Array.from(sleep.values()).map((s) =>
						metric === 'sleep-quality' ? s.quality : s.durationMin
					);
		if (baselineValues.length < CORRELATION_MIN_N) continue;

		const baseline = mean(baselineValues);
		const sigma = stdev(baselineValues);
		if (sigma === 0) continue;

		for (const window of WINDOWS) {
			const dimensions: {
				dim: CorrelationDimension;
				buckets: readonly (AugurVibe | AugurKind)[];
			}[] = [
				{ dim: 'vibe', buckets: VIBE_BUCKETS },
				{ dim: 'kind', buckets: KIND_BUCKETS },
			];

			for (const { dim, buckets } of dimensions) {
				for (const bucket of buckets) {
					const bucketEntries = entries.filter((e) => bucketKey(dim, e) === bucket);
					if (bucketEntries.length === 0) continue;

					const vals: number[] = [];
					for (const e of bucketEntries) {
						vals.push(...readWindow(metric, mood, sleep, e.encounteredAt, window));
					}
					if (vals.length < CORRELATION_MIN_N) continue;

					const m = mean(vals);
					const delta = m - baseline;
					const deltaSigmas = delta / sigma;

					if (Math.abs(deltaSigmas) < CORRELATION_MIN_STDEV_DELTA) continue;

					out.push({
						dimension: dim,
						bucket,
						metric,
						windowDays: window,
						baseline,
						bucketMean: m,
						delta,
						deltaSigmas,
						n: vals.length,
					});
				}
			}
		}
	}

	out.sort((a, b) => Math.abs(b.deltaSigmas) - Math.abs(a.deltaSigmas));
	return out;
}
