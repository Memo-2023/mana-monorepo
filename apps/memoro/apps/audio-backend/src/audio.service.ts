import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class AudioService {
	private readonly logger = new Logger(AudioService.name);
	private readonly batchThresholdMinutes = 115; // 1h55m

	constructor(private readonly configService: ConfigService) {}

	/**
	 * Fast transcription with automatic fallback handling and timeout management
	 */
	async transcribeRealtimeWithFallback(
		audioPath: string,
		memoId: string,
		userId: string,
		spaceId?: string,
		recordingLanguages?: string[],
		token?: string,
		enableDiarization?: boolean,
		isAppend?: boolean,
		recordingIndex?: number
	) {
		// Configurable timeouts based on environment
		const TOTAL_TIMEOUT = parseInt('1200000'); // 20 minutes default
		const FAST_TIMEOUT = parseInt('1200000'); // 20 minutes default
		const startTime = Date.now();

		const checkTimeout = (stage: string) => {
			const elapsed = Date.now() - startTime;
			if (elapsed > TOTAL_TIMEOUT) {
				throw new Error(`Fallback chain timeout exceeded after ${elapsed}ms in stage: ${stage}`);
			}
			return TOTAL_TIMEOUT - elapsed; // Return remaining time
		};

		try {
			this.logger.log(
				`[transcribeRealtimeWithFallback] Starting transcription with fallback for ${audioPath}`
			);

			// Attempt 1: Try fast transcription with timeout
			try {
				checkTimeout('initial-fast');
				return await Promise.race([
					this.transcribeRealtime(
						audioPath,
						memoId,
						userId,
						spaceId,
						recordingLanguages,
						token,
						enableDiarization,
						isAppend,
						recordingIndex
					),
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error('Fast route timeout')), FAST_TIMEOUT)
					),
				]);
			} catch (fastError) {
				this.logger.warn(
					`[transcribeRealtimeWithFallback] Fast route failed: ${fastError.message}`
				);

				// Check if this is a rate limit error (429) that should retry with different service
				if (this.shouldRetryWithDifferentService(fastError)) {
					const remainingTime = checkTimeout('service-retry');
					this.logger.log(
						`[transcribeRealtimeWithFallback] Attempting service retry for rate limit error (${remainingTime}ms remaining)`
					);

					// Attempt 2: Try with different Azure service
					try {
						const serviceRetryTimeout = Math.min(FAST_TIMEOUT, remainingTime - 5000); // Leave 5s buffer
						return await Promise.race([
							this.transcribeRealtimeWithServiceRetry(
								audioPath,
								memoId,
								userId,
								spaceId,
								recordingLanguages,
								token,
								enableDiarization,
								isAppend,
								recordingIndex
							),
							new Promise<never>((_, reject) =>
								setTimeout(() => reject(new Error('Service retry timeout')), serviceRetryTimeout)
							),
						]);
					} catch (serviceRetryError) {
						this.logger.warn(
							`[transcribeRealtimeWithFallback] Service retry failed: ${serviceRetryError.message}`
						);
						// Continue to next fallback option
					}
				}

				// Check if this is a 422 error or format-related issue that could be resolved by conversion
				if (this.shouldRetryWithConversion(fastError)) {
					const remainingTime = checkTimeout('conversion-retry');
					this.logger.log(
						`[transcribeRealtimeWithFallback] Attempting conversion retry for format-related error (${remainingTime}ms remaining)`
					);

					// Attempt 3: Try with additional audio conversion/preprocessing
					try {
						const conversionTimeout = Math.min(FAST_TIMEOUT, remainingTime - 5000); // Leave 5s buffer
						return await Promise.race([
							this.transcribeRealtimeWithConversion(
								audioPath,
								memoId,
								userId,
								spaceId,
								recordingLanguages,
								token,
								enableDiarization,
								isAppend,
								recordingIndex
							),
							new Promise<never>((_, reject) =>
								setTimeout(() => reject(new Error('Conversion retry timeout')), conversionTimeout)
							),
						]);
					} catch (conversionError) {
						this.logger.warn(
							`[transcribeRealtimeWithFallback] Conversion retry failed: ${conversionError.message}`
						);

						// Attempt 4: Fallback to batch processing
						checkTimeout('batch-fallback');
						this.logger.log(`[transcribeRealtimeWithFallback] Falling back to batch processing`);
						return await this.fallbackToBatchProcessing(
							audioPath,
							memoId,
							userId,
							spaceId,
							recordingLanguages,
							token,
							enableDiarization,
							isAppend,
							recordingIndex
						);
					}
				} else {
					// For non-format, non-rate-limit errors, go directly to batch fallback
					checkTimeout('direct-batch-fallback');
					this.logger.log(
						`[transcribeRealtimeWithFallback] Non-format error, falling back to batch processing`
					);
					return await this.fallbackToBatchProcessing(
						audioPath,
						memoId,
						userId,
						spaceId,
						recordingLanguages,
						token,
						enableDiarization,
						isAppend,
						recordingIndex
					);
				}
			}
		} catch (error) {
			this.logger.error(
				`[transcribeRealtimeWithFallback] All fallback attempts failed after ${Date.now() - startTime}ms:`,
				error
			);

			// Determine which stage failed for better error reporting
			let fallbackStage = 'unknown';
			if (error.message?.includes('timeout')) {
				fallbackStage = 'timeout';
			} else if (error.message?.includes('service-retry')) {
				fallbackStage = 'service-retry';
			} else if (error.message?.includes('conversion')) {
				fallbackStage = 'conversion-retry';
			} else if (error.message?.includes('batch')) {
				fallbackStage = 'batch-fallback';
			} else {
				fallbackStage = 'initial-fast';
			}

			// Notify memoro service of final failure with enhanced context
			try {
				await this.notifyTranscriptionErrorWithContext(
					memoId,
					userId,
					error.message,
					'fast',
					fallbackStage,
					token
				);
			} catch (notifyError) {
				this.logger.error(`Failed to notify transcription error:`, notifyError);
			}

			throw error;
		}
	}

	/**
	 * Fast transcription using Azure Speech API for files <115 minutes and <300MB
	 */
	async transcribeRealtime(
		audioPath: string,
		memoId: string,
		userId: string,
		spaceId?: string,
		recordingLanguages?: string[],
		token?: string,
		enableDiarization?: boolean,
		isAppend?: boolean,
		recordingIndex?: number
	) {
		try {
			this.logger.log(`[transcribeRealtime] Starting fast transcription for ${audioPath}`);

			// Download audio from storage
			const audioBuffer = await this.downloadFromStorage(audioPath, token);
			this.logger.log(`Downloaded audio: ${audioBuffer.length} bytes`);

			// Convert to Azure-compatible format
			const convertedAudio = await this.convertAudioForAzure(audioBuffer, audioPath);
			this.logger.log(`Converted audio: ${convertedAudio.length} bytes`);

			// Perform real-time transcription using Azure Speech API
			const transcriptionResult = await this.performRealtimeTranscription(
				convertedAudio,
				recordingLanguages,
				enableDiarization
			);

			// Send appropriate callback based on operation type
			if (isAppend) {
				// Send append-specific callback
				await this.notifyAppendTranscriptionComplete(
					memoId,
					userId,
					transcriptionResult,
					'fast',
					token,
					recordingIndex
				);
				this.logger.log(`[transcribeRealtime] Sent append callback for memo ${memoId}`);
			} else {
				// Send regular transcription callback
				await this.notifyTranscriptionComplete(memoId, userId, transcriptionResult, 'fast', token);
			}

			return {
				success: true,
				route: 'fast',
				memoId,
				message: 'Fast transcription completed successfully',
			};
		} catch (error) {
			this.logger.error(`[transcribeRealtime] Error:`, error);
			throw error; // Don't notify here - let the fallback handler manage notifications
		}
	}

	/**
	 * Get random Azure Speech Service configuration for load balancing
	 */
	private getRandomSpeechService() {
		const speechServices = [
			{
				key: this.configService.get('PROD_MEMORO_TRANSCRIBE_SWE'),
				endpoint:
					'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe',
				region: 'swedencentral',
				name: 'prod-memoro-transcribe-swe',
			},
			{
				key: this.configService.get('PROD_MEMORO_TRANSCRIBE_SWE2'),
				endpoint:
					'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe',
				region: 'swedencentral',
				name: 'prod-memoro-transcribe-swe2',
			},
			{
				key: this.configService.get('PROD_MEMORO_TRANSCRIBE_SWE3'),
				endpoint:
					'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe',
				region: 'swedencentral',
				name: 'prod-memoro-transcribe-swe3',
			},
			{
				key: this.configService.get('PROD_MEMORO_TRANSCRIBE_SWE4'),
				endpoint:
					'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe',
				region: 'swedencentral',
				name: 'prod-memoro-transcribe-swe4',
			},
		];

		// Filter out services without keys and fallback to original config
		const validServices = speechServices.filter((service) => service.key);

		if (validServices.length === 0) {
			// Fallback to original single service configuration
			const azureKey = this.configService.get('AZURE_SPEECH_KEY');
			const azureRegion = this.configService.get('AZURE_SPEECH_REGION');

			if (!azureKey || !azureRegion) {
				throw new Error('No Azure Speech credentials configured');
			}

			return {
				key: azureKey,
				endpoint: `https://${azureRegion}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe`,
				region: azureRegion,
				name: 'fallback-service',
			};
		}

		// Random selection for load balancing
		const randomIndex = Math.floor(Math.random() * validServices.length);
		const selectedService = validServices[randomIndex];

		this.logger.log(
			`[getRandomSpeechService] Selected service: ${selectedService.name} (${randomIndex + 1}/${validServices.length})`
		);

		return selectedService;
	}

	/**
	 * Performs real-time transcription using Azure Speech API with load balancing
	 */
	private async performRealtimeTranscription(
		audioBuffer: Buffer,
		recordingLanguages?: string[],
		enableDiarization?: boolean
	) {
		const speechService = this.getRandomSpeechService();

		// FIXED: Correct Azure Fast Transcription API diarization configuration
		const definition: any = {
			wordLevelTimestampsEnabled: true,
			punctuationMode: 'Automatic',
			profanityFilterMode: 'None',
		};

		// Conditionally add diarization based on user preference (default: enabled)
		if (enableDiarization !== false) {
			definition.diarization = {
				enabled: true,
				maxSpeakers: 10, // Correct format: maxSpeakers instead of speakers.maxCount
			};
		}

		// Language identification setup
		const CANDIDATE_LOCALES = [
			'de-DE',
			'en-GB',
			'fr-FR',
			'it-IT',
			'es-ES',
			'sv-SE',
			'ru-RU',
			'nl-NL',
			'tr-TR',
			'pt-PT',
		];

		if (recordingLanguages && recordingLanguages.length > 0) {
			this.logger.log(`Using provided languages: ${recordingLanguages.join(', ')}`);
			definition['languageIdentification'] = {
				candidateLocales: recordingLanguages,
			};
		} else {
			this.logger.log(`Using default candidate locales: ${CANDIDATE_LOCALES.join(', ')}`);
			definition['languageIdentification'] = {
				candidateLocales: CANDIDATE_LOCALES,
			};
		}

		// Prepare form data
		const formData = new FormData();

		// DEBUG: Log the exact definition being sent to Azure
		this.logger.log(
			`[Azure Request] DEBUG - Definition being sent: ${JSON.stringify(definition, null, 2)}`
		);

		formData.append('definition', JSON.stringify(definition));

		// Create blob from buffer
		const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
		formData.append('audio', audioBlob, 'audio.wav');

		this.logger.log(`Sending to Azure Speech API (${speechService.name})...`);

		const response = await fetch(`${speechService.endpoint}?api-version=2024-11-15`, {
			method: 'POST',
			headers: {
				'Ocp-Apim-Subscription-Key': speechService.key,
				Accept: 'application/json',
			},
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();

			// Log comprehensive error details for 429 analysis with special tags
			if (response.status === 429) {
				// Special tagged log for easy filtering: [AZURE_429_ERROR]
				this.logger.error(
					`[AZURE_429_ERROR] Azure Speech API Rate Limited - Service: ${speechService.name}`
				);
				this.logger.error(`[AZURE_429_ERROR] Status: ${response.status}`);
				this.logger.error(`[AZURE_429_ERROR] Response body: ${errorText}`);
				this.logger.error(
					`[AZURE_429_ERROR] Retry-After: ${response.headers.get('retry-after') || 'not provided'}`
				);
				this.logger.error(
					`[AZURE_429_ERROR] x-ms-service-quota-reason: ${response.headers.get('x-ms-service-quota-reason') || 'not provided'}`
				);
				this.logger.error(
					`[AZURE_429_ERROR] x-ms-request-id: ${response.headers.get('x-ms-request-id') || 'not provided'}`
				);
				this.logger.error(
					`[AZURE_429_ERROR] x-ms-retry-after-ms: ${response.headers.get('x-ms-retry-after-ms') || 'not provided'}`
				);
				this.logger.error(
					`[AZURE_429_ERROR] x-ms-error-code: ${response.headers.get('x-ms-error-code') || 'not provided'}`
				);

				// Log all headers for comprehensive analysis
				const allHeaders = {};
				response.headers.forEach((value, key) => {
					allHeaders[key] = value;
				});
				this.logger.error(
					`[AZURE_429_ERROR] All response headers: ${JSON.stringify(allHeaders, null, 2)}`
				);
			} else if (response.status === 422) {
				// Special tagged log for format errors: [AZURE_422_ERROR]
				this.logger.error(
					`[AZURE_422_ERROR] Azure Speech API Format Error - Service: ${speechService.name}`
				);
				this.logger.error(`[AZURE_422_ERROR] Status: ${response.status}`);
				this.logger.error(`[AZURE_422_ERROR] Response body: ${errorText}`);
				this.logger.error(
					`[AZURE_422_ERROR] x-ms-request-id: ${response.headers.get('x-ms-request-id') || 'not provided'}`
				);
			} else {
				this.logger.error(`Azure API error: ${response.status} - ${errorText}`);
			}

			throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
		}

		const result = await response.json();
		this.logger.log(`Azure transcription result received`);

		// DEBUG: Log what Azure is actually returning for diarization analysis
		this.logger.log(`[Azure Response] DEBUG - Full result keys: ${Object.keys(result).join(', ')}`);
		this.logger.log(
			`[Azure Response] DEBUG - Has phrases: ${!!result.phrases} (count: ${result.phrases?.length || 0})`
		);

		if (result.phrases && result.phrases.length > 0) {
			const firstPhrase = result.phrases[0];
			this.logger.log(
				`[Azure Response] DEBUG - First phrase keys: ${Object.keys(firstPhrase).join(', ')}`
			);
			this.logger.log(
				`[Azure Response] DEBUG - First phrase has speaker: ${firstPhrase.speaker !== undefined} (value: ${firstPhrase.speaker})`
			);
			this.logger.log(
				`[Azure Response] DEBUG - First phrase sample: ${JSON.stringify(firstPhrase, null, 2)}`
			);

			// Count how many phrases have speaker info
			const phrasesWithSpeakers = result.phrases.filter((p) => p.speaker !== undefined);
			this.logger.log(
				`[Azure Response] DEBUG - Phrases with speaker data: ${phrasesWithSpeakers.length}/${result.phrases.length}`
			);
		} else {
			this.logger.warn(`[Azure Response] DEBUG - No phrases found in result!`);
		}

		// Process the result to match existing data structure
		return this.processTranscriptionResult(result);
	}

	/**
	 * Performs real-time transcription with retry logic (selects different service)
	 */
	private async performRealtimeTranscriptionWithRetry(
		audioBuffer: Buffer,
		recordingLanguages?: string[],
		enableDiarization?: boolean,
		excludeServices: string[] = []
	) {
		// Get all available services and exclude the ones that already failed
		const allServices = [
			{
				key: this.configService.get('PROD_MEMORO_TRANSCRIBE_SWE'),
				endpoint:
					'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe',
				region: 'swedencentral',
				name: 'prod-memoro-transcribe-swe',
			},
			{
				key: this.configService.get('PROD_MEMORO_TRANSCRIBE_SWE2'),
				endpoint:
					'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe',
				region: 'swedencentral',
				name: 'prod-memoro-transcribe-swe2',
			},
			{
				key: this.configService.get('PROD_MEMORO_TRANSCRIBE_SWE3'),
				endpoint:
					'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe',
				region: 'swedencentral',
				name: 'prod-memoro-transcribe-swe3',
			},
			{
				key: this.configService.get('PROD_MEMORO_TRANSCRIBE_SWE4'),
				endpoint:
					'https://swedencentral.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe',
				region: 'swedencentral',
				name: 'prod-memoro-transcribe-swe4',
			},
		];

		// Filter out excluded services and services without keys
		const availableServices = allServices.filter(
			(service) => service.key && !excludeServices.includes(service.name)
		);

		if (availableServices.length === 0) {
			throw new Error('No available Azure Speech services for retry');
		}

		// Pick a random service from available ones
		const randomIndex = Math.floor(Math.random() * availableServices.length);
		const speechService = availableServices[randomIndex];

		this.logger.log(
			`[performRealtimeTranscriptionWithRetry] Selected service: ${speechService.name} (${randomIndex + 1}/${availableServices.length} available)`
		);

		// Enhanced configuration with speaker diarization (up to 10 speakers)
		const definition: any = {
			wordLevelTimestampsEnabled: true,
			punctuationMode: 'Automatic',
			profanityFilterMode: 'None',
		};

		// Conditionally add diarization based on user preference (default: enabled)
		if (enableDiarization !== false) {
			definition.diarization = {
				enabled: true,
				maxSpeakers: 10,
			};
		}

		// Language identification setup
		const CANDIDATE_LOCALES = [
			'de-DE',
			'en-GB',
			'fr-FR',
			'it-IT',
			'es-ES',
			'sv-SE',
			'ru-RU',
			'nl-NL',
			'tr-TR',
			'pt-PT',
		];

		if (recordingLanguages && recordingLanguages.length > 0) {
			this.logger.log(`Using provided languages: ${recordingLanguages.join(', ')}`);
			definition['languageIdentification'] = {
				candidateLocales: recordingLanguages,
			};
		} else {
			this.logger.log(`Using default candidate locales: ${CANDIDATE_LOCALES.join(', ')}`);
			definition['languageIdentification'] = {
				candidateLocales: CANDIDATE_LOCALES,
			};
		}

		// Prepare form data
		const formData = new FormData();
		formData.append('definition', JSON.stringify(definition));

		// Create blob from buffer
		const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
		formData.append('audio', audioBlob, 'audio.wav');

		this.logger.log(`Sending to Azure Speech API retry (${speechService.name})...`);

		const response = await fetch(`${speechService.endpoint}?api-version=2024-11-15`, {
			method: 'POST',
			headers: {
				'Ocp-Apim-Subscription-Key': speechService.key,
				Accept: 'application/json',
			},
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();

			// Log comprehensive error details for 429 analysis with special tags
			if (response.status === 429) {
				// Special tagged log for easy filtering: [AZURE_429_RETRY_ERROR]
				this.logger.error(
					`[AZURE_429_RETRY_ERROR] Azure Speech API Rate Limited on Retry - Service: ${speechService.name}`
				);
				this.logger.error(`[AZURE_429_RETRY_ERROR] Status: ${response.status}`);
				this.logger.error(`[AZURE_429_RETRY_ERROR] Response body: ${errorText}`);
				this.logger.error(
					`[AZURE_429_RETRY_ERROR] Retry-After: ${response.headers.get('retry-after') || 'not provided'}`
				);
				this.logger.error(
					`[AZURE_429_RETRY_ERROR] x-ms-service-quota-reason: ${response.headers.get('x-ms-service-quota-reason') || 'not provided'}`
				);
				this.logger.error(
					`[AZURE_429_RETRY_ERROR] x-ms-request-id: ${response.headers.get('x-ms-request-id') || 'not provided'}`
				);
				this.logger.error(
					`[AZURE_429_RETRY_ERROR] x-ms-retry-after-ms: ${response.headers.get('x-ms-retry-after-ms') || 'not provided'}`
				);
				this.logger.error(
					`[AZURE_429_RETRY_ERROR] x-ms-error-code: ${response.headers.get('x-ms-error-code') || 'not provided'}`
				);

				// Log all headers for comprehensive analysis
				const allHeaders = {};
				response.headers.forEach((value, key) => {
					allHeaders[key] = value;
				});
				this.logger.error(
					`[AZURE_429_RETRY_ERROR] All response headers: ${JSON.stringify(allHeaders, null, 2)}`
				);
			} else if (response.status === 422) {
				// Special tagged log for format errors: [AZURE_422_RETRY_ERROR]
				this.logger.error(
					`[AZURE_422_RETRY_ERROR] Azure Speech API Format Error on Retry - Service: ${speechService.name}`
				);
				this.logger.error(`[AZURE_422_RETRY_ERROR] Status: ${response.status}`);
				this.logger.error(`[AZURE_422_RETRY_ERROR] Response body: ${errorText}`);
				this.logger.error(
					`[AZURE_422_RETRY_ERROR] x-ms-request-id: ${response.headers.get('x-ms-request-id') || 'not provided'}`
				);
			} else {
				this.logger.error(`Azure API retry error: ${response.status} - ${errorText}`);
			}

			throw new Error(`Azure Speech API retry error: ${response.status} - ${errorText}`);
		}

		const result = await response.json();
		this.logger.log(`Azure transcription retry result received`);

		// Process the result to match existing data structure
		return this.processTranscriptionResult(result);
	}

	/**
	 * Determines if error should trigger conversion retry
	 */
	private shouldRetryWithConversion(error: any): boolean {
		// Direct status code check
		const statusCode =
			error.status || error.response?.status || this.extractStatusFromMessage(error.message);
		const is422Error = statusCode === 422;

		// More specific format error patterns
		const formatErrorPatterns = [
			/unsupported.*format/i,
			/invalid.*audio/i,
			/codec.*not.*supported/i,
			/content.*type.*unsupported/i,
			/bitrate.*not.*supported/i,
			/sample.*rate.*invalid/i,
			/audio.*format.*error/i,
			/media.*type.*not.*supported/i,
		];

		const errorText = error.message || error.toString() || '';
		const isFormatError = formatErrorPatterns.some((pattern) => pattern.test(errorText));

		const shouldRetry = is422Error || isFormatError;
		this.logger.log(
			`[shouldRetryWithConversion] Error analysis: status=${statusCode}, 422=${is422Error}, format=${isFormatError}, shouldRetry=${shouldRetry}`
		);

		return shouldRetry;
	}

	/**
	 * Determines if error should trigger service retry (429, 503, etc.)
	 */
	private shouldRetryWithDifferentService(error: any): boolean {
		const statusCode =
			error.status || error.response?.status || this.extractStatusFromMessage(error.message);
		const retryableStatuses = [429, 503, 502, 500]; // Rate limit, service unavailable, bad gateway, internal error

		const shouldRetry = retryableStatuses.includes(statusCode);
		this.logger.log(
			`[shouldRetryWithDifferentService] Error analysis: status=${statusCode}, shouldRetry=${shouldRetry}`
		);

		return shouldRetry;
	}

	/**
	 * Extract status code from error message like "Azure Speech API error: 429 - ..."
	 */
	private extractStatusFromMessage(message: string): number | undefined {
		if (!message) return undefined;

		const statusMatch = message.match(/error:\s*(\d{3})/i);
		return statusMatch ? parseInt(statusMatch[1], 10) : undefined;
	}

	/**
	 * Attempts transcription with service retry (different Azure endpoint)
	 */
	private async transcribeRealtimeWithServiceRetry(
		audioPath: string,
		memoId: string,
		userId: string,
		spaceId?: string,
		recordingLanguages?: string[],
		token?: string,
		enableDiarization?: boolean,
		isAppend?: boolean,
		recordingIndex?: number
	) {
		this.logger.log(
			`[transcribeRealtimeWithServiceRetry] Attempting service retry for ${audioPath}`
		);

		// Download audio from storage
		const audioBuffer = await this.downloadFromStorage(audioPath, token);
		this.logger.log(`Downloaded audio for service retry: ${audioBuffer.length} bytes`);

		// Convert to Azure-compatible format
		const convertedAudio = await this.convertAudioForAzure(audioBuffer, audioPath);
		this.logger.log(`Converted audio for service retry: ${convertedAudio.length} bytes`);

		// Perform real-time transcription using a different Azure Speech API service
		const transcriptionResult = await this.performRealtimeTranscriptionWithRetry(
			convertedAudio,
			recordingLanguages,
			enableDiarization
		);

		// Send appropriate callback based on operation type
		if (isAppend) {
			await this.notifyAppendTranscriptionComplete(
				memoId,
				userId,
				transcriptionResult,
				'fast',
				token,
				recordingIndex
			);
		} else {
			await this.notifyTranscriptionComplete(memoId, userId, transcriptionResult, 'fast', token);
		}

		return {
			success: true,
			route: 'fast-service-retry',
			memoId,
			message: 'Fast transcription completed after service retry',
		};
	}

	/**
	 * Attempts transcription with enhanced conversion preprocessing
	 */
	private async transcribeRealtimeWithConversion(
		audioPath: string,
		memoId: string,
		userId: string,
		spaceId?: string,
		recordingLanguages?: string[],
		token?: string,
		enableDiarization?: boolean,
		isAppend?: boolean,
		recordingIndex?: number
	) {
		this.logger.log(
			`[transcribeRealtimeWithConversion] Attempting enhanced conversion for ${audioPath}`
		);

		// Download audio from storage
		const audioBuffer = await this.downloadFromStorage(audioPath, token);
		this.logger.log(`Downloaded audio for conversion retry: ${audioBuffer.length} bytes`);

		// Apply enhanced conversion with multiple format attempts
		const convertedAudio = await this.enhancedAudioConversion(audioBuffer, audioPath);
		this.logger.log(`Enhanced conversion completed: ${convertedAudio.length} bytes`);

		// Perform real-time transcription using Azure Speech API
		const transcriptionResult = await this.performRealtimeTranscription(
			convertedAudio,
			recordingLanguages,
			enableDiarization
		);

		// Send appropriate callback based on operation type
		if (isAppend) {
			await this.notifyAppendTranscriptionComplete(
				memoId,
				userId,
				transcriptionResult,
				'fast',
				token,
				recordingIndex
			);
		} else {
			await this.notifyTranscriptionComplete(memoId, userId, transcriptionResult, 'fast', token);
		}

		return {
			success: true,
			route: 'fast-conversion-retry',
			memoId,
			message: 'Fast transcription completed after conversion retry',
		};
	}

	/**
	 * Enhanced audio conversion with proper resource management and timeout
	 */
	private async enhancedAudioConversion(audioBuffer: Buffer, audioPath?: string): Promise<Buffer> {
		this.logger.log('[enhancedAudioConversion] Attempting enhanced conversion');

		const tempDir = os.tmpdir();

		// Extract the actual file extension from audioPath
		const fileExt = audioPath ? path.extname(audioPath) : '.m4a'; // fallback to .m4a
		const inputFile = path.join(tempDir, `input_enhanced_${Date.now()}${fileExt}`);
		const outputFile = path.join(tempDir, `output_enhanced_${Date.now()}.wav`);

		// Map common extensions to ffmpeg format names
		const formatMap: Record<string, string> = {
			'.m4a': 'mp4',
			'.mp4': 'mp4',
			'.mp3': 'mp3',
			'.wav': 'wav',
			'.aac': 'aac',
			'.ogg': 'ogg',
			'.webm': 'webm',
			'.flac': 'flac',
		};

		let inputFormat = formatMap[fileExt.toLowerCase()];

		const cleanup = async () => {
			try {
				await Promise.all([
					fs.promises.unlink(inputFile).catch(() => {}),
					fs.promises.unlink(outputFile).catch(() => {}),
				]);
			} catch (error) {
				this.logger.warn('Cleanup warning:', error);
			}
		};

		try {
			// Use async file operations
			await fs.promises.writeFile(inputFile, audioBuffer);

			// Probe the file to detect actual format (fixes extension/content mismatch issues)
			const probeResult = await this.probeAudioFile(inputFile);
			if (probeResult.valid && probeResult.format) {
				const probedFormat = probeResult.format.split(',')[0].trim();
				const probeFormatMap: Record<string, string> = {
					mp3: 'mp3',
					mov: 'mp4',
					mp4: 'mp4',
					m4a: 'mp4',
					wav: 'wav',
					aac: 'aac',
					ogg: 'ogg',
					webm: 'webm',
					flac: 'flac',
					matroska: 'matroska',
				};

				if (probeFormatMap[probedFormat]) {
					const detectedFormat = probeFormatMap[probedFormat];
					if (detectedFormat !== inputFormat) {
						this.logger.warn(
							`[enhancedAudioConversion] Format mismatch: extension suggests ${inputFormat}, content is ${detectedFormat}. Using detected format.`
						);
						inputFormat = detectedFormat;
					}
				}
				this.logger.log(
					`[enhancedAudioConversion] Probed format: ${probeResult.format}, codec: ${probeResult.codec}`
				);
			}

			return new Promise((resolve, reject) => {
				const command = ffmpeg(inputFile)
					.audioCodec('pcm_s16le') // PCM 16-bit little-endian
					.audioFrequency(16000) // 16kHz sample rate (Azure's preferred)
					.audioChannels(1) // Mono
					.format('wav') // WAV format
					.inputOptions([
						'-err_detect',
						'ignore_err', // Ignore unsupported metadata boxes (e.g., chnl v1)
						'-fflags',
						'+genpts', // Generate presentation timestamps
					])
					.audioFilters([
						'highpass=f=80', // Remove very low frequencies
						'lowpass=f=8000', // Remove frequencies above 8kHz
						'volume=1.5', // Slight volume boost
					])
					.outputOptions(['-y']); // Force overwrite existing files

				// Use the actual detected format instead of file extension
				if (inputFormat) {
					command.inputFormat(inputFormat);
					this.logger.log(
						`[enhancedAudioConversion] Using input format: ${inputFormat} for file: ${fileExt}`
					);
				} else {
					this.logger.warn(
						`[enhancedAudioConversion] Unknown format ${fileExt}, letting ffmpeg auto-detect`
					);
				}

				command
					.on('end', async () => {
						try {
							const converted = await fs.promises.readFile(outputFile);
							await cleanup();
							this.logger.log(`✅ Enhanced audio conversion completed from ${fileExt} to WAV`);
							resolve(converted);
						} catch (error) {
							await cleanup();
							reject(error);
						}
					})
					.on('error', async (err) => {
						await cleanup();
						this.logger.error(`❌ Enhanced conversion error for ${fileExt}:`, err);
						reject(err);
					})
					.save(outputFile);
			});
		} catch (error) {
			await cleanup();
			throw error;
		}
	}

	/**
	 * Fallback to batch processing when fast routes fail
	 */
	private async fallbackToBatchProcessing(
		audioPath: string,
		memoId: string,
		userId: string,
		spaceId?: string,
		recordingLanguages?: string[],
		token?: string,
		enableDiarization?: boolean,
		isAppend?: boolean,
		recordingIndex?: number
	) {
		this.logger.log(`[fallbackToBatchProcessing] Starting batch fallback for ${audioPath}`);

		try {
			// Use existing batch processing logic
			const result = await this.processAudioFromStorage(
				audioPath,
				userId,
				spaceId,
				recordingLanguages,
				token,
				memoId,
				enableDiarization
			);

			// Notify memoro service that we've fallen back to batch
			// Note: The batch webhook will handle the final callback when processing completes
			this.logger.log(
				`[fallbackToBatchProcessing] Successfully initiated batch processing: ${result.jobId}`
			);

			return {
				success: true,
				route: 'batch-fallback',
				memoId,
				jobId: result.jobId,
				message: 'Fell back to batch processing after fast route failures',
			};
		} catch (batchError) {
			this.logger.error(`[fallbackToBatchProcessing] Batch fallback also failed:`, batchError);
			throw new Error(`All transcription methods failed. Last error: ${batchError.message}`);
		}
	}

	/**
	 * Process Azure transcription result to match existing data structure
	 */
	private processTranscriptionResult(azureResult: any) {
		let text = '';
		let primaryAudioLanguage = null;
		let allDetectedPhraseLanguages = ['de-DE']; // Fallback

		// Extract language information - ALWAYS use phrase-level analysis for accuracy
		// Azure's top-level locale can be incorrect, so we count phrases by language
		if (azureResult.phrases && Array.isArray(azureResult.phrases)) {
			const languageCounts = {};
			const languageTextCounts = {}; // Count characters per language for more accuracy

			for (const phrase of azureResult.phrases) {
				if (phrase.locale && typeof phrase.locale === 'string') {
					// Count phrases
					languageCounts[phrase.locale] = (languageCounts[phrase.locale] || 0) + 1;

					// Count characters for weighted analysis
					const textLength = phrase.text ? phrase.text.length : 0;
					languageTextCounts[phrase.locale] = (languageTextCounts[phrase.locale] || 0) + textLength;
				}
			}

			const uniqueLanguages = Object.keys(languageCounts);
			if (uniqueLanguages.length > 0) {
				// Find most frequent language by character count (more accurate than phrase count)
				let mostFrequent = uniqueLanguages[0];
				let maxCharCount = languageTextCounts[mostFrequent] || 0;

				for (const locale of uniqueLanguages) {
					const charCount = languageTextCounts[locale] || 0;
					if (charCount > maxCharCount) {
						mostFrequent = locale;
						maxCharCount = charCount;
					}
				}

				primaryAudioLanguage = mostFrequent;
				allDetectedPhraseLanguages = uniqueLanguages;

				// Debug logging for language detection
				this.logger.log(`[Language Detection] Phrase counts: ${JSON.stringify(languageCounts)}`);
				this.logger.log(
					`[Language Detection] Character counts: ${JSON.stringify(languageTextCounts)}`
				);
				this.logger.log(
					`[Language Detection] Primary language: ${primaryAudioLanguage} (${maxCharCount} chars)`
				);
			}
		} else if (azureResult.locale && typeof azureResult.locale === 'string') {
			// Fallback to top-level locale only if no phrases available
			primaryAudioLanguage = azureResult.locale;
			allDetectedPhraseLanguages = [azureResult.locale];
			this.logger.log(
				`[Language Detection] Using top-level locale fallback: ${primaryAudioLanguage}`
			);
		}

		// Extract transcript text
		if (azureResult.combinedPhrases && Array.isArray(azureResult.combinedPhrases)) {
			text = azureResult.combinedPhrases[0]?.text || '';
		} else if (azureResult.phrases && Array.isArray(azureResult.phrases)) {
			text = azureResult.phrases.map((phrase: { text?: string }) => phrase.text || '').join(' ');
		}

		// Process speaker information (enhanced diarization)
		const utterances = [];
		const speakerMap = {};
		const speakers = {};

		if (azureResult.phrases) {
			azureResult.phrases.forEach(
				(segment: {
					speaker?: number;
					text?: string;
					offsetMilliseconds?: number;
					durationMilliseconds?: number;
				}) => {
					if (segment.speaker !== undefined && segment.text) {
						const speakerId = `speaker${segment.speaker}`;

						utterances.push({
							speakerId,
							text: segment.text,
							offset: segment.offsetMilliseconds,
							duration: segment.durationMilliseconds,
						});

						if (!speakerMap[speakerId]) speakerMap[speakerId] = [];
						speakerMap[speakerId].push({
							text: segment.text,
							offset: segment.offsetMilliseconds,
							duration: segment.durationMilliseconds,
						});
					}
				}
			);
		}

		// Sort utterances by time
		utterances.sort((a, b) => a.offset - b.offset);

		// Create speaker labels
		new Set(utterances.map((u) => u.speakerId)).forEach((id) => {
			speakers[id] = `Speaker ${id.replace('speaker', '')}`;
		});

		const speakerCount = Object.keys(speakers).length;

		// Enhanced diarization logging for debugging
		this.logger.log(
			`[processTranscriptionResult] Transcription processed: ${text.length} chars, ${speakerCount} speakers, language: ${primaryAudioLanguage}`
		);
		this.logger.log(`[processTranscriptionResult] Utterances count: ${utterances.length}`);
		this.logger.log(
			`[processTranscriptionResult] Has speaker data: ${Object.keys(speakers).length > 0}`
		);
		this.logger.log(
			`[processTranscriptionResult] Has speakerMap data: ${Object.keys(speakerMap).length > 0}`
		);

		if (utterances.length > 0) {
			this.logger.log(
				`[processTranscriptionResult] First utterance sample: ${JSON.stringify(utterances[0])}`
			);
		}

		if (Object.keys(speakers).length > 0) {
			this.logger.log(`[processTranscriptionResult] Speaker labels: ${JSON.stringify(speakers)}`);
		}

		return {
			text,
			primary_language: primaryAudioLanguage,
			languages: allDetectedPhraseLanguages,
			utterances: utterances.length > 0 ? utterances : null,
			speakers: Object.keys(speakers).length > 0 ? speakers : null,
			speakerMap: Object.keys(speakerMap).length > 0 ? speakerMap : null,
		};
	}

	/**
	 * Notify memoro service of successful append transcription
	 */
	private async notifyAppendTranscriptionComplete(
		memoId: string,
		userId: string,
		transcriptionResult: any,
		route: 'fast' | 'batch',
		token?: string,
		recordingIndex?: number
	) {
		const memoroServiceUrl = this.configService.get('MEMORO_SERVICE_URL');

		if (!memoroServiceUrl) {
			this.logger.error('CRITICAL: MEMORO_SERVICE_URL is not configured');
			throw new Error('Missing required configuration: MEMORO_SERVICE_URL');
		}

		try {
			this.logger.log(
				`[notifyAppendTranscriptionComplete] Sending append callback for memo ${memoId}, recordingIndex: ${recordingIndex}`
			);

			// Use service role key for service-to-service authentication
			const serviceKey = this.configService.get('MEMORO_SUPABASE_SERVICE_KEY');

			if (!serviceKey) {
				this.logger.error(
					'CRITICAL: MEMORO_SUPABASE_SERVICE_KEY is not configured for service-to-service communication'
				);
				throw new Error('Missing required configuration: MEMORO_SUPABASE_SERVICE_KEY');
			}

			const response = await fetch(
				`${memoroServiceUrl}/memoro/service/append-transcription-completed`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${serviceKey}`,
					},
					body: JSON.stringify({
						memoId,
						userId,
						transcriptionResult,
						route,
						success: true,
						recordingIndex,
					}),
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Memoro service error: ${response.status} - ${errorText}`);
			}

			this.logger.log(
				`Successfully notified memoro service of append completion for memo ${memoId}`
			);
		} catch (error) {
			this.logger.error('Error notifying memoro service of append transcription:', error);
			throw error;
		}
	}

	/**
	 * Notify memoro service of successful transcription
	 */
	private async notifyTranscriptionComplete(
		memoId: string,
		userId: string,
		transcriptionResult: any,
		route: 'fast' | 'batch',
		token?: string
	) {
		const memoroServiceUrl = this.configService.get('MEMORO_SERVICE_URL');

		if (!memoroServiceUrl) {
			this.logger.error('CRITICAL: MEMORO_SERVICE_URL is not configured');
			throw new Error('Missing required configuration: MEMORO_SERVICE_URL');
		}

		try {
			// DEBUG: Log what we're sending to memoro service
			this.logger.log(`[notifyTranscriptionComplete] Sending callback for memo ${memoId}`);
			this.logger.log(
				`[notifyTranscriptionComplete] transcriptionResult keys: ${Object.keys(transcriptionResult || {}).join(', ')}`
			);
			this.logger.log(
				`[notifyTranscriptionComplete] Has text: ${!!transcriptionResult?.text} (length: ${transcriptionResult?.text?.length || 0})`
			);
			this.logger.log(
				`[notifyTranscriptionComplete] Has utterances: ${!!transcriptionResult?.utterances} (count: ${transcriptionResult?.utterances?.length || 0})`
			);
			this.logger.log(
				`[notifyTranscriptionComplete] Has speakers: ${!!transcriptionResult?.speakers}`
			);
			this.logger.log(
				`[notifyTranscriptionComplete] Has speakerMap: ${!!transcriptionResult?.speakerMap}`
			);

			// Use service role key for service-to-service authentication
			const serviceKey = this.configService.get('MEMORO_SUPABASE_SERVICE_KEY');

			if (!serviceKey) {
				this.logger.error(
					'CRITICAL: MEMORO_SUPABASE_SERVICE_KEY is not configured for service-to-service communication'
				);
				throw new Error('Missing required configuration: MEMORO_SUPABASE_SERVICE_KEY');
			}

			const response = await fetch(`${memoroServiceUrl}/memoro/service/transcription-completed`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${serviceKey}`,
				},
				body: JSON.stringify({
					memoId,
					userId,
					transcriptionResult,
					route,
					success: true,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Memoro service error: ${response.status} - ${errorText}`);
			}

			this.logger.log(`Successfully notified memoro service of completion for memo ${memoId}`);
		} catch (error) {
			this.logger.error('Error notifying memoro service:', error);
			throw error;
		}
	}

	/**
	 * Notify memoro service of transcription error with enhanced context
	 */
	private async notifyTranscriptionErrorWithContext(
		memoId: string,
		userId: string,
		errorMessage: string,
		route: 'fast' | 'batch',
		fallbackStage: string,
		token?: string
	) {
		const memoroServiceUrl = this.configService.get('MEMORO_SERVICE_URL');

		if (!memoroServiceUrl) {
			this.logger.error('CRITICAL: MEMORO_SERVICE_URL is not configured');
			throw new Error('Missing required configuration: MEMORO_SERVICE_URL');
		}

		try {
			const errorContext = {
				memoId,
				userId,
				route,
				fallbackStage,
				error: errorMessage,
				timestamp: new Date().toISOString(),
				success: false,
			};

			// Use service role key for service-to-service authentication
			const serviceKey = this.configService.get('MEMORO_SUPABASE_SERVICE_KEY');

			if (!serviceKey) {
				this.logger.error(
					'CRITICAL: MEMORO_SUPABASE_SERVICE_KEY is not configured for service-to-service communication'
				);
				throw new Error('Missing required configuration: MEMORO_SUPABASE_SERVICE_KEY');
			}

			const response = await fetch(`${memoroServiceUrl}/memoro/service/transcription-completed`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${serviceKey}`,
				},
				body: JSON.stringify(errorContext),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(
					`Failed to notify error to memoro service: ${response.status} - ${errorText}`
				);
			}
		} catch (error) {
			this.logger.error('Error notifying memoro service of error:', error);
		}
	}

	/**
	 * Notify memoro service of transcription error (legacy method for compatibility)
	 */
	// Method removed: notifyTranscriptionError - was unused (TSLint 6133)

	private async processAudio(
		audioBuffer: Buffer,
		userId: string,
		spaceId?: string,
		recordingLanguages?: string[],
		enableDiarization?: boolean,
		audioPath?: string
	) {
		try {
			// 1. Get audio duration
			const duration = await this.getAudioDuration(audioBuffer);
			const durationMinutes = duration / 60;
			const shouldUseBatch = durationMinutes > this.batchThresholdMinutes;

			this.logger.log(`Audio: ${durationMinutes.toFixed(2)} minutes, batch: ${shouldUseBatch}`);

			const processedAudio = await this.convertAudioForAzure(audioBuffer, audioPath);
			this.logger.log(`Converted audio: ${processedAudio.length} bytes`);

			// Upload to Azure Blob Storage
			const blobUrl = await this.uploadToAzureBlob(processedAudio, userId);
			this.logger.log(`Uploaded to Azure Blob: ${blobUrl}`);

			// Create Azure Batch Job
			const jobId = await this.createBatchJob(
				blobUrl,
				userId,
				recordingLanguages,
				enableDiarization
			);
			this.logger.log(`Created batch job: ${jobId}`);

			// Return immediate response
			return {
				status: 'processing',
				type: 'batch',
				jobId,
				userId,
				spaceId,
				duration,
				message: 'Batch transcription started. Webhook will notify when complete.',
			};
		} catch (error) {
			return {
				status: 'failed',
				message: error.message,
				type: 'batch',
				jobId: null,
				userId,
				spaceId,
			};
		}
	}

	private async getAudioDuration(audioBuffer: Buffer): Promise<number> {
		return new Promise((resolve, reject) => {
			if (!audioBuffer || !(audioBuffer instanceof Buffer)) {
				this.logger.error('Invalid audio buffer provided');
				return reject(new Error('Invalid audio buffer provided'));
			}

			const tempFile = path.join(os.tmpdir(), `audio_${Date.now()}.tmp`);

			try {
				fs.writeFileSync(tempFile, audioBuffer);

				ffmpeg.ffprobe(tempFile, (err, metadata) => {
					// Cleanup
					try {
						fs.unlinkSync(tempFile);
					} catch {}

					if (err) {
						reject(err);
						return;
					}

					const duration = metadata?.format?.duration;
					if (typeof duration === 'number') {
						resolve(duration);
					} else {
						reject(new Error('Could not determine duration'));
					}
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	private async uploadToAzureBlob(audioBuffer: Buffer, userId: string): Promise<string> {
		const {
			BlobServiceClient,
			StorageSharedKeyCredential,
			generateBlobSASQueryParameters,
			BlobSASPermissions,
		} = await import('@azure/storage-blob');

		const accountName = this.configService.get('AZURE_STORAGE_ACCOUNT_NAME');
		const accountKey = this.configService.get('AZURE_STORAGE_ACCOUNT_KEY');

		if (!accountName || !accountKey) {
			throw new Error('Azure Storage credentials not configured');
		}

		const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
		const blobServiceClient = new BlobServiceClient(
			`https://${accountName}.blob.core.windows.net`,
			sharedKeyCredential
		);

		const containerName = 'batch-transcription';
		const blobName = `${userId}/${Date.now()}_audio.wav`;

		try {
			const containerClient = blobServiceClient.getContainerClient(containerName);

			// Ensure container exists
			await containerClient.createIfNotExists();

			const blockBlobClient = containerClient.getBlockBlobClient(blobName);

			await blockBlobClient.upload(audioBuffer, audioBuffer.length, {
				blobHTTPHeaders: { blobContentType: 'audio/wav' },
			});

			// Generate SAS token that expires in 2 hours
			const sasOptions = {
				containerName,
				blobName,
				permissions: BlobSASPermissions.parse('r'), // Read-only permission
				startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Start 5 minutes ago to avoid clock skew issues
				expiresOn: new Date(new Date().valueOf() + 6 * 60 * 60 * 1000), // Expires in 6 hours
			};

			// Generate the SAS token
			const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();

			// Construct the full URL with SAS token
			const blobUrlWithSas = `${blockBlobClient.url}?${sasToken}`;

			this.logger.log(
				`✅ Uploaded to Azure Blob with SAS token: ${blobUrlWithSas.substring(0, 100)}...`
			);

			return blobUrlWithSas;
		} catch (error) {
			this.logger.error('Azure Blob upload failed:', error);
			throw error;
		}
	}

	private async createBatchJob(
		blobUrl: string,
		userId: string,
		recordingLanguages?: string[],
		enableDiarization?: boolean
	): Promise<string> {
		const speechService = this.getRandomSpeechService();
		const accountName = this.configService.get('AZURE_STORAGE_ACCOUNT_NAME');
		const accountKey = this.configService.get('AZURE_STORAGE_ACCOUNT_KEY');

		if (!accountName || !accountKey) {
			throw new Error('Azure Storage credentials not configured');
		}

		// Create a SAS token for the results container
		const {
			StorageSharedKeyCredential,
			generateBlobSASQueryParameters,
			ContainerSASPermissions,
			BlobServiceClient,
		} = await import('@azure/storage-blob');
		const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
		const resultsContainerName = 'results';

		// Ensure the results container exists
		const blobServiceClient = new BlobServiceClient(
			`https://${accountName}.blob.core.windows.net`,
			sharedKeyCredential
		);
		const containerClient = blobServiceClient.getContainerClient(resultsContainerName);
		await containerClient.createIfNotExists();

		// Generate SAS token for the results container
		const sasToken = generateBlobSASQueryParameters(
			{
				containerName: resultsContainerName,
				permissions: ContainerSASPermissions.parse('rcw'), // Read + Create + Write
				startsOn: new Date(Date.now() - 5 * 60 * 1000), // Start 5 minutes ago to avoid clock skew issues
				expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
			},
			sharedKeyCredential
		).toString();

		// Create the destination URL with SAS token
		const destinationUrl = `https://${accountName}.blob.core.windows.net/${resultsContainerName}?${sasToken}`;

		this.logger.log(`Created destination container URL for results with SAS token`);

		// Define constants for speaker detection
		const MAX_SPEAKERS = 10;
		const DEFAULT_CANDIDATE_LOCALES = [
			'en-US',
			'de-DE',
			'en-GB',
			'fr-FR',
			'it-IT',
			'es-ES',
			'sv-SE',
			'ru-RU',
			'nl-NL',
			'tr-TR',
			'pt-PT',
		];

		// Build candidate locales list - ensure main locale is included and no duplicates
		const mainLocale = recordingLanguages?.[0] || 'en-US';
		let candidateLocales =
			recordingLanguages && recordingLanguages.length > 0
				? Array.from(new Set([mainLocale, ...recordingLanguages, ...DEFAULT_CANDIDATE_LOCALES]))
				: DEFAULT_CANDIDATE_LOCALES;

		// Azure requires: minimum 2, maximum 10 candidate locales
		candidateLocales = candidateLocales.slice(0, 10);
		if (candidateLocales.length < 2) {
			// Ensure we have at least 2 locales by adding en-US as fallback
			candidateLocales = Array.from(new Set([...candidateLocales, 'en-US', 'de-DE'])).slice(0, 10);
		}

		// Build the transcription config with optional diarization
		const properties: Record<string, any> = {
			wordLevelTimestampsEnabled: true,
			punctuationMode: 'DictatedAndAutomatic',
			profanityFilterMode: 'Masked',
			destinationContainerUrl: destinationUrl, // This is REQUIRED for Azure to store results
			// Add language identification - dynamically built candidate list
			languageIdentification: {
				candidateLocales: candidateLocales,
			},
		};

		// Conditionally add diarization based on user preference (default: enabled)
		if (enableDiarization !== false) {
			properties.diarizationEnabled = true;
			properties.diarization = {
				speakers: {
					minCount: 1,
					maxCount: MAX_SPEAKERS,
				},
			};
		}

		const config: Record<string, any> = {
			contentUrls: [blobUrl],
			properties,
			locale: mainLocale,
			displayName: `Batch transcription for ${userId}`,
		};

		this.logger.log(
			`Enhanced batch transcription config (${speechService.name}): languages=${recordingLanguages?.join(', ') || 'default'}, maxSpeakers=${MAX_SPEAKERS}`
		);
		console.log('Starting batch transcription with config: ' + JSON.stringify(config));
		try {
			const batchEndpoint = speechService.endpoint.replace(
				'/transcriptions:transcribe',
				'/v3.1/transcriptions'
			);
			const response = await fetch(batchEndpoint, {
				method: 'POST',
				headers: {
					'Ocp-Apim-Subscription-Key': speechService.key,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(config),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Azure Batch API error: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			const jobId = result.self.split('/').pop();

			this.logger.log(`✅ Created batch job: ${jobId}`);
			return jobId;
		} catch (error) {
			this.logger.error('Batch job creation failed:', error);
			throw error;
		}
	}

	private async convertAudioForAzure(audioBuffer: Buffer, audioPath?: string): Promise<Buffer> {
		const tempDir = os.tmpdir();

		// Extract the actual file extension from audioPath
		const fileExt = audioPath ? path.extname(audioPath) : '.m4a'; // fallback to .m4a
		const inputFile = path.join(tempDir, `input_${Date.now()}${fileExt}`);
		const outputFile = path.join(tempDir, `output_${Date.now()}.wav`);

		// Map common extensions to ffmpeg format names
		const formatMap: Record<string, string> = {
			'.m4a': 'mp4',
			'.mp4': 'mp4',
			'.mp3': 'mp3',
			'.wav': 'wav',
			'.aac': 'aac',
			'.ogg': 'ogg',
			'.webm': 'webm',
			'.flac': 'flac',
		};

		const inputFormat = formatMap[fileExt.toLowerCase()];

		try {
			// Write buffer to file
			fs.writeFileSync(inputFile, audioBuffer);

			// Verify the written file size matches the buffer
			const stats = fs.statSync(inputFile);
			if (stats.size !== audioBuffer.length) {
				this.logger.error(`Buffer size: ${audioBuffer.length}, Written file size: ${stats.size}`);
				throw new Error(
					`File write verification failed: expected ${audioBuffer.length} bytes, got ${stats.size} bytes`
				);
			}
			this.logger.log(`File written and verified: ${stats.size} bytes at ${inputFile}`);

			// Use ffprobe to validate the file before conversion
			const probeResult = await this.probeAudioFile(inputFile);
			if (!probeResult.valid) {
				// Check if it's the known 'chnl' box issue
				const isChnlIssue =
					probeResult.error?.includes('Unsupported') && probeResult.error?.includes('chnl');

				if (isChnlIssue) {
					this.logger.warn(`FFprobe warning: ${probeResult.error}`);
					this.logger.warn(
						'Detected unsupported chnl box (iOS spatial audio metadata) - will attempt conversion with error tolerance'
					);
					// Don't throw - ffmpeg with -err_detect ignore_err can handle this
				} else {
					this.logger.error(`FFprobe error details: ${probeResult.error}`);
					this.logger.error(`File path: ${inputFile}`);
					this.logger.error(`File exists: ${fs.existsSync(inputFile)}`);
					this.logger.error(`File size: ${fs.statSync(inputFile).size}`);

					// Log first 100 bytes as hex for debugging
					const fileBuffer = fs.readFileSync(inputFile);
					this.logger.error(`First 100 bytes (hex): ${fileBuffer.slice(0, 100).toString('hex')}`);

					throw new Error(`Audio file validation failed: ${probeResult.error}`);
				}
			} else {
				this.logger.log(
					`Audio file validated: format=${probeResult.format}, duration=${probeResult.duration}s, codec=${probeResult.codec}`
				);
			}

			// IMPORTANT: Use the actual detected format from ffprobe, not the file extension
			// This fixes issues where file extension doesn't match actual content (e.g., MP3 saved as .m4a)
			let actualInputFormat = inputFormat;
			if (probeResult.valid && probeResult.format) {
				// ffprobe returns format names like "mp3", "mov,mp4,m4a,3gp,3g2,mj2", etc.
				// Extract the primary format and map it to ffmpeg input format
				const probedFormat = probeResult.format.split(',')[0].trim();
				const probeFormatMap: Record<string, string> = {
					mp3: 'mp3',
					mov: 'mp4',
					mp4: 'mp4',
					m4a: 'mp4',
					wav: 'wav',
					aac: 'aac',
					ogg: 'ogg',
					webm: 'webm',
					flac: 'flac',
					matroska: 'matroska',
				};

				if (probeFormatMap[probedFormat]) {
					actualInputFormat = probeFormatMap[probedFormat];
					if (actualInputFormat !== inputFormat) {
						this.logger.warn(
							`Format mismatch detected: extension suggests ${inputFormat}, but content is ${actualInputFormat}. Using detected format.`
						);
					}
				}
			}

			// Wrap ffmpeg conversion in a Promise
			return new Promise<Buffer>((resolve, reject) => {
				const command = ffmpeg(inputFile)
					.audioCodec('pcm_s16le') // PCM 16-bit little-endian
					.audioFrequency(16000) // 16kHz sample rate
					.audioChannels(1) // Mono
					.format('wav') // WAV format
					.inputOptions([
						'-err_detect',
						'ignore_err', // Ignore unsupported metadata boxes (e.g., chnl v1)
						'-fflags',
						'+genpts', // Generate presentation timestamps
					])
					.outputOptions(['-y']); // Force overwrite existing files

				// Use the actual detected format (from ffprobe) instead of file extension
				if (actualInputFormat) {
					command.inputFormat(actualInputFormat);
					this.logger.log(
						`Using input format: ${actualInputFormat} for file: ${fileExt} (detected: ${probeResult.format})`
					);
				} else {
					this.logger.warn(`Unknown format ${fileExt}, letting ffmpeg auto-detect`);
				}

				command
					.on('end', () => {
						try {
							const converted = fs.readFileSync(outputFile);
							fs.unlinkSync(inputFile);
							fs.unlinkSync(outputFile);
							this.logger.log(`✅ Audio converted from ${fileExt} to WAV for Azure compatibility`);
							resolve(converted);
						} catch (error) {
							reject(error);
						}
					})
					.on('error', (err) => {
						this.logger.error(`❌ FFmpeg conversion error for ${fileExt}: ${err.message}`);
						try {
							if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
							if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
						} catch {}
						reject(err);
					})
					.save(outputFile);
			});
		} catch (error) {
			// Clean up on any error before ffmpeg
			try {
				if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
				if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
			} catch {}
			throw error;
		}
	}

	async checkBatchTranscriptionStatus(jobId: string) {
		const speechService = this.getRandomSpeechService();

		try {
			// Get transcription status
			const batchEndpoint = speechService.endpoint.replace(
				'/transcriptions:transcribe',
				'/v3.1/transcriptions'
			);
			const response = await fetch(`${batchEndpoint}/${jobId}`, {
				method: 'GET',
				headers: {
					'Ocp-Apim-Subscription-Key': speechService.key,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Azure Batch API error: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			this.logger.log('Batch transcription full details:', JSON.stringify(result, null, 2));

			// Get detailed error information if the job failed
			let errorDetails = null;
			if (result.status === 'Failed') {
				errorDetails = await this.getTranscriptionError(jobId, speechService);
			}

			// Format the response
			return {
				jobId,
				status: result.status,
				createdDateTime: result.createdDateTime,
				lastActionDateTime: result.lastActionDateTime,
				statusMessage: result.statusMessage || 'No status message provided',
				percentCompleted: result.percentCompleted,
				properties: result.properties,
				errorDetails,
				results: null,
				rawResponse: result,
			};
		} catch (error) {
			this.logger.error('Error checking batch status:', error);
			throw error;
		}
	}

	private async getTranscriptionError(jobId: string, speechService: any) {
		try {
			// Get transcription details
			const batchEndpoint = speechService.endpoint.replace(
				'/transcriptions:transcribe',
				'/v3.1/transcriptions'
			);
			const response = await fetch(`${batchEndpoint}/${jobId}`, {
				method: 'GET',
				headers: {
					'Ocp-Apim-Subscription-Key': speechService.key,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				return 'Could not retrieve error details';
			}

			const result = await response.json();

			// Check for error information in different places
			if (result.properties?.error) {
				return result.properties.error;
			}

			if (result.properties?.message) {
				return result.properties.message;
			}

			if (result.statusMessage) {
				return result.statusMessage;
			}

			// Try to get error from the transcription files
			if (result.links?.files) {
				const filesResponse = await fetch(result.links.files, {
					method: 'GET',
					headers: {
						'Ocp-Apim-Subscription-Key': speechService.key,
					},
				});

				if (filesResponse.ok) {
					const filesResult = await filesResponse.json();

					// Look for error files
					const errorFile = filesResult.values.find(
						(file: any) => file.kind === 'TranscriptionError'
					);

					if (errorFile && errorFile.links?.contentUrl) {
						const errorContentResponse = await fetch(errorFile.links.contentUrl, {
							method: 'GET',
							headers: {
								'Ocp-Apim-Subscription-Key': speechService.key,
							},
						});

						if (errorContentResponse.ok) {
							return await errorContentResponse.json();
						}
					}
				}
			}

			return 'No specific error details available';
		} catch (error) {
			this.logger.error('Error getting transcription error details:', error);
			return 'Error retrieving error details';
		}
	}

	async processAudioFromStorage(
		audioPath: string,
		userId: string,
		spaceId?: string,
		recordingLanguages?: string[],
		token?: string,
		memoId?: string,
		enableDiarization?: boolean
	) {
		try {
			this.logger.log(`Downloading audio from storage for batch processing: ${audioPath}`);

			// Download file from Supabase Storage (using service key for batch operations)
			const audioBuffer = await this.downloadFromStorage(audioPath);

			this.logger.log(`Downloaded audio: ${audioBuffer.length} bytes`);

			// Use existing processAudio method
			const result = await this.processAudio(
				audioBuffer,
				userId,
				spaceId,
				recordingLanguages,
				enableDiarization,
				audioPath
			);

			// Store jobId in memo metadata for recovery tracking
			if (result.jobId && result.status === 'processing' && token && memoId) {
				try {
					await this.storeBatchJobMetadata(memoId, result.jobId, token, userId);
					this.logger.log(`Stored batch job metadata for memo ${memoId}, jobId: ${result.jobId}`);
				} catch (metadataError) {
					this.logger.warn('Failed to store batch job metadata (non-critical):', metadataError);
					// Don't fail the entire process if metadata storage fails
				}
			}

			// Enhanced: Return jobId and other metadata for tracking
			if (result.jobId) {
				(result as any).memoId = memoId;
			}

			return result;
		} catch (error) {
			this.logger.error('Error in processAudioFromStorage:', error);
			throw new Error(`Storage processing failed: ${error.message}`);
		}
	}

	/**
	 * Store batch job metadata in memo for recovery tracking
	 */
	private async storeBatchJobMetadata(
		memoId: string,
		jobId: string,
		token: string,
		userId?: string
	): Promise<void> {
		const memoroServiceUrl = this.configService.get('MEMORO_SERVICE_URL');

		if (!memoroServiceUrl) {
			this.logger.error('CRITICAL: MEMORO_SERVICE_URL is not configured');
			throw new Error('Missing required configuration: MEMORO_SERVICE_URL');
		}

		try {
			// Use service role key for service-to-service authentication
			const serviceKey = this.configService.get('MEMORO_SUPABASE_SERVICE_KEY');

			if (!serviceKey) {
				this.logger.error(
					'CRITICAL: MEMORO_SUPABASE_SERVICE_KEY is not configured for service-to-service communication'
				);
				throw new Error('Missing required configuration: MEMORO_SUPABASE_SERVICE_KEY');
			}

			const response = await fetch(`${memoroServiceUrl}/memoro/service/update-batch-metadata`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${serviceKey}`,
				},
				body: JSON.stringify({
					memoId,
					jobId,
					batchTranscription: true,
					userId, // Pass userId for ownership validation
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Memoro service error: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			this.logger.log(`Successfully stored batch metadata: ${JSON.stringify(result)}`);
		} catch (error) {
			this.logger.error('Error storing batch job metadata:', error);
			throw error;
		}
	}

	private async downloadFromStorage(audioPath: string, token?: string): Promise<Buffer> {
		try {
			const { createClient } = await import('@supabase/supabase-js');
			const supabaseUrl = this.configService.get('MEMORO_SUPABASE_URL');
			const supabaseServiceKey = this.configService.get('MEMORO_SUPABASE_SERVICE_KEY');
			const supabaseAnonKey = this.configService.get('MEMORO_SUPABASE_ANON_KEY');

			if (!supabaseUrl) {
				this.logger.error('CRITICAL: MEMORO_SUPABASE_URL is not configured');
				throw new Error('Missing required configuration: MEMORO_SUPABASE_URL');
			}

			this.logger.log(`Supabase URL: ${supabaseUrl}`);
			this.logger.log(`Has service key: ${!!supabaseServiceKey}`);
			this.logger.log(`Has anon key: ${!!supabaseAnonKey}`);
			this.logger.log(`Has user token: ${!!token}`);

			if (!supabaseAnonKey && !supabaseServiceKey) {
				this.logger.error(
					'CRITICAL: Neither MEMORO_SUPABASE_ANON_KEY nor MEMORO_SUPABASE_SERVICE_KEY is configured'
				);
				throw new Error(
					'Missing required configuration: MEMORO_SUPABASE_ANON_KEY or MEMORO_SUPABASE_SERVICE_KEY'
				);
			}

			// Try to use service key first, otherwise use user token
			const supabase = supabaseServiceKey
				? createClient(supabaseUrl, supabaseServiceKey)
				: createClient(supabaseUrl, supabaseAnonKey, {
						global: { headers: { Authorization: `Bearer ${token}` } },
					});

			this.logger.log(
				`Using ${supabaseServiceKey ? 'service key' : 'user token'} for storage download`
			);

			// First, try to list the bucket to see if it exists and has files
			try {
				this.logger.log('Testing bucket access...');
				const { data: bucketList, error: bucketListError } = await supabase.storage.listBuckets();
				this.logger.log(
					'Available buckets:',
					JSON.stringify(bucketList?.map((b) => b.name) || [], null, 2)
				);

				if (bucketListError) {
					this.logger.error('Bucket list error:', JSON.stringify(bucketListError, null, 2));
				}

				// Try to list files in the user directory
				const userDir = audioPath.split('/')[0];
				this.logger.log(`Attempting to list files in user directory: ${userDir}`);
				const { data: fileList, error: fileListError } = await supabase.storage
					.from('user-uploads')
					.list(userDir, { limit: 10 });

				if (fileListError) {
					this.logger.error('File list error:', JSON.stringify(fileListError, null, 2));
				} else {
					this.logger.log(
						`Files in ${userDir}:`,
						JSON.stringify(fileList?.map((f) => f.name) || [], null, 2)
					);
				}
			} catch (debugError) {
				this.logger.error('Debug error:', debugError);
			}

			const { data: fileData, error: downloadError } = await supabase.storage
				.from('user-uploads')
				.download(audioPath);

			if (downloadError) {
				this.logger.error(
					'Supabase storage download error:',
					JSON.stringify(downloadError, null, 2)
				);
				this.logger.error('Attempting to download audioPath:', audioPath);
				throw new Error(
					`Failed to download file from storage: ${downloadError.message || JSON.stringify(downloadError)}`
				);
			}

			if (!fileData) {
				throw new Error('No file data returned from Supabase storage');
			}

			// Convert blob to buffer
			const arrayBuffer = await fileData.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Validate buffer size
			if (buffer.length < 1000) {
				throw new Error(`Downloaded file is too small: ${buffer.length} bytes`);
			}

			// Validate audio file header
			const isValidAudio = this.validateAudioHeader(buffer);
			if (!isValidAudio) {
				this.logger.error('Invalid audio file header detected');
				this.logger.error(`First 20 bytes: ${buffer.slice(0, 20).toString('hex')}`);
				throw new Error('Downloaded file does not appear to be a valid audio file');
			}

			this.logger.log(`Successfully downloaded and validated file: ${buffer.length} bytes`);
			return buffer;
		} catch (error) {
			this.logger.error('Error downloading from storage:', error);
			throw error;
		}
	}

	/**
	 * Probe audio file using ffprobe to get detailed metadata and validate
	 */
	private async probeAudioFile(filePath: string): Promise<{
		valid: boolean;
		format?: string;
		duration?: number;
		codec?: string;
		error?: string;
	}> {
		return new Promise((resolve) => {
			ffmpeg.ffprobe(filePath, (err, metadata) => {
				if (err) {
					this.logger.error(`FFprobe validation failed for ${filePath}: ${err.message}`);
					resolve({
						valid: false,
						error: err.message,
					});
				} else {
					const format = metadata.format?.format_name || 'unknown';
					const duration = metadata.format?.duration || 0;
					const codec = metadata.streams?.[0]?.codec_name || 'unknown';

					resolve({
						valid: true,
						format,
						duration,
						codec,
					});
				}
			});
		});
	}

	/**
	 * Validate audio file header to ensure it's a valid audio file
	 * Supports: M4A, MP4, MP3, WAV, OGG, WEBM, FLAC, AAC
	 */
	private validateAudioHeader(buffer: Buffer): boolean {
		if (buffer.length < 12) return false;

		// M4A/MP4: Check for 'ftyp' box at offset 4
		const ftypCheck = buffer.slice(4, 8).toString('utf-8');
		if (ftypCheck === 'ftyp') return true;

		// M4A/MP4: Sometimes 'mdat' appears first
		const mdatCheck = buffer.slice(0, 4).toString('utf-8');
		if (mdatCheck === 'mdat') return true;

		// M4A/MP4: Check for 'wide' atom
		if (ftypCheck === 'wide') return true;

		// MP3: Check for ID3 tag or MPEG frame sync
		const id3Check = buffer.slice(0, 3).toString('utf-8');
		if (id3Check === 'ID3') return true;

		// MP3: Check for MPEG frame sync (0xFFE or 0xFFF at start)
		if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return true;

		// WAV: Check for RIFF header
		const riffCheck = buffer.slice(0, 4).toString('utf-8');
		const waveCheck = buffer.slice(8, 12).toString('utf-8');
		if (riffCheck === 'RIFF' && waveCheck === 'WAVE') return true;

		// OGG: Check for OggS header
		const oggCheck = buffer.slice(0, 4).toString('utf-8');
		if (oggCheck === 'OggS') return true;

		// WEBM: Check for EBML header (0x1A 0x45 0xDF 0xA3)
		if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3)
			return true;

		// FLAC: Check for fLaC header
		const flacCheck = buffer.slice(0, 4).toString('utf-8');
		if (flacCheck === 'fLaC') return true;

		// AAC: Check for ADTS header (0xFF 0xF1 or 0xFF 0xF9)
		if (buffer[0] === 0xff && (buffer[1] === 0xf1 || buffer[1] === 0xf9)) return true;

		this.logger.warn('Unknown audio format detected');
		return false;
	}

	/**
	 * Detect if a file is a video based on its header
	 * Supports: MP4, MOV, AVI, MKV, WEBM, FLV, WMV
	 */
	private isVideoFile(buffer: Buffer, filePath?: string): boolean {
		if (buffer.length < 12) return false;

		// Check file extension first
		if (filePath) {
			const ext = path.extname(filePath).toLowerCase();
			const videoExtensions = [
				'.mp4',
				'.mov',
				'.m4v',
				'.avi',
				'.mkv',
				'.webm',
				'.flv',
				'.wmv',
				'.mpeg',
				'.mpg',
			];
			if (videoExtensions.includes(ext)) {
				this.logger.log(`Detected video file by extension: ${ext}`);
				return true;
			}
		}

		// MP4/MOV: Check for 'ftyp' box
		const ftypCheck = buffer.slice(4, 8).toString('utf-8');
		if (ftypCheck === 'ftyp') {
			// Check for video-specific brand types
			const brandCheck = buffer.slice(8, 12).toString('utf-8');
			const videoBrands = ['mp41', 'mp42', 'isom', 'qt  ', 'm4v '];
			if (videoBrands.some((brand) => brandCheck.startsWith(brand))) {
				return true;
			}
		}

		// AVI: Check for RIFF + AVI header
		const riffCheck = buffer.slice(0, 4).toString('utf-8');
		const aviCheck = buffer.slice(8, 12).toString('utf-8');
		if (riffCheck === 'RIFF' && aviCheck === 'AVI ') return true;

		// MKV/WEBM: Check for EBML header
		if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
			// Further check for Matroska signature
			if (buffer.length >= 20) {
				const docType = buffer.slice(16, 20).toString('utf-8');
				if (docType === 'webm' || docType.startsWith('matroska')) return true;
			}
			return true; // Likely video EBML file
		}

		// FLV: Check for FLV header (0x46 0x4C 0x56)
		if (buffer[0] === 0x46 && buffer[1] === 0x4c && buffer[2] === 0x56) return true;

		return false;
	}

	/**
	 * Extract audio from video file using FFmpeg
	 * Converts video to high-quality audio suitable for transcription
	 * @param videoBuffer - The video file buffer
	 * @param videoPath - Optional path hint for format detection
	 * @returns Extracted audio as Buffer in WAV format
	 */
	async extractAudioFromVideo(videoBuffer: Buffer, videoPath?: string): Promise<Buffer> {
		this.logger.log('[extractAudioFromVideo] Starting video-to-audio extraction');

		const tempDir = os.tmpdir();
		const fileExt = videoPath ? path.extname(videoPath) : '.mp4';
		const inputFile = path.join(tempDir, `video_input_${Date.now()}${fileExt}`);
		const outputFile = path.join(tempDir, `audio_output_${Date.now()}.wav`);

		const cleanup = async () => {
			try {
				await Promise.all([
					fs.promises.unlink(inputFile).catch(() => {}),
					fs.promises.unlink(outputFile).catch(() => {}),
				]);
			} catch (error) {
				this.logger.warn('Cleanup warning:', error);
			}
		};

		try {
			// Write video buffer to temporary file
			await fs.promises.writeFile(inputFile, videoBuffer);
			this.logger.log(`[extractAudioFromVideo] Video file written: ${videoBuffer.length} bytes`);

			// Extract audio using FFmpeg
			return new Promise<Buffer>((resolve, reject) => {
				ffmpeg(inputFile)
					.noVideo() // Remove video stream
					.audioCodec('pcm_s16le') // PCM 16-bit for best quality
					.audioFrequency(16000) // 16kHz sample rate (Azure optimal)
					.audioChannels(1) // Mono for speech recognition
					.format('wav') // WAV format
					.audioFilters([
						'highpass=f=80', // Remove very low frequencies
						'lowpass=f=8000', // Remove frequencies above 8kHz
						'volume=1.5', // Slight volume boost for better transcription
						'afftdn=nf=-20', // Noise reduction
					])
					.outputOptions([
						'-y', // Overwrite output file
						'-loglevel',
						'warning', // Reduce FFmpeg output verbosity
					])
					.on('start', (commandLine) => {
						this.logger.log(`[extractAudioFromVideo] FFmpeg command: ${commandLine}`);
					})
					.on('progress', (progress) => {
						if (progress.percent) {
							this.logger.log(`[extractAudioFromVideo] Progress: ${Math.round(progress.percent)}%`);
						}
					})
					.on('end', async () => {
						try {
							const audioBuffer = await fs.promises.readFile(outputFile);
							await cleanup();
							this.logger.log(
								`[extractAudioFromVideo] Successfully extracted audio: ${audioBuffer.length} bytes`
							);
							resolve(audioBuffer);
						} catch (error) {
							await cleanup();
							reject(new Error(`Failed to read extracted audio: ${error.message}`));
						}
					})
					.on('error', async (err) => {
						await cleanup();
						this.logger.error(`[extractAudioFromVideo] FFmpeg error: ${err.message}`);
						reject(new Error(`Video-to-audio extraction failed: ${err.message}`));
					})
					.save(outputFile);
			});
		} catch (error) {
			await cleanup();
			this.logger.error('[extractAudioFromVideo] Extraction error:', error);
			throw error;
		}
	}

	/**
	 * Process video file: extract audio then transcribe
	 * This is the main entry point for video file processing
	 */
	async processVideoFile(
		videoPath: string,
		memoId: string,
		userId: string,
		spaceId?: string,
		recordingLanguages?: string[],
		token?: string,
		enableDiarization?: boolean,
		isAppend?: boolean,
		recordingIndex?: number
	) {
		try {
			this.logger.log(`[processVideoFile] Processing video file: ${videoPath}`);

			// Download video from storage
			const videoBuffer = await this.downloadFromStorage(videoPath, token);
			this.logger.log(`[processVideoFile] Downloaded video: ${videoBuffer.length} bytes`);

			// Verify it's actually a video file
			if (!this.isVideoFile(videoBuffer, videoPath)) {
				throw new Error('File does not appear to be a valid video file');
			}

			// Extract audio from video
			const audioBuffer = await this.extractAudioFromVideo(videoBuffer, videoPath);
			this.logger.log(`[processVideoFile] Audio extracted: ${audioBuffer.length} bytes`);

			// Get audio duration for routing decision
			const duration = await this.getAudioDuration(audioBuffer);
			const durationMinutes = duration / 60;
			this.logger.log(`[processVideoFile] Audio duration: ${durationMinutes.toFixed(2)} minutes`);

			// Route to fast or batch transcription based on duration
			if (durationMinutes < this.batchThresholdMinutes) {
				this.logger.log('[processVideoFile] Using fast transcription route');

				// Convert to Azure-compatible format
				const convertedAudio = await this.convertAudioForAzure(audioBuffer, 'extracted_audio.wav');

				// Perform real-time transcription
				const transcriptionResult = await this.performRealtimeTranscription(
					convertedAudio,
					recordingLanguages,
					enableDiarization
				);

				// Send appropriate callback
				if (isAppend) {
					await this.notifyAppendTranscriptionComplete(
						memoId,
						userId,
						transcriptionResult,
						'fast',
						token,
						recordingIndex
					);
				} else {
					await this.notifyTranscriptionComplete(
						memoId,
						userId,
						transcriptionResult,
						'fast',
						token
					);
				}

				return {
					success: true,
					route: 'fast',
					source: 'video',
					memoId,
					message: 'Video processed and transcribed successfully via fast route',
				};
			} else {
				this.logger.log('[processVideoFile] Using batch transcription route');

				// Process through batch pipeline
				const processedAudio = await this.convertAudioForAzure(audioBuffer, 'extracted_audio.wav');
				const blobUrl = await this.uploadToAzureBlob(processedAudio, userId);
				const jobId = await this.createBatchJob(
					blobUrl,
					userId,
					recordingLanguages,
					enableDiarization
				);

				// Store batch metadata
				if (token && memoId) {
					await this.storeBatchJobMetadata(memoId, jobId, token, userId);
				}

				return {
					success: true,
					route: 'batch',
					source: 'video',
					jobId,
					memoId,
					userId,
					duration,
					message: 'Video processed - batch transcription started',
				};
			}
		} catch (error) {
			this.logger.error('[processVideoFile] Error processing video:', error);
			throw new Error(`Video processing failed: ${error.message}`);
		}
	}
}
