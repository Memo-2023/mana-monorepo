/**
 * Augur — Living Oracle
 *
 * The killer mechanic from docs/plans/augur-module.md M4.5: when the
 * user captures a new sign, look up the user's *own* past resolved
 * signs that resemble it and surface what happened to those.
 *
 * Empirism wearing the cloak of divination — the magic isn't claimed,
 * it materialises from the user's own data.
 *
 * Pure deterministic stats here. The (optional) LLM-phrasing layer
 * lives outside this file; if it's not wired up we still produce a
 * usable nuechtern message.
 *
 * Cold-start gate: under 50 resolved entries the engine refuses to
 * speak. Below that, statistics are too noisy and the user would
 * trust patterns that aren't there.
 */

import { isScored, outcomeValue } from './calibration';
import type { AugurEntry, AugurKind, AugurSourceCategory, AugurVibe } from '../types';

export const LIVING_ORACLE_COLD_START_MIN = 50;
export const LIVING_ORACLE_MIN_MATCHES = 3;
export const LIVING_ORACLE_MIN_SCORE = 2;

/** Components used to compare two entries for "similarity". */
export interface Fingerprint {
	kind: AugurKind;
	sourceCategory: AugurSourceCategory;
	vibe: AugurVibe;
	tags: Set<string>;
	keywords: Set<string>;
}

/** Build a fingerprint from a (possibly partial) entry-shape. */
export function fingerprint(input: {
	kind?: AugurKind | null;
	sourceCategory?: AugurSourceCategory | null;
	vibe?: AugurVibe | null;
	tags?: string[] | null;
	source?: string | null;
	claim?: string | null;
}): Fingerprint | null {
	if (!input.kind || !input.sourceCategory || !input.vibe) return null;
	return {
		kind: input.kind,
		sourceCategory: input.sourceCategory,
		vibe: input.vibe,
		tags: new Set((input.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean)),
		keywords: extractKeywords([input.source, input.claim].filter(Boolean).join(' ')),
	};
}

/** Tokenize a free-text blob into deduped lowercase keywords ≥4 chars. */
export function extractKeywords(text: string): Set<string> {
	const STOP = new Set([
		'oder',
		'aber',
		'doch',
		'eine',
		'einer',
		'einen',
		'eines',
		'einem',
		'wenn',
		'dann',
		'noch',
		'sehr',
		'mehr',
		'auch',
		'durch',
		'ueber',
		'unter',
		'gegen',
		'sich',
		'haben',
		'hatte',
		'sein',
		'sind',
		'wird',
		'wurde',
		'kann',
		'koennen',
		'wie',
		'was',
		'warum',
		'wann',
		'wer',
		'this',
		'that',
		'have',
		'with',
		'from',
		'they',
		'will',
		'been',
		'were',
		'when',
		'what',
		'just',
	]);
	return new Set(
		text
			.toLowerCase()
			.normalize('NFKD')
			.replace(/[^a-z0-9\säöüß]/g, ' ')
			.split(/\s+/)
			.filter((w) => w.length >= 4 && !STOP.has(w))
	);
}

/**
 * Component-overlap score (0..5). 1 point per overlapping component:
 *
 *   kind, sourceCategory, vibe → exact match
 *   tags → at least one shared tag
 *   keywords → at least one shared keyword
 *
 * The pragmatic threshold for "this is a similar sign" is `>= 2`.
 */
export function matchScore(a: Fingerprint, b: Fingerprint): number {
	let score = 0;
	if (a.kind === b.kind) score++;
	if (a.sourceCategory === b.sourceCategory) score++;
	if (a.vibe === b.vibe) score++;
	if (intersects(a.tags, b.tags)) score++;
	if (intersects(a.keywords, b.keywords)) score++;
	return score;
}

function intersects<T>(a: Set<T>, b: Set<T>): boolean {
	if (a.size === 0 || b.size === 0) return false;
	const [small, big] = a.size <= b.size ? [a, b] : [b, a];
	for (const x of small) if (big.has(x)) return true;
	return false;
}

export interface OracleMatchSet {
	matches: AugurEntry[];
	n: number;
	hitRate: number;
	fulfilled: number;
	partly: number;
	notFulfilled: number;
}

/** Find the resolved past entries that match `input` strongly enough. */
export function findMatches(
	input: Fingerprint,
	history: AugurEntry[],
	excludeId?: string
): OracleMatchSet {
	const matches: AugurEntry[] = [];
	for (const e of history) {
		if (e.id === excludeId) continue;
		if (!isScored(e)) continue;
		const fp = fingerprint(e);
		if (!fp) continue;
		if (matchScore(input, fp) >= LIVING_ORACLE_MIN_SCORE) matches.push(e);
	}
	let weighted = 0;
	let fulfilled = 0;
	let partly = 0;
	let notFulfilled = 0;
	for (const m of matches) {
		const v = outcomeValue(m.outcome) ?? 0;
		weighted += v;
		if (m.outcome === 'fulfilled') fulfilled++;
		else if (m.outcome === 'partly') partly++;
		else if (m.outcome === 'not-fulfilled') notFulfilled++;
	}
	return {
		matches,
		n: matches.length,
		hitRate: matches.length > 0 ? weighted / matches.length : 0,
		fulfilled,
		partly,
		notFulfilled,
	};
}

/**
 * Decide whether the engine should speak at all, given the history size
 * and the match-set. Below the cold-start threshold or below the min
 * match count → silent.
 */
export function shouldSpeak(historyTotal: number, set: OracleMatchSet): boolean {
	if (historyTotal < LIVING_ORACLE_COLD_START_MIN) return false;
	return set.n >= LIVING_ORACLE_MIN_MATCHES;
}

/**
 * Build a nuechterner deterministic reflection. No LLM, no hallucinations.
 * Returns null when shouldSpeak is false. The string is what gets stored
 * into `livingOracleSnapshot` for audit at resolve-time.
 */
export function makeReflection(set: OracleMatchSet): string | null {
	if (set.n < LIVING_ORACLE_MIN_MATCHES) return null;
	const pct = Math.round(set.hitRate * 100);
	const parts: string[] = [];
	parts.push(`Du hast ${set.n} aehnliche Zeichen schon einmal protokolliert.`);
	const breakdown: string[] = [];
	if (set.fulfilled) breakdown.push(`${set.fulfilled} eingetreten`);
	if (set.partly) breakdown.push(`${set.partly} teilweise`);
	if (set.notFulfilled) breakdown.push(`${set.notFulfilled} nicht eingetreten`);
	if (breakdown.length > 0) parts.push(`Davon: ${breakdown.join(', ')}.`);
	parts.push(`Trefferquote bei aehnlichen Mustern: ${pct}%.`);
	return parts.join(' ');
}
