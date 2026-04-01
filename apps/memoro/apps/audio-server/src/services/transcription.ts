import {
	getAvailableSpeechServices,
	pickRandomService,
	type SpeechServiceConfig,
} from '../lib/azure.ts';
import { convertToAzureWav } from './ffmpeg.ts';
import { BatchTranscriptionService } from './batch.ts';
import * as path from 'path';

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

const TOTAL_TIMEOUT_MS = 1_200_000; // 20 minutes
const FAST_TIMEOUT_MS = 1_200_000; // 20 minutes

// Self-hosted mana-stt service (WhisperX on GPU server)
const MANA_STT_URL = process.env.MANA_STT_URL || '';
const MANA_STT_API_KEY = process.env.MANA_STT_API_KEY || '';

interface TranscriptionResult {
	transcript: string;
	utterances: Array<{
		speaker: number;
		text: string;
		offset: number;
		duration: number;
	}>;
	speakers: Record<string, string>;
	speakerMap: Record<string, number>;
	languages: string[];
	primary_language: string;
}

interface TranscribeParams {
	audioBuffer: Buffer;
	audioPath: string;
	memoId: string;
	userId: string;
	spaceId?: string;
	recordingLanguages?: string[];
	enableDiarization?: boolean;
	isAppend?: boolean;
	recordingIndex?: number;
	serviceKey: string;
	serverUrl: string;
}

export class TranscriptionService {
	private readonly batchService = new BatchTranscriptionService();

	async transcribeWithFallback(params: TranscribeParams): Promise<void> {
		const {
			audioBuffer,
			audioPath,
			memoId,
			userId,
			recordingLanguages,
			enableDiarization,
			isAppend,
			recordingIndex,
			serviceKey,
			serverUrl,
		} = params;
		const startTime = Date.now();

		const checkTimeout = (stage: string): void => {
			const elapsed = Date.now() - startTime;
			if (elapsed > TOTAL_TIMEOUT_MS) {
				throw new Error(`Fallback chain timeout exceeded after ${elapsed}ms in stage: ${stage}`);
			}
		};

		const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
			return Promise.race([
				promise,
				new Promise<T>((_, reject) =>
					setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs)
				),
			]);
		};

		try {
			console.log(`[Transcription] Starting fallback chain for memo ${memoId} (${audioPath})`);

			// Attempt 0: Self-hosted mana-stt (WhisperX on GPU server) — primary
			if (MANA_STT_URL) {
				try {
					checkTimeout('mana-stt');
					console.log(`[Transcription] Trying mana-stt (WhisperX) at ${MANA_STT_URL}`);

					const result = await withTimeout(
						this.performManaSTTTranscription(
							audioBuffer,
							audioPath,
							recordingLanguages,
							enableDiarization
						),
						FAST_TIMEOUT_MS,
						'mana-stt transcription'
					);

					await this.notifyServer(
						memoId,
						userId,
						result,
						'fast',
						serviceKey,
						serverUrl,
						isAppend,
						recordingIndex
					);
					console.log(`[Transcription] mana-stt (WhisperX) succeeded for memo ${memoId}`);
					return;
				} catch (manaSttError: unknown) {
					const msg = manaSttError instanceof Error ? manaSttError.message : String(manaSttError);
					console.warn(`[Transcription] mana-stt failed, falling back to Azure: ${msg}`);
				}
			}

			// Attempt 1: Fast realtime transcription (Azure)
			try {
				checkTimeout('initial-fast');
				const services = getAvailableSpeechServices();
				const service = pickRandomService(services);

				const wavBuffer = await convertToAzureWav(audioBuffer, path.extname(audioPath) || '.m4a');

				const result = await withTimeout(
					this.performRealtimeTranscription(
						wavBuffer,
						service,
						recordingLanguages,
						enableDiarization
					),
					FAST_TIMEOUT_MS,
					'Fast transcription'
				);

				await this.notifyServer(
					memoId,
					userId,
					result,
					'fast',
					serviceKey,
					serverUrl,
					isAppend,
					recordingIndex
				);
				console.log(`[Transcription] Fast transcription succeeded for memo ${memoId}`);
				return;
			} catch (fastError: unknown) {
				const fastErrMsg = fastError instanceof Error ? fastError.message : String(fastError);
				console.warn(`[Transcription] Fast route failed: ${fastErrMsg}`);

				// Attempt 2: Service retry with different Azure key (429 rate limit)
				if (this.shouldRetryWithDifferentService(fastErrMsg)) {
					try {
						checkTimeout('service-retry');
						console.log(`[Transcription] Retrying with different Azure service key`);

						const services = getAvailableSpeechServices();
						if (services.length > 1) {
							const service = pickRandomService(services);
							const wavBuffer = await convertToAzureWav(
								audioBuffer,
								path.extname(audioPath) || '.m4a'
							);
							const result = await withTimeout(
								this.performRealtimeTranscription(
									wavBuffer,
									service,
									recordingLanguages,
									enableDiarization
								),
								FAST_TIMEOUT_MS,
								'Service retry transcription'
							);
							await this.notifyServer(
								memoId,
								userId,
								result,
								'fast',
								serviceKey,
								serverUrl,
								isAppend,
								recordingIndex
							);
							console.log(`[Transcription] Service retry succeeded for memo ${memoId}`);
							return;
						} else {
							console.warn(
								`[Transcription] Only one Azure service configured, skipping service retry`
							);
						}
					} catch (serviceRetryError: unknown) {
						const msg =
							serviceRetryError instanceof Error
								? serviceRetryError.message
								: String(serviceRetryError);
						console.warn(`[Transcription] Service retry failed: ${msg}`);
					}
				}

				// Attempt 3: FFmpeg conversion + retry (422 / format errors)
				if (this.shouldRetryWithConversion(fastErrMsg)) {
					try {
						checkTimeout('conversion-retry');
						console.log(`[Transcription] Retrying with enhanced audio conversion`);

						const services = getAvailableSpeechServices();
						const service = pickRandomService(services);

						// Force conversion even if already attempted — use explicit wav extension
						const wavBuffer = await convertToAzureWav(audioBuffer, '.wav');

						const result = await withTimeout(
							this.performRealtimeTranscription(
								wavBuffer,
								service,
								recordingLanguages,
								enableDiarization
							),
							FAST_TIMEOUT_MS,
							'Conversion retry transcription'
						);
						await this.notifyServer(
							memoId,
							userId,
							result,
							'fast',
							serviceKey,
							serverUrl,
							isAppend,
							recordingIndex
						);
						console.log(`[Transcription] Conversion retry succeeded for memo ${memoId}`);
						return;
					} catch (conversionError: unknown) {
						const msg =
							conversionError instanceof Error ? conversionError.message : String(conversionError);
						console.warn(`[Transcription] Conversion retry failed: ${msg}. Falling back to batch.`);
					}
				}

				// Attempt 4: Azure batch transcription fallback
				checkTimeout('batch-fallback');
				console.log(`[Transcription] Falling back to Azure Batch transcription for memo ${memoId}`);

				try {
					const services = getAvailableSpeechServices();
					const service = pickRandomService(services);
					const batchResult = await this.batchService.createBatchJob(
						audioBuffer,
						userId,
						service,
						recordingLanguages,
						enableDiarization
					);
					console.log(`[Transcription] Batch job created: ${batchResult.jobId} for memo ${memoId}`);
					// Batch jobs complete asynchronously via webhook — no immediate notify here
					return;
				} catch (batchError: unknown) {
					const msg = batchError instanceof Error ? batchError.message : String(batchError);
					throw new Error(`All transcription methods failed. Batch error: ${msg}`);
				}
			}
		} catch (error: unknown) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			console.error(`[Transcription] All fallback attempts failed for memo ${memoId}: ${errorMsg}`);

			await this.notifyServerError(memoId, userId, errorMsg, serviceKey, serverUrl);
		}
	}

	async performRealtimeTranscription(
		audioBuffer: Buffer,
		speechService: SpeechServiceConfig,
		languages?: string[],
		diarization?: boolean
	): Promise<TranscriptionResult> {
		const definition: Record<string, unknown> = {
			wordLevelTimestampsEnabled: true,
			punctuationMode: 'Automatic',
			profanityFilterMode: 'None',
		};

		if (diarization !== false) {
			definition['diarization'] = {
				enabled: true,
				maxSpeakers: 10,
			};
		}

		const candidateLocales = languages && languages.length > 0 ? languages : CANDIDATE_LOCALES;

		definition['languageIdentification'] = {
			candidateLocales,
		};

		console.log(`[Azure] Sending realtime transcription request to ${speechService.name}`);
		console.log(`[Azure] Definition: ${JSON.stringify(definition)}`);

		const formData = new FormData();
		formData.append('definition', JSON.stringify(definition));

		const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
		formData.append('audio', audioBlob, 'audio.wav');

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

			if (response.status === 429) {
				const retryAfter = response.headers.get('retry-after') ?? 'n/a';
				const requestId = response.headers.get('x-ms-request-id') ?? 'n/a';
				const quotaReason = response.headers.get('x-ms-service-quota-reason') ?? 'n/a';
				console.error(
					`[AZURE_429_ERROR] Rate limited on ${speechService.name} — retry-after: ${retryAfter}, request-id: ${requestId}, quota-reason: ${quotaReason}`
				);
				console.error(`[AZURE_429_ERROR] Body: ${errorText}`);
				throw new Error(`[AZURE_429_ERROR] Azure Speech API rate limited (429): ${errorText}`);
			}

			if (response.status === 422) {
				const requestId = response.headers.get('x-ms-request-id') ?? 'n/a';
				console.error(
					`[AZURE_422_ERROR] Format error on ${speechService.name} — request-id: ${requestId}`
				);
				console.error(`[AZURE_422_ERROR] Body: ${errorText}`);
				throw new Error(`[AZURE_422_ERROR] Azure Speech API format error (422): ${errorText}`);
			}

			throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
		}

		const azureResult = (await response.json()) as Parameters<
			typeof this.processTranscriptionResult
		>[0];
		console.log(`[Azure] Transcription response received from ${speechService.name}`);
		console.log(`[Azure] Phrase count: ${azureResult?.phrases?.length ?? 0}`);

		return this.processTranscriptionResult(azureResult);
	}

	processTranscriptionResult(azureResult: {
		phrases?: Array<{
			text?: string;
			speaker?: number;
			offsetMilliseconds?: number;
			durationMilliseconds?: number;
			locale?: string;
			words?: unknown[];
		}>;
		combinedPhrases?: Array<{ text?: string }>;
		locale?: string;
	}): TranscriptionResult {
		let transcript = '';
		let primary_language = 'de-DE';
		let languages: string[] = ['de-DE'];

		// Determine languages from phrase-level locale analysis (more accurate than top-level)
		if (azureResult.phrases && azureResult.phrases.length > 0) {
			const phraseCounts: Record<string, number> = {};
			const charCounts: Record<string, number> = {};

			for (const phrase of azureResult.phrases) {
				if (phrase.locale) {
					phraseCounts[phrase.locale] = (phraseCounts[phrase.locale] ?? 0) + 1;
					charCounts[phrase.locale] = (charCounts[phrase.locale] ?? 0) + (phrase.text?.length ?? 0);
				}
			}

			const uniqueLanguages = Object.keys(phraseCounts);
			if (uniqueLanguages.length > 0) {
				// Pick primary by character count — more accurate than phrase count
				primary_language = uniqueLanguages.reduce((best, lang) =>
					(charCounts[lang] ?? 0) > (charCounts[best] ?? 0) ? lang : best
				);
				languages = uniqueLanguages;
				console.log(
					`[Transcription] Language detection: ${JSON.stringify(charCounts)}, primary: ${primary_language}`
				);
			}
		} else if (azureResult.locale) {
			primary_language = azureResult.locale;
			languages = [azureResult.locale];
		}

		// Build transcript text
		if (azureResult.combinedPhrases && azureResult.combinedPhrases.length > 0) {
			transcript = azureResult.combinedPhrases[0]?.text ?? '';
		} else if (azureResult.phrases && azureResult.phrases.length > 0) {
			transcript = azureResult.phrases.map((p) => p.text ?? '').join(' ');
		}

		// Build utterances and speaker maps
		const utterances: TranscriptionResult['utterances'] = [];
		const speakerIdSet = new Set<number>();

		if (azureResult.phrases) {
			for (const phrase of azureResult.phrases) {
				if (phrase.speaker !== undefined && phrase.text) {
					utterances.push({
						speaker: phrase.speaker,
						text: phrase.text,
						offset: phrase.offsetMilliseconds ?? 0,
						duration: phrase.durationMilliseconds ?? 0,
					});
					speakerIdSet.add(phrase.speaker);
				}
			}
		}

		// Sort by time
		utterances.sort((a, b) => a.offset - b.offset);

		// Build speaker label maps
		const speakers: Record<string, string> = {};
		const speakerMap: Record<string, number> = {};

		for (const speakerId of speakerIdSet) {
			const label = `Speaker ${speakerId}`;
			speakers[String(speakerId)] = label;
			speakerMap[label] = speakerId;
		}

		console.log(
			`[Transcription] Processed: ${transcript.length} chars, ${utterances.length} utterances, ${speakerIdSet.size} speakers, lang: ${primary_language}`
		);

		return { transcript, utterances, speakers, speakerMap, languages, primary_language };
	}

	/**
	 * Transcribe via self-hosted mana-stt service (WhisperX on GPU server).
	 * Uses the /transcribe/whisperx endpoint which returns rich data with
	 * diarization, word alignment, and utterances.
	 */
	async performManaSTTTranscription(
		audioBuffer: Buffer,
		audioPath: string,
		languages?: string[],
		diarization?: boolean
	): Promise<TranscriptionResult> {
		const ext = path.extname(audioPath) || '.m4a';
		const mimeTypes: Record<string, string> = {
			'.m4a': 'audio/mp4',
			'.mp3': 'audio/mpeg',
			'.wav': 'audio/wav',
			'.flac': 'audio/flac',
			'.ogg': 'audio/ogg',
			'.webm': 'audio/webm',
			'.mp4': 'audio/mp4',
		};
		const mimeType = mimeTypes[ext] || 'audio/wav';

		// Determine language hint from recording languages (e.g., 'de-DE' → 'de')
		const langHint = languages?.[0]?.split('-')[0] || null;

		const formData = new FormData();
		const audioBlob = new Blob([audioBuffer], { type: mimeType });
		formData.append('file', audioBlob, `audio${ext}`);
		if (langHint) formData.append('language', langHint);
		formData.append('diarization', String(diarization !== false));
		formData.append('alignment', 'true');

		const headers: Record<string, string> = {
			Accept: 'application/json',
		};
		if (MANA_STT_API_KEY) {
			headers['X-API-Key'] = MANA_STT_API_KEY;
		}

		console.log(
			`[mana-stt] Sending WhisperX request (${audioBuffer.length} bytes, lang=${langHint})`
		);

		const response = await fetch(`${MANA_STT_URL}/transcribe/whisperx`, {
			method: 'POST',
			headers,
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`mana-stt error: ${response.status} - ${errorText}`);
		}

		const sttResult = (await response.json()) as {
			text: string;
			language?: string;
			duration_seconds?: number;
			utterances?: Array<{
				speaker: number;
				text: string;
				offset: number;
				duration: number;
			}>;
			speakers?: Record<string, string>;
			speaker_map?: Record<string, number>;
			languages?: string[];
			primary_language?: string;
		};

		console.log(
			`[mana-stt] Response: ${sttResult.text.length} chars, ` +
				`${sttResult.utterances?.length ?? 0} utterances, ` +
				`lang=${sttResult.primary_language ?? sttResult.language}`
		);

		// Map mana-stt language codes to locale format (e.g., 'de' → 'de-DE')
		const localeMap: Record<string, string> = {
			de: 'de-DE',
			en: 'en-GB',
			fr: 'fr-FR',
			it: 'it-IT',
			es: 'es-ES',
			sv: 'sv-SE',
			ru: 'ru-RU',
			nl: 'nl-NL',
			tr: 'tr-TR',
			pt: 'pt-PT',
			ja: 'ja-JP',
			ko: 'ko-KR',
			zh: 'zh-CN',
			ar: 'ar-SA',
			hi: 'hi-IN',
		};

		const rawLang = sttResult.primary_language ?? sttResult.language ?? 'de';
		const primaryLocale = localeMap[rawLang] ?? `${rawLang}-${rawLang.toUpperCase()}`;
		const detectedLanguages = (sttResult.languages ?? [rawLang]).map(
			(l) => localeMap[l] ?? `${l}-${l.toUpperCase()}`
		);

		return {
			transcript: sttResult.text,
			utterances: sttResult.utterances ?? [],
			speakers: sttResult.speakers ?? {},
			speakerMap: sttResult.speaker_map ?? {},
			languages: detectedLanguages,
			primary_language: primaryLocale,
		};
	}

	shouldRetryWithDifferentService(errorMsg: string): boolean {
		const has429 = /429|AZURE_429_ERROR|rate.?limit|too many requests/i.test(errorMsg);
		console.log(
			`[Transcription] shouldRetryWithDifferentService: ${has429} (${errorMsg.substring(0, 100)})`
		);
		return has429;
	}

	shouldRetryWithConversion(errorMsg: string): boolean {
		const patterns = [
			/422/,
			/AZURE_422_ERROR/,
			/audio.?format/i,
			/InvalidAudioFormat/i,
			/audio\/x-m4a/i,
			/unsupported.*format/i,
			/invalid.*audio/i,
			/codec.*not.*supported/i,
			/content.*type.*unsupported/i,
			/bitrate.*not.*supported/i,
			/sample.*rate.*invalid/i,
			/media.*type.*not.*supported/i,
		];
		const matches = patterns.some((p) => p.test(errorMsg));
		console.log(
			`[Transcription] shouldRetryWithConversion: ${matches} (${errorMsg.substring(0, 100)})`
		);
		return matches;
	}

	async notifyServer(
		memoId: string,
		userId: string,
		result: TranscriptionResult,
		route: 'fast' | 'batch',
		serviceKey: string,
		serverUrl: string,
		isAppend?: boolean,
		recordingIndex?: number
	): Promise<void> {
		const endpoint = isAppend
			? `${serverUrl}/api/v1/internal/append-transcription-completed`
			: `${serverUrl}/api/v1/internal/transcription-completed`;

		const body: Record<string, unknown> = {
			memoId,
			userId,
			transcriptionResult: result,
			route,
			success: true,
		};

		if (isAppend) {
			body['recordingIndex'] = recordingIndex;
		}

		console.log(`[Callback] Notifying server at ${endpoint} for memo ${memoId}`);

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Service-Key': serviceKey,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Server callback failed: ${response.status} - ${errorText}`);
		}

		console.log(`[Callback] Server notified successfully for memo ${memoId}`);
	}

	async notifyServerError(
		memoId: string,
		userId: string,
		errorMsg: string,
		serviceKey: string,
		serverUrl: string
	): Promise<void> {
		const endpoint = `${serverUrl}/api/v1/internal/transcription-completed`;

		console.error(
			`[Callback] Notifying server of transcription error for memo ${memoId}: ${errorMsg}`
		);

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Service-Key': serviceKey,
				},
				body: JSON.stringify({
					memoId,
					userId,
					error: errorMsg,
					success: false,
					timestamp: new Date().toISOString(),
				}),
			});

			if (!response.ok) {
				const text = await response.text();
				console.error(`[Callback] Error notification failed: ${response.status} - ${text}`);
			}
		} catch (notifyErr: unknown) {
			const msg = notifyErr instanceof Error ? notifyErr.message : String(notifyErr);
			console.error(`[Callback] Failed to notify server of error: ${msg}`);
		}
	}
}
