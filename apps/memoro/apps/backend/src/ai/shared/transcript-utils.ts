/**
 * Shared utility functions for handling transcript generation from utterances
 * Used across multiple edge functions
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
	if (!utterances || !Array.isArray(utterances) || utterances.length === 0) {
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
 * Get transcript text from memo (generates from utterances or returns legacy transcript)
 * @param memo - The memo object
 * @returns The transcript text
 */
export function getTranscriptText(memo: any): string {
	// If utterances exist, generate transcript from them
	if (
		memo?.source?.utterances &&
		Array.isArray(memo.source.utterances) &&
		memo.source.utterances.length > 0
	) {
		return generateTranscriptFromUtterances(memo.source.utterances);
	}

	// Fall back to legacy transcript fields for backward compatibility
	return (
		memo?.transcript ||
		memo?.source?.transcript ||
		memo?.source?.content ||
		memo?.source?.transcription ||
		memo?.source?.text ||
		memo?.metadata?.transcript ||
		''
	);
}

/**
 * Get transcript from additional recording
 * @param recording - The additional recording object
 * @returns The transcript text
 */
export function getRecordingTranscript(recording: any): string {
	// If utterances exist, generate transcript from them
	if (
		recording?.utterances &&
		Array.isArray(recording.utterances) &&
		recording.utterances.length > 0
	) {
		return generateTranscriptFromUtterances(recording.utterances);
	}

	// Fall back to transcript field
	return recording?.transcript || '';
}
