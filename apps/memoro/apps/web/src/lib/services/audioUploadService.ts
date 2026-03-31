import { env } from '$lib/config/env';
import { authStore } from '$lib/stores/auth.svelte';
import { triggerTranscription } from '$lib/services/transcriptionService';

/**
 * Get video file extension from blob type
 */
function getVideoExtension(blob: Blob): string {
	const mimeToExt: Record<string, string> = {
		'video/mp4': 'mp4',
		'video/quicktime': 'mov',
		'video/x-msvideo': 'avi',
		'video/x-matroska': 'mkv',
		'video/webm': 'webm',
		'video/x-ms-wmv': 'wmv',
		'video/x-flv': 'flv',
		'video/3gpp': '3gp',
	};
	return mimeToExt[blob.type] || 'mp4';
}

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
	mediaType?: 'audio' | 'video';
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
	recordingTime,
	mediaType = 'audio',
}: AudioUploadOptions): Promise<AudioUploadResult> {
	try {
		// 1. Generate memoId (UUID v4)
		const memoId = crypto.randomUUID();
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

		// Determine file extension based on media type and original file
		const isVideo = mediaType === 'video';
		const extension = isVideo ? getVideoExtension(audioBlob) : 'm4a';
		const prefix = isVideo ? 'video' : 'audio';
		const fileName = `${memoId}/${prefix}_${timestamp}.${extension}`;

		// 2. Get authenticated token
		const appToken = await authStore.getValidToken();
		if (!appToken) {
			return {
				success: false,
				error: 'Authentication failed - no valid token found',
				isNetworkError: false,
			};
		}

		// 3. Create FormData for upload
		const formData = new FormData();
		formData.append('file', audioBlob, `${prefix}_${timestamp}.${extension}`);

		// 4. Upload to Supabase Storage
		const storagePath = `${userId}/${fileName}`;
		const uploadUrl = `${env.supabase.url}/storage/v1/object/user-uploads/${storagePath}`;

		console.log('Uploading to Supabase Storage:', uploadUrl);

		const uploadResponse = await fetch(uploadUrl, {
			method: 'POST',
			headers: {
				apikey: env.supabase.anonKey,
				Authorization: `Bearer ${appToken}`,
				'x-upsert': 'true',
			},
			body: formData,
		});

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text();
			console.error('Storage upload failed:', uploadResponse.status, errorText);

			return {
				success: false,
				error: `Upload failed: ${uploadResponse.status} - ${errorText}`,
				isNetworkError: uploadResponse.status >= 500 || uploadResponse.status === 0,
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
			accessToken: appToken,
			mediaType,
		});

		if (!transcriptionResult.success) {
			console.error('Transcription trigger failed:', transcriptionResult.error);

			return {
				success: false,
				error: transcriptionResult.error || 'Transcription failed to start',
				isNetworkError: false,
			};
		}

		console.log('Transcription started successfully for memo:', memoId);

		return {
			success: true,
			memoId,
		};
	} catch (error) {
		console.error('Error in uploadAndProcessAudio:', error);

		// Check if network error
		const isNetworkError = error instanceof TypeError && error.message.includes('fetch');

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
			isNetworkError,
		};
	}
}
