import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TranscriptionResult {
	text: string;
	language: string | null;
	model: string;
	latencyMs: number | null;
	durationSeconds: number | null;
}

@Injectable()
export class SttService {
	private readonly logger = new Logger(SttService.name);
	private readonly sttUrl: string;
	private readonly apiKey: string | undefined;

	constructor(private configService: ConfigService) {
		this.sttUrl = this.configService.get('MANA_STT_URL') || 'http://localhost:3020';
		this.apiKey = this.configService.get('MANA_STT_API_KEY');
	}

	/**
	 * Check if mana-stt service is available
	 */
	async isAvailable(): Promise<boolean> {
		try {
			const response = await fetch(`${this.sttUrl}/health`, {
				method: 'GET',
				signal: AbortSignal.timeout(5000),
			});
			return response.ok;
		} catch (error) {
			this.logger.warn(`STT service not available: ${error}`);
			return false;
		}
	}

	/**
	 * Transcribe audio buffer using Whisper via mana-stt
	 */
	async transcribe(
		audioBuffer: Buffer,
		filename: string,
		language?: string
	): Promise<TranscriptionResult> {
		this.logger.log(`Starting transcription for ${filename} (${audioBuffer.length} bytes)`);

		const formData = new FormData();
		// Convert Buffer to Uint8Array for Blob compatibility
		const uint8Array = new Uint8Array(audioBuffer);
		formData.append('file', new Blob([uint8Array]), filename);

		if (language) {
			formData.append('language', language);
		}

		const headers: Record<string, string> = {};
		if (this.apiKey) {
			headers['X-API-Key'] = this.apiKey;
		}

		const response = await fetch(`${this.sttUrl}/transcribe`, {
			method: 'POST',
			body: formData,
			headers,
			signal: AbortSignal.timeout(120000), // 2 minute timeout
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`STT transcription failed: ${response.status} - ${error}`);
		}

		const result = await response.json();

		this.logger.log(
			`Transcription complete: ${result.text?.length || 0} chars, language: ${result.language}, model: ${result.model}`
		);

		return {
			text: result.text,
			language: result.language || null,
			model: result.model,
			latencyMs: result.latency_ms || null,
			durationSeconds: result.duration_seconds || null,
		};
	}
}
