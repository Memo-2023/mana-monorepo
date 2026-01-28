import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Readable } from 'stream';

@Injectable()
export class TranscriptionService {
	private readonly logger = new Logger(TranscriptionService.name);
	private readonly openai: OpenAI;
	private readonly model: string;

	constructor(private configService: ConfigService) {
		const apiKey = this.configService.get<string>('openai.apiKey');

		if (!apiKey) {
			this.logger.warn('OPENAI_API_KEY not configured - transcription disabled');
		}

		this.openai = new OpenAI({ apiKey });
		this.model = this.configService.get<string>('openai.whisperModel') || 'whisper-1';
	}

	async transcribe(audioBuffer: Buffer): Promise<string> {
		const apiKey = this.configService.get<string>('openai.apiKey');
		if (!apiKey) {
			throw new Error('OpenAI API key not configured');
		}

		// Create a File-like object for the API
		const file = new File([new Uint8Array(audioBuffer)], 'audio.ogg', { type: 'audio/ogg' });

		const response = await this.openai.audio.transcriptions.create({
			file,
			model: this.model,
			language: 'de',
		});

		return response.text;
	}
}
