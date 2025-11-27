/**
 * Utility functions for handling transcript generation from utterances
 */

/**
 * Generate a plain text transcript from utterances array
 * @param utterances - Array of utterance objects with text property
 * @returns Plain text transcript string
 */
export function generateTranscriptFromUtterances(
	utterances?: Array<{
		text: string;
		speakerId?: string;
		offset?: number;
		duration?: number;
	}> | null
): string {
	if (!utterances || utterances.length === 0) {
		return '';
	}

	// Sort utterances by offset if available
	const sortedUtterances = [...utterances].sort((a, b) => {
		const offsetA = a.offset || 0;
		const offsetB = b.offset || 0;
		return offsetA - offsetB;
	});

	// Concatenate all utterance texts with spaces
	return sortedUtterances
		.map((utterance) => utterance.text)
		.filter((text) => text && text.trim() !== '')
		.join(' ');
}

/**
 * Check if transcript data exists (either in utterances or legacy transcript fields)
 * @param memo - The memo object to check
 * @returns Boolean indicating if transcript exists
 */
export function hasTranscript(memo: any): boolean {
	// Check utterances first (new structure)
	if (memo?.source?.utterances && memo.source.utterances.length > 0) {
		return true;
	}

	// Check legacy fields for backward compatibility
	return !!(
		memo?.transcript ||
		memo?.source?.transcript ||
		memo?.source?.content ||
		memo?.source?.transcription ||
		memo?.metadata?.transcript
	);
}

/**
 * Get transcript text from memo (generates from utterances or returns legacy transcript)
 * @param memo - The memo object
 * @returns The transcript text
 */
export function getTranscriptText(memo: any): string {
	// If utterances exist, generate transcript from them
	if (memo?.source?.utterances && memo.source.utterances.length > 0) {
		return generateTranscriptFromUtterances(memo.source.utterances);
	}

	// Fall back to legacy transcript fields
	return (
		memo?.transcript ||
		memo?.source?.transcript ||
		memo?.source?.content ||
		memo?.source?.transcription ||
		memo?.metadata?.transcript ||
		''
	);
}

/**
 * Get utterances from various possible locations in memo
 * @param memo - The memo object
 * @returns Array of utterances or null
 */
export function getUtterances(
	memo: any
): Array<{ text: string; speakerId?: string; offset?: number; duration?: number }> | null {
	// Check primary location
	if (memo?.source?.utterances && Array.isArray(memo.source.utterances)) {
		return memo.source.utterances;
	}

	// Check metadata location (for backward compatibility)
	if (memo?.metadata?.utterances && Array.isArray(memo.metadata.utterances)) {
		return memo.metadata.utterances;
	}

	// If only transcript exists, create a single utterance
	const transcriptText =
		memo?.transcript ||
		memo?.source?.transcript ||
		memo?.source?.content ||
		memo?.source?.transcription ||
		memo?.metadata?.transcript;

	if (transcriptText) {
		return [
			{
				text: transcriptText,
				speakerId: 'default',
				offset: 0,
				duration: 0,
			},
		];
	}

	return null;
}

/**
 * Check if a memo is a combined memo
 * @param memo - The memo object
 * @returns Boolean indicating if it's a combined memo
 */
export function isCombinedMemo(memo: any): boolean {
	return memo?.source?.type === 'combined';
}

/**
 * Get combined memo recordings with their transcripts
 * @param memo - The memo object
 * @returns Array of recordings with transcript data or empty array
 */
export function getCombinedMemoRecordings(memo: any): Array<{
	title: string;
	transcript: string;
	utterances: Array<{ text: string; speakerId: string; offset: number; duration: number }>;
	speakers: Record<string, string>;
	timestamp: string;
	index: number;
}> {
	if (!isCombinedMemo(memo) || !memo?.source?.additional_recordings) {
		return [];
	}

	return memo.source.additional_recordings.map((recording: any, index: number) => {
		const memoMetadata = recording.memo_metadata || {};

		return {
			title: memoMetadata.original_title || memoMetadata.display_title || `Recording ${index + 1}`,
			transcript: recording.transcript || '',
			utterances: recording.utterances || [],
			speakers: recording.speakers || {},
			timestamp: recording.timestamp || memoMetadata.original_created_at || '',
			index: memoMetadata.combine_index ?? index,
		};
	});
}

/**
 * Calculate total audio duration for combined memos
 * @param memo - The memo object
 * @returns Total duration in seconds or 0
 */
export function getCombinedMemoDuration(memo: any): number {
	if (!isCombinedMemo(memo) || !memo?.source?.additional_recordings) {
		return 0;
	}

	let totalDuration = 0;

	memo.source.additional_recordings.forEach((recording: any) => {
		if (recording.duration) {
			totalDuration += recording.duration;
		}
	});

	return totalDuration;
}
