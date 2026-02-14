import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TranscriptionResult {
	text: string;
	language?: string;
	model?: string;
	duration?: number;
}

export type SttModel = 'whisper' | 'voxtral' | 'auto';
export type SttLanguage = 'de' | 'en' | 'auto';

@Injectable()
export class SttService {
	private readonly logger = new Logger(SttService.name);
	private readonly sttUrl: string;
	private readonly apiKey: string;

	constructor(private configService: ConfigService) {
		this.sttUrl = this.configService.get<string>('stt.url', 'http://localhost:3020');
		this.apiKey = this.configService.get<string>('stt.apiKey', '');
	}

	/**
	 * Transcribe audio to text
	 */
	async transcribe(
		audioBuffer: Buffer,
		language: SttLanguage = 'de',
		model: SttModel = 'whisper'
	): Promise<TranscriptionResult> {
		const endpoint = this.getEndpoint(model);

		this.logger.debug(
			`Transcribing ${audioBuffer.length} bytes with ${model}, language=${language}`
		);

		const formData = new FormData();
		const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
		formData.append('file', blob, 'audio.ogg');

		if (language !== 'auto') {
			formData.append('language', language);
		}

		try {
			const headers: Record<string, string> = {};
			if (this.apiKey) {
				headers['X-API-Key'] = this.apiKey;
			}

			const response = await fetch(`${this.sttUrl}${endpoint}`, {
				method: 'POST',
				headers,
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(`STT failed: ${response.status} - ${errorText}`);
				throw new Error(`STT service error: ${response.status}`);
			}

			const result = await response.json();
			this.logger.debug(`Transcription completed: "${result.text?.substring(0, 50)}..."`);

			return {
				text: result.text || '',
				language: result.language,
				model: result.model || model,
				duration: result.duration,
			};
		} catch (error) {
			this.logger.error('Transcription failed:', error);
			throw error;
		}
	}

	/**
	 * Get the appropriate endpoint for the model
	 */
	private getEndpoint(model: SttModel): string {
		switch (model) {
			case 'voxtral':
				return '/transcribe/voxtral';
			case 'auto':
				return '/transcribe/auto';
			case 'whisper':
			default:
				return '/transcribe';
		}
	}

	/**
	 * Check if STT service is healthy
	 */
	async isHealthy(): Promise<boolean> {
		try {
			const headers: Record<string, string> = {};
			if (this.apiKey) {
				headers['X-API-Key'] = this.apiKey;
			}
			const response = await fetch(`${this.sttUrl}/models`, { headers });
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Get available models
	 */
	async getModels(): Promise<string[]> {
		try {
			const headers: Record<string, string> = {};
			if (this.apiKey) {
				headers['X-API-Key'] = this.apiKey;
			}
			const response = await fetch(`${this.sttUrl}/models`, { headers });
			if (!response.ok) {
				return ['whisper', 'voxtral'];
			}
			const data = await response.json();
			return data.models || ['whisper', 'voxtral'];
		} catch {
			return ['whisper', 'voxtral'];
		}
	}
}
