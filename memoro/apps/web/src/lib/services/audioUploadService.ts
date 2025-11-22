import { env } from '$lib/config/env';
import { tokenManager } from '$lib/services/tokenManager';
import { triggerTranscription } from '$lib/services/transcriptionService';

export interface AudioUploadOptions {
	audioBlob: Blob;
	userId: string;
	title?: string;
	duration: number;
	spaceId?: string | null;
	blueprintId?: string | null;
	recordingLanguages?: string[];
	enableDiarization?: boolean;
	recordingDate?: string;
	recordingTime?: string;
}

export interface AudioUploadResult {
	success: boolean;
	memoId?: string;
	error?: string;
	isNetworkError?: boolean;
}

/**
 * Upload audio recording to Supabase Storage and trigger transcription processing
 * This mirrors the mobile app's cloudStorageService.uploadAudioForProcessing() functionality
 */
export async function uploadAndProcessAudio({
	audioBlob,
	userId,
	title = 'New Recording',
	duration,
	spaceId = null,
	blueprintId = null,
	recordingLanguages = [],
	enableDiarization = false,
	recordingDate,
	recordingTime
}: AudioUploadOptions): Promise<AudioUploadResult> {
	try {
		// 1. Generate memoId (UUID v4)
		const memoId = crypto.randomUUID();
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fileName = `${memoId}/audio_${timestamp}.m4a`;

		// 2. Get authenticated token
		const appToken = await tokenManager.getValidToken();
		if (!appToken) {
			return {
				success: false,
				error: 'Authentication failed - no valid token found',
				isNetworkError: false
			};
		}

		// 3. Create FormData for upload
		const formData = new FormData();
		formData.append('file', audioBlob, `audio_${timestamp}.m4a`);

		// 4. Upload to Supabase Storage
		const storagePath = `${userId}/${fileName}`;
		const uploadUrl = `${env.supabase.url}/storage/v1/object/user-uploads/${storagePath}`;

		console.log('Uploading to Supabase Storage:', uploadUrl);

		const uploadResponse = await fetch(uploadUrl, {
			method: 'POST',
			headers: {
				apikey: env.supabase.anonKey,
				Authorization: `Bearer ${appToken}`,
				'x-upsert': 'true'
			},
			body: formData
		});

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text();
			console.error('Storage upload failed:', uploadResponse.status, errorText);

			return {
				success: false,
				error: `Upload failed: ${uploadResponse.status} - ${errorText}`,
				isNetworkError: uploadResponse.status >= 500 || uploadResponse.status === 0
			};
		}

		const uploadData = await uploadResponse.json();
		console.log('Upload successful:', uploadData);

		// 5. Trigger transcription processing via memoro service
		console.log('Triggering transcription for memo:', memoId);

		const transcriptionResult = await triggerTranscription({
			userId,
			fileName,
			duration: Math.floor(duration),
			memoId,
			spaceId,
			title,
			blueprintId,
			recordingLanguages,
			enableDiarization,
			appToken
		});

		if (!transcriptionResult.success) {
			console.error('Transcription trigger failed:', transcriptionResult.error);

			return {
				success: false,
				error: transcriptionResult.error || 'Transcription failed to start',
				isNetworkError: false
			};
		}

		console.log('Transcription started successfully for memo:', memoId);

		return {
			success: true,
			memoId
		};
	} catch (error) {
		console.error('Error in uploadAndProcessAudio:', error);

		// Check if network error
		const isNetworkError =
			error instanceof TypeError && error.message.includes('fetch');

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
			isNetworkError
		};
	}
}
