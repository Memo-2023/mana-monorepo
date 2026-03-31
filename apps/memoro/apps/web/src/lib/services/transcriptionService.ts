/**
 * Transcription Service for Memoro Web
 * Handles audio transcription via memoro-service middleware
 *
 * Pattern adapted from memoro_app/features/storage/transcriptionUtils.ts
 */

import { env } from '$lib/config/env';

const MEMORO_SERVICE_URL = env.middleware.memoroUrl.replace(/\/$/, '');

/**
 * Enhanced transcription result with network error information
 */
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

/**
 * Transcribes via Memoro Service (which handles intelligent routing)
 */
async function transcribeViaMemoryService(
	audioPath: string,
	appToken: string,
	duration: number,
	memoId?: string,
	spaceId?: string,
	recordingLanguages?: string[],
	title?: string,
	blueprintId?: string,
	mediaType?: 'audio' | 'video'
): Promise<Response> {
	console.debug('🎯 Using Memoro Service for intelligent transcription routing');

	return fetch(`${MEMORO_SERVICE_URL}/memoro/process-uploaded-audio`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${appToken}`,
		},
		body: JSON.stringify({
			filePath: audioPath,
			duration,
			memoId,
			spaceId,
			recordingLanguages,
			title,
			blueprintId,
			mediaType,
		}),
	});
}

/**
 * Triggers transcription via memoro-service (which handles intelligent routing)
 */
export async function triggerTranscription({
	userId,
	fileName,
	duration,
	memoId,
	spaceId,
	recordingLanguages,
	title,
	blueprintId,
	appToken,
	mediaType,
}: TranscriptionParams & { appToken: string }): Promise<TranscriptionRequestResult> {
	try {
		if (!appToken) {
			const errorMsg = 'No authenticated token found';
			return { success: false, error: errorMsg };
		}

		const audioPath = `${userId}/${fileName}`;

		console.debug('🎯 Triggering transcription with:', {
			audioPath,
			duration,
			memoId,
			spaceId,
			title,
			blueprintId,
			recordingLanguages,
		});

		// Let memoro-service handle the intelligent routing
		const transcribeResponse = await transcribeViaMemoryService(
			audioPath,
			appToken,
			duration,
			memoId,
			spaceId,
			recordingLanguages,
			title,
			blueprintId,
			mediaType
		);

		// Handle response
		if (!transcribeResponse.ok) {
			const errorText = await transcribeResponse.text();
			console.debug('Error calling transcription via Memoro Service:', {
				status: transcribeResponse.status,
				statusText: transcribeResponse.statusText,
				errorText,
			});

			return {
				success: false,
				error: errorText,
				isNetworkError: transcribeResponse.status >= 500,
				userMessage: 'Transcription could not be started',
				technicalMessage: errorText,
			};
		}

		console.debug('✅ Transcription started successfully via Memoro Service');
		return { success: true };
	} catch (error) {
		console.debug('Error triggering transcription:', error);

		return {
			success: false,
			error: String(error),
			isNetworkError: true,
			userMessage: 'An error occurred while starting transcription',
			technicalMessage: String(error),
		};
	}
}
