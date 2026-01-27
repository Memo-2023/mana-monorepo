import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class TranscriptionService {
	private readonly logger = new Logger(TranscriptionService.name);
	private readonly openai: OpenAI | null;

	constructor(private configService: ConfigService) {
		const apiKey = this.configService.get<string>('openai.apiKey');

		if (apiKey) {
			this.openai = new OpenAI({ apiKey });
			this.logger.log('OpenAI Whisper initialized');
		} else {
			this.openai = null;
			this.logger.warn('OpenAI API key not configured - transcription disabled');
		}
	}

	async transcribe(audioBuffer: Buffer, filename = 'audio.ogg'): Promise<string> {
		if (!this.openai) {
			throw new Error('Transcription not available - OpenAI API key not configured');
		}

		try {
			// Create a File object from the buffer using Uint8Array
			const uint8Array = new Uint8Array(audioBuffer);
			const file = new File([uint8Array], filename, { type: 'audio/ogg' });

			const response = await this.openai.audio.transcriptions.create({
				file,
				model: 'whisper-1',
				language: 'de', // Default to German, could be made configurable
			});

			this.logger.debug(`Transcribed ${audioBuffer.length} bytes -> ${response.text.length} chars`);
			return response.text;
		} catch (error) {
			this.logger.error('Transcription failed:', error);
			throw new Error('Transkription fehlgeschlagen');
		}
	}

	isAvailable(): boolean {
		return this.openai !== null;
	}
}
