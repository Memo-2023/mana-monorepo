/**
 * Credit cost constants and helper for Memoro server.
 */

export { validateCredits, consumeCredits } from '@manacore/shared-hono';

export const COSTS = {
	TRANSCRIPTION_PER_MINUTE: 2,
	HEADLINE_GENERATION: 10,
	MEMORY_CREATION: 10,
	BLUEPRINT_PROCESSING: 5,
	QUESTION_MEMO: 5,
	NEW_MEMORY: 5,
	MEMO_COMBINE: 5,
	MEETING_RECORDING_PER_MINUTE: 2,
} as const;

/**
 * Calculate transcription cost based on audio duration.
 * Minimum cost is 2 Mana (1 minute equivalent).
 */
export function calcTranscriptionCost(durationSeconds: number): number {
	const minutes = durationSeconds / 60;
	return Math.max(Math.ceil(minutes * COSTS.TRANSCRIPTION_PER_MINUTE), 2);
}
