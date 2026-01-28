import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SttResponse {
	text: string;
	language?: string;
	model?: string;
}

@Injectable()
export class TranscriptionService {
	private readonly logger = new Logger(TranscriptionService.name);
	private readonly sttUrl: string;

	constructor(private configService: ConfigService) {
		this.sttUrl = this.configService.get<string>('stt.url') || 'http://localhost:3020';
		this.logger.log(`STT Service URL: ${this.sttUrl}`);
	}

	async transcribe(audioBuffer: Buffer, language: string = 'de'): Promise<string> {
		const formData = new FormData();
		const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
		formData.append('file', blob, 'audio.ogg');
		formData.append('language', language);

		try {
			const response = await fetch(`${this.sttUrl}/transcribe`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`STT service error: ${response.status} - ${errorText}`);
			}

			const result: SttResponse = await response.json();
			this.logger.log(`Transcription completed: ${result.text.substring(0, 50)}...`);
			return result.text;
		} catch (error) {
			this.logger.error('Transcription failed:', error);
			throw error;
		}
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.sttUrl}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}
}
