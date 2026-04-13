/**
 * Semantic Memory types — Extracted user knowledge that persists across sessions.
 *
 * Memory facts represent patterns, preferences, and context inferred from
 * the event stream. They are more durable and compact than raw events —
 * "User trains Mon/Wed/Fri evenings" is one fact vs. hundreds of events.
 *
 * Confidence lifecycle:
 *   New fact         → 0.3
 *   Confirmed again  → +0.15 (cap 0.95)
 *   Contradicted     → -0.15
 *   Not seen 30 days → -0.05/week
 *   Below 0.1        → deleted
 */

export interface MemoryFact {
	id: string;
	category: MemoryCategory;
	/** Human-readable description of the fact */
	content: string;
	/** 0.0 to 1.0 — rises with confirmations, decays with time/contradictions */
	confidence: number;
	confirmations: number;
	contradictions: number;
	/** Which modules contributed to this fact */
	sourceModules: string[];
	/** Machine-readable key for deduplication (e.g. 'pattern:drink:morning_coffee') */
	factKey: string;
	firstSeen: string;
	lastConfirmed: string;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
}

export type MemoryCategory = 'pattern' | 'preference' | 'context';

/** Correlation between two daily metrics */
export interface Correlation {
	id: string;
	factorA: { module: string; metric: string; label: string };
	factorB: { module: string; metric: string; label: string };
	coefficient: number;
	sampleSize: number;
	direction: 'positive' | 'negative';
	sentence: string;
	computedAt: string;
}
