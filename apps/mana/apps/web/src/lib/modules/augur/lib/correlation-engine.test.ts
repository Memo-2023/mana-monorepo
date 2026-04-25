/**
 * Augur — Correlation Engine.
 *
 * Tests the cross-module signal threshold: a finding only surfaces when
 * the bucket mean differs from the user's baseline by ≥ 0.3σ AND the
 * bucket has ≥ 5 metric-readings. Covers both gates with synthetic
 * mood/sleep maps so we don't drag Dexie into the test.
 */

import { describe, expect, it } from 'vitest';
import {
	CORRELATION_MIN_N,
	CORRELATION_MIN_STDEV_DELTA,
	computeCorrelations,
	type MoodByDate,
	type SleepByDate,
} from './correlation-engine';
import type { AugurEntry } from '../types';

let nextId = 0;

function fixture(overrides: Partial<AugurEntry> = {}): AugurEntry {
	return {
		id: `e${nextId++}`,
		kind: 'hunch',
		source: 'gut',
		sourceCategory: 'gut',
		claim: 'foo',
		vibe: 'good',
		feltMeaning: null,
		expectedOutcome: null,
		expectedBy: null,
		probability: null,
		outcome: 'fulfilled',
		outcomeNote: null,
		resolvedAt: null,
		encounteredAt: '2026-01-15',
		tags: [],
		relatedDreamId: null,
		relatedDecisionId: null,
		livingOracleSnapshot: null,
		isPrivate: true,
		isArchived: false,
		visibility: 'private',
		unlistedToken: '',
		unlistedExpiresAt: null,
		createdAt: '2026-01-15T00:00:00Z',
		updatedAt: '2026-01-15T00:00:00Z',
		...overrides,
	};
}

function dateRange(start: string, days: number): string[] {
	const out: string[] = [];
	const d = new Date(start);
	for (let i = 0; i < days; i++) {
		out.push(d.toISOString().slice(0, 10));
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return out;
}

describe('computeCorrelations — baseline thresholds', () => {
	it('returns empty when there are no entries', () => {
		const findings = computeCorrelations([], new Map(), new Map());
		expect(findings).toEqual([]);
	});

	it('returns empty when baseline distribution is too small', () => {
		const mood: MoodByDate = new Map([
			['2026-01-16', 5],
			['2026-01-17', 6],
		]);
		const findings = computeCorrelations(
			[fixture({ encounteredAt: '2026-01-15' })],
			mood,
			new Map()
		);
		expect(findings).toEqual([]);
	});

	it('returns empty when baseline σ is zero (constant data)', () => {
		// All mood values identical → σ = 0 → engine refuses to opine.
		const mood: MoodByDate = new Map(dateRange('2026-01-01', 30).map((d) => [d, 5] as const));
		const findings = computeCorrelations(
			[fixture({ encounteredAt: '2026-01-15' })],
			mood,
			new Map()
		);
		expect(findings).toEqual([]);
	});
});

describe('computeCorrelations — signal threshold', () => {
	it('does not surface findings below 0.3σ delta', () => {
		// Baseline: 5..14 (μ≈9.5, σ≈3). Any reading 9-10 sits well within 0.3σ.
		const mood: MoodByDate = new Map(
			dateRange('2026-01-01', 30).map((d, i) => [d, (i % 10) + 5] as const)
		);
		// Entries spread thinly across the year, all next-day readings near baseline.
		const entries = dateRange('2026-01-01', 5).map((d) =>
			fixture({ encounteredAt: d, vibe: 'good' })
		);
		const findings = computeCorrelations(entries, mood, new Map());
		const goodMood = findings.filter(
			(f) => f.dimension === 'vibe' && f.bucket === 'good' && f.metric === 'mood-level'
		);
		// Should be at most a small one; if present, must be over the threshold.
		for (const f of goodMood) {
			expect(Math.abs(f.deltaSigmas)).toBeGreaterThanOrEqual(CORRELATION_MIN_STDEV_DELTA);
		}
	});

	it('surfaces a strong negative finding when the bucket consistently drops mood', () => {
		// Baseline mood spans 1-10 evenly → σ ≈ 2.87.
		const baselineDates = dateRange('2026-01-01', 30);
		const mood: MoodByDate = new Map(baselineDates.map((d, i) => [d, (i % 10) + 1] as const));

		// Add 6 'bad'-vibe augur entries with their 3-day windows landing on
		// mood-1 days (the bottom of the range). Pick days carefully so the
		// next 3 days each land on a mood-1 day.
		const lowMoodDates = dateRange('2026-02-01', 8);
		for (const d of lowMoodDates) mood.set(d, 1);

		const entries: AugurEntry[] = [];
		for (let i = 0; i < 6; i++) {
			// encounteredAt = day before the low-mood patch starts so windows hit it
			entries.push(fixture({ vibe: 'bad', encounteredAt: '2026-01-31' }));
		}

		const findings = computeCorrelations(entries, mood, new Map());
		const badMood = findings.find(
			(f) => f.dimension === 'vibe' && f.bucket === 'bad' && f.metric === 'mood-level'
		);
		expect(badMood).toBeDefined();
		expect(badMood!.delta).toBeLessThan(0);
		expect(Math.abs(badMood!.deltaSigmas)).toBeGreaterThanOrEqual(CORRELATION_MIN_STDEV_DELTA);
		expect(badMood!.n).toBeGreaterThanOrEqual(CORRELATION_MIN_N);
	});
});

describe('computeCorrelations — sleep-quality / sleep-duration', () => {
	it('treats sleep quality and duration as independent metrics', () => {
		// Baseline: 30 days of varied quality + duration.
		const sleep: SleepByDate = new Map(
			dateRange('2026-01-01', 30).map(
				(d, i) => [d, { quality: (i % 5) + 1, durationMin: 360 + (i % 10) * 30 }] as const
			)
		);
		// Plant a strong drop in quality after some 'bad' vibe days.
		const dropDates = dateRange('2026-02-01', 8);
		for (const d of dropDates) {
			const cur = sleep.get(d) ?? { quality: 3, durationMin: 480 };
			sleep.set(d, { quality: 1, durationMin: cur.durationMin });
		}
		const entries: AugurEntry[] = [];
		for (let i = 0; i < 6; i++) {
			entries.push(fixture({ vibe: 'bad', encounteredAt: '2026-01-31' }));
		}
		const findings = computeCorrelations(entries, new Map(), sleep);
		const sq = findings.find(
			(f) => f.dimension === 'vibe' && f.bucket === 'bad' && f.metric === 'sleep-quality'
		);
		expect(sq).toBeDefined();
		expect(sq!.delta).toBeLessThan(0);
	});
});

describe('computeCorrelations — sort order', () => {
	it('strongest |Δσ| comes first', () => {
		const mood: MoodByDate = new Map(
			dateRange('2026-01-01', 60).map((d, i) => [d, (i % 10) + 1] as const)
		);
		// Two distinct buckets with different effect sizes
		const drop = dateRange('2026-02-01', 10);
		for (const d of drop) mood.set(d, 1);
		const slight = dateRange('2026-02-15', 10);
		for (const d of slight) mood.set(d, 4);

		const entries: AugurEntry[] = [
			...Array.from({ length: 6 }).map(() => fixture({ vibe: 'bad', encounteredAt: '2026-01-31' })),
			...Array.from({ length: 6 }).map(() =>
				fixture({ vibe: 'good', encounteredAt: '2026-02-14' })
			),
		];
		const findings = computeCorrelations(entries, mood, new Map());
		if (findings.length >= 2) {
			expect(Math.abs(findings[0]!.deltaSigmas)).toBeGreaterThanOrEqual(
				Math.abs(findings[1]!.deltaSigmas)
			);
		}
	});
});
