import * as FileSystem from './fileSystemUtils';
import { supabaseAnonKey, supabaseUrl } from '../auth';
import { analyzeNetworkErrorSync } from '../errorHandling/utils/networkErrorUtils';
import { activateUploadKeepAwake, deactivateUploadKeepAwake } from './uploadKeepAwake';

/**
 * Enhanced upload result with network error information
 */
export interface UploadResult {
	success: boolean;
	filePath?: string;
	error?: string;
	isNetworkError?: boolean;
	userMessage?: string;
	technicalMessage?: string;
}

/**
 * Service for cloud storage operations
 */
class CloudStorageService {
	/**
	 * Validates that middleware and Supabase environments are consistent
	 * Throws an error if there's a mismatch (e.g., DEV middleware with PROD Supabase)
	 */
	private validateEnvironment(): void {
		const middlewareUrl = process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL || '';

		// Determine environments based on URL patterns
		const middlewareEnv = middlewareUrl.includes('-dev-') ? 'dev' : 'prod';
		const supabaseEnv = supabaseUrl.includes('srinrsbpfeioudkntlyu') ? 'dev' : 'prod';

		console.debug('Environment validation:', {
			middlewareUrl,
			supabaseUrl,
			middlewareEnv,
			supabaseEnv,
			consistent: middlewareEnv === supabaseEnv,
		});

		if (middlewareEnv !== supabaseEnv) {
			const errorMsg =
				`CRITICAL: Environment mismatch detected!\n` +
				`Middleware is ${middlewareEnv.toUpperCase()} but Supabase is ${supabaseEnv.toUpperCase()}.\n` +
				`This will cause token validation failures.\n` +
				`Please ensure both are pointing to the same environment in your .env file.`;
			console.error(errorMsg);
			throw new Error(errorMsg);
		}
	}

	/**
	 * Uploads an audio file to Supabase Storage and creates a job for transcription
	 */
	async uploadAudioForProcessing({ userId, filePath, fileName }: any): Promise<UploadResult> {
		// Activate screen wake lock to prevent upload interruption when screen locks
		await activateUploadKeepAwake();

		try {
			// Validate environment consistency before upload
			this.validateEnvironment();

			// Check if the file exists
			const sourceFileInfo = await FileSystem.getFileInfo(filePath);
			if (!sourceFileInfo.exists) {
				throw new Error('Audio file does not exist');
			}

			// Create the path in storage
			const storagePath = `${userId}/${fileName}`;

			// For React Native, we use a direct approach with the file URI
			const fileUri = filePath;

			// Log file info for debugging
			const fileInfo = await FileSystem.getFileInfo(fileUri);
			console.debug('Preparing audio file for upload:', {
				uri: fileUri,
				name: fileName,
				size: fileInfo.exists ? fileInfo.size : 0,
				type: 'audio/m4a', // MIME type for M4A files
				exists: fileInfo.exists,
			});

			// Get the user's app token for authenticated requests with automatic refresh
			const { tokenManager } = await import('~/features/auth/services/tokenManager');
			const appToken = await tokenManager.getValidToken();
			if (!appToken) {
				throw new Error('No authenticated token found');
			}

			// Use the Supabase REST API directly for the upload
			const uploadUrl = `${supabaseUrl}/storage/v1/object/user-uploads/${storagePath}`;

			console.debug('Uploading file to Supabase Storage:', {
				url: uploadUrl,
				fileSize: fileInfo.exists && fileInfo.size ? this.formatFileSize(fileInfo.size) : 'unknown',
				fileName,
				hasToken: !!appToken,
				tokenPreview: appToken ? `${appToken.substring(0, 20)}...` : 'none',
				authHeader: `Bearer ${appToken.substring(0, 30)}...`,
			});

			// Read file as binary data for upload
			// React Native expects the file to be sent as a Blob or using FormData with proper URI
			// We'll use fetch to read the file and then send it as binary
			const fileBlob = await fetch(fileUri).then((r) => r.blob());

			// Create headers object with all required headers including Content-Type
			const headers: Record<string, string> = {
				apikey: supabaseAnonKey,
				Authorization: `Bearer ${appToken}`,
				'Content-Type': 'audio/m4a',
				'x-upsert': 'true',
			};

			console.debug('Request headers being sent:', {
				hasApikey: !!headers['apikey'],
				hasAuthorization: !!headers['Authorization'],
				hasContentType: !!headers['Content-Type'],
				contentType: headers['Content-Type'],
				authorizationPrefix: headers['Authorization']?.substring(0, 15),
			});

			const uploadResponse = await fetch(uploadUrl, {
				method: 'POST',
				headers: headers,
				body: fileBlob,
			});

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text();
				console.debug('Upload response error:', {
					status: uploadResponse.status,
					statusText: uploadResponse.statusText,
					errorText,
				});

				// Create an error object with status for network analysis
				const uploadError = new Error(`Error during upload: ${errorText}`);
				(uploadError as any).status = uploadResponse.status;
				throw uploadError;
			}

			console.debug('Upload response successful:', {
				status: uploadResponse.status,
				statusText: uploadResponse.statusText,
			});

			// Log successful upload
			console.debug('File uploaded successfully to path:', storagePath);

			return {
				success: true,
				filePath: storagePath,
			};
		} catch (error: unknown) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.debug('Error during audio upload:', {
				error: err.message,
				stack: err.stack,
				name: err.name,
			});

			// Analyze if this is a network-related error
			const networkErrorInfo = analyzeNetworkErrorSync(err);

			return {
				success: false,
				error: err.message,
				isNetworkError: networkErrorInfo.isNetworkError,
				userMessage: networkErrorInfo.userMessage,
				technicalMessage: networkErrorInfo.technicalMessage,
			};
		} finally {
			// Always release screen wake lock when upload completes (success or failure)
			await deactivateUploadKeepAwake();
		}
	}

	/**
	 * Helper function to format file size
	 */
	private formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}
}

// Export singleton instance
export const cloudStorageService = new CloudStorageService();
