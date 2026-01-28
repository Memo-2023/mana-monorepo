import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranscriptionService {
	private readonly logger = new Logger(TranscriptionService.name);
	private readonly sttUrl: string;

	constructor(private configService: ConfigService) {
		this.sttUrl = this.configService.get<string>('stt.url') || 'http://localhost:3020';
	}

	async transcribe(audioBuffer: Buffer, language: string = 'de'): Promise<string> {
		try {
			const formData = new FormData();
			const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
			formData.append('file', blob, 'audio.ogg');
			formData.append('language', language);

			const response = await fetch(`${this.sttUrl}/transcribe`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`STT service error: ${response.status}`);
			}

			const result = (await response.json()) as { text: string };
			this.logger.log(`Transcription result: ${result.text}`);
			return result.text;
		} catch (error) {
			this.logger.error('Transcription failed:', error);
			throw error;
		}
	}
}
