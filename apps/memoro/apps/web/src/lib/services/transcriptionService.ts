/**
 * Transcription Service for Memoro Web
 * Triggers transcription via the new Hono/Bun memoro-server.
 */

import { env } from '$lib/config/env';
import { MemoroEvents } from '@manacore/shared-utils/analytics';

const SERVER_URL = env.server.memoroUrl.replace(/\/$/, '');

export interface TranscriptionRequestResult {
	success: boolean;
	error?: string;
	isNetworkError?: boolean;
	userMessage?: string;
	technicalMessage?: string;
}

export interface TranscriptionParams {
	userId: string;
	fileName: string;
	duration: number;
	memoId?: string;
	spaceId?: string;
	recordingLanguages?: string[];
	title?: string;
	blueprintId?: string;
	mediaType?: 'audio' | 'video';
}

export async function triggerTranscription({
	userId,
	fileName,
	duration,
	memoId,
	spaceId,
	recordingLanguages,
	title,
	blueprintId,
	accessToken,
	mediaType,
}: TranscriptionParams & { accessToken: string }): Promise<TranscriptionRequestResult> {
	try {
		if (!accessToken) {
			return { success: false, error: 'No authenticated token found' };
		}

		const filePath = `${userId}/${fileName}`;

		const response = await fetch(`${SERVER_URL}/api/v1/memos`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				filePath,
				duration,
				memoId,
				spaceId,
				recordingLanguages,
				title,
				blueprintId,
				mediaType,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			return {
				success: false,
				error: errorText,
				isNetworkError: response.status >= 500,
				userMessage: 'Transcription could not be started',
				technicalMessage: errorText,
			};
		}

		MemoroEvents.memoCreated(mediaType);
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: String(error),
			isNetworkError: true,
			userMessage: 'An error occurred while starting transcription',
			technicalMessage: String(error),
		};
	}
}
