import { SpeakerUtterance } from '../types/memo.types';

/**
 * Generates a speakerMap from an array of utterances
 * Groups utterances by speakerId for UI display purposes
 *
 * @param utterances - Array of speaker utterances
 * @returns Record mapping speakerId to array of utterances
 */
export function generateSpeakerMapFromUtterances(
	utterances: SpeakerUtterance[] | null | undefined
): Record<string, SpeakerUtterance[]> {
	if (!utterances || utterances.length === 0) {
		return {};
	}

	const speakerMap: Record<string, SpeakerUtterance[]> = {};

	utterances.forEach((utterance) => {
		const speakerId = utterance.speakerId || 'unknown';

		if (!speakerMap[speakerId]) {
			speakerMap[speakerId] = [];
		}

		speakerMap[speakerId].push({
			text: utterance.text,
			offset: utterance.offset,
			duration: utterance.duration,
			speakerId: utterance.speakerId,
		});
	});

	return speakerMap;
}

/**
 * Gets unique speaker IDs from utterances
 *
 * @param utterances - Array of speaker utterances
 * @returns Array of unique speaker IDs
 */
export function getUniqueSpeakerIds(utterances: SpeakerUtterance[] | null | undefined): string[] {
	if (!utterances || utterances.length === 0) {
		return [];
	}

	const speakerIds = new Set<string>();

	utterances.forEach((utterance) => {
		if (utterance.speakerId) {
			speakerIds.add(utterance.speakerId);
		}
	});

	return Array.from(speakerIds).sort();
}

/**
 * Counts utterances per speaker
 *
 * @param utterances - Array of speaker utterances
 * @returns Record mapping speakerId to utterance count
 */
export function countUtterancesPerSpeaker(
	utterances: SpeakerUtterance[] | null | undefined
): Record<string, number> {
	if (!utterances || utterances.length === 0) {
		return {};
	}

	const counts: Record<string, number> = {};

	utterances.forEach((utterance) => {
		const speakerId = utterance.speakerId || 'unknown';
		counts[speakerId] = (counts[speakerId] || 0) + 1;
	});

	return counts;
}
