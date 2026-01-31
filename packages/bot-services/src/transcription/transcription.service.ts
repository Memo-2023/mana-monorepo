import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	SttResponse,
	TranscriptionOptions,
	STT_MODULE_OPTIONS,
	TranscriptionModuleOptions,
} from './types';

/**
 * Shared Speech-to-Text transcription service
 *
 * Connects to mana-stt service to transcribe audio files.
 * Used by Matrix bots for voice command processing.
 *
 * @example
 * ```typescript
 * // In NestJS module
 * imports: [TranscriptionModule.register({ sttUrl: 'http://mana-stt:3020' })]
 *
 * // In service
 * const text = await transcriptionService.transcribe(audioBuffer, { language: 'de' });
 * ```
 */
@Injectable()
export class TranscriptionService {
	private readonly logger = new Logger(TranscriptionService.name);
	private readonly sttUrl: string;
	private readonly defaultLanguage: string;

	constructor(
		@Optional() private configService: ConfigService,
		@Optional() @Inject(STT_MODULE_OPTIONS) private options?: TranscriptionModuleOptions
	) {
		// Priority: module options > config > environment > default
		this.sttUrl =
			options?.sttUrl ||
			this.configService?.get<string>('stt.url') ||
			this.configService?.get<string>('STT_URL') ||
			'http://localhost:3020';

		this.defaultLanguage = options?.defaultLanguage || 'de';

		this.logger.log(`STT Service URL: ${this.sttUrl}`);
	}

	/**
	 * Transcribe audio buffer to text
	 *
	 * @param audioBuffer - Audio data (supports ogg, wav, mp3, etc.)
	 * @param options - Transcription options (language, model)
	 * @returns Transcribed text
	 */
	async transcribe(audioBuffer: Buffer, options?: TranscriptionOptions): Promise<string> {
		const language = options?.language || this.defaultLanguage;

		const formData = new FormData();
		const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
		formData.append('file', blob, 'audio.ogg');
		formData.append('language', language);

		if (options?.model) {
			formData.append('model', options.model);
		}

		try {
			const response = await fetch(`${this.sttUrl}/transcribe`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`STT service error: ${response.status} - ${errorText}`);
			}

			const result = (await response.json()) as SttResponse;
			this.logger.log(`Transcription completed: ${result.text.substring(0, 50)}...`);
			return result.text;
		} catch (error) {
			this.logger.error('Transcription failed:', error);
			throw error;
		}
	}

	/**
	 * Transcribe audio and return full response with metadata
	 */
	async transcribeWithMetadata(
		audioBuffer: Buffer,
		options?: TranscriptionOptions
	): Promise<SttResponse> {
		const language = options?.language || this.defaultLanguage;

		const formData = new FormData();
		const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
		formData.append('file', blob, 'audio.ogg');
		formData.append('language', language);

		if (options?.model) {
			formData.append('model', options.model);
		}

		try {
			const response = await fetch(`${this.sttUrl}/transcribe`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`STT service error: ${response.status} - ${errorText}`);
			}

			return (await response.json()) as SttResponse;
		} catch (error) {
			this.logger.error('Transcription failed:', error);
			throw error;
		}
	}

	/**
	 * Check if STT service is healthy
	 */
	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.sttUrl}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Get STT service URL (for debugging/logging)
	 */
	getSttUrl(): string {
		return this.sttUrl;
	}
}
