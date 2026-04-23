/**
 * Shared types for the tick loop. Narrow shapes that match what
 * mana-auth's internal endpoints expect — the runner is a pure producer
 * here, the schema authority lives in mana-auth.
 */

export interface ActionRow {
	tickId: string;
	toolName: string;
	inputHash?: string;
	result: 'ok' | 'error';
	errorMessage?: string;
	latencyMs?: number;
}

export interface FeedbackRow {
	tickId: string;
	module: string;
	rating: 1 | 2 | 3 | 4 | 5;
	notes?: string;
}
