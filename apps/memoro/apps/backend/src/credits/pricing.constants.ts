/**
 * Pricing constants for various operations in the memoro service
 * These should match the costs defined in the app's appCosts.json
 */

export const OPERATION_COSTS = {
	// Transcription costs
	TRANSCRIPTION_PER_MINUTE: 2, // 2 credits per minute of audio

	// Meeting recording costs
	MEETING_RECORDING_PER_MINUTE: 2, // 2 credits per minute of recording (same as transcription)

	// Memory/headline generation
	HEADLINE_GENERATION: 10,
	MEMORY_CREATION: 10,

	// Blueprint operations
	BLUEPRINT_PROCESSING: 5,

	// Question/Memory processing
	QUESTION_MEMO: 5, // 5 mana per question to memo
	NEW_MEMORY: 5, // 5 mana per new memory creation
	MEMO_COMBINE: 5, // 5 mana per memo when combining

	// Other operations
	MEMO_SHARING: 1,
	SPACE_OPERATION: 2,
} as const;

/**
 * Calculate transcription cost based on audio duration
 * @param durationSeconds - Duration of audio in seconds
 * @returns Number of credits required (2 credits per minute, minimum 2 credits)
 */
export function calculateTranscriptionCost(durationSeconds: number): number {
	// Log the input for debugging
	console.log(
		`[calculateTranscriptionCost] Input duration: ${durationSeconds} seconds (${(durationSeconds / 60).toFixed(2)} minutes)`
	);

	const minutes = durationSeconds / 60; // Convert seconds to minutes
	const cost = Math.ceil(minutes * OPERATION_COSTS.TRANSCRIPTION_PER_MINUTE);

	// Apply minimum cost of 2 credits (1 minute worth) to prevent undercharging
	const finalCost = Math.max(cost, 2);

	console.log(
		`[calculateTranscriptionCost] Calculated cost: ${cost}, Final cost (with minimum): ${finalCost} credits`
	);

	return finalCost;
}

/**
 * Calculate memo combination cost based on number of memos
 * @param memoCount - Number of memos being combined
 * @returns Number of credits required
 */
export function calculateMemoCombineCost(memoCount: number): number {
	return memoCount * OPERATION_COSTS.MEMO_COMBINE;
}

/**
 * Calculate transcription cost with length-based pricing
 * Uses existing per-minute pricing but ensures proper length-based calculation
 * @param transcriptLength - Length of transcript in characters
 * @param durationSeconds - Duration of audio in seconds (fallback if no transcript length)
 * @returns Number of credits required
 */
export function calculateTranscriptionCostByLength(
	transcriptLength?: number,
	durationSeconds?: number
): number {
	// If we have transcript length, use it to estimate duration
	if (transcriptLength) {
		// Estimate: ~150 words per minute, ~5 characters per word
		const estimatedWords = transcriptLength / 5;
		const estimatedMinutes = estimatedWords / 150;
		const estimatedSeconds = estimatedMinutes * 60;
		return calculateTranscriptionCost(estimatedSeconds);
	}

	// Fall back to duration-based calculation
	if (durationSeconds) {
		return calculateTranscriptionCost(durationSeconds);
	}

	// Throw error if no length or duration provided
	throw new Error('Cannot calculate transcription cost: no transcript length or duration provided');
}

/**
 * Get operation cost by operation type
 * @param operation - The operation type
 * @returns Number of credits required
 */
export function getOperationCost(operation: keyof typeof OPERATION_COSTS): number {
	return OPERATION_COSTS[operation];
}
