import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface LocalSTTResponse {
	text: string;
	language?: string;
	model: string;
}

@Injectable()
export class TranscriptionService {
	private readonly logger = new Logger(TranscriptionService.name);
	private readonly openai: OpenAI | null;
	private readonly provider: 'local' | 'openai';
	private readonly localUrl: string;
	private readonly sttModel: string;

	constructor(private configService: ConfigService) {
		this.provider = this.configService.get<string>('stt.provider', 'local') as 'local' | 'openai';
		this.localUrl = this.configService.get<string>('stt.localUrl', 'http://localhost:3020');
		this.sttModel = this.configService.get<string>('stt.model', 'whisper');

		const apiKey = this.configService.get<string>('openai.apiKey');

		if (apiKey) {
			this.openai = new OpenAI({ apiKey });
			this.logger.log('OpenAI Whisper available as fallback');
		} else {
			this.openai = null;
		}

		this.logger.log(
			`STT Provider: ${this.provider}, URL: ${this.localUrl}, Model: ${this.sttModel}`
		);
	}

	async transcribe(audioBuffer: Buffer, filename = 'audio.ogg'): Promise<string> {
		// Try local STT first if configured
		if (this.provider === 'local') {
			try {
				return await this.transcribeLocal(audioBuffer, filename);
			} catch (error) {
				this.logger.warn(`Local STT failed, trying OpenAI fallback: ${error}`);
				if (this.openai) {
					return await this.transcribeOpenAI(audioBuffer, filename);
				}
				throw error;
			}
		}

		// Use OpenAI
		if (this.openai) {
			return await this.transcribeOpenAI(audioBuffer, filename);
		}

		throw new Error('No STT provider available');
	}

	private async transcribeLocal(audioBuffer: Buffer, filename: string): Promise<string> {
		const endpoint = this.sttModel === 'voxtral' ? '/transcribe/voxtral' : '/transcribe';
		const url = `${this.localUrl}${endpoint}`;

		this.logger.debug(`Calling local STT: ${url}`);

		const formData = new FormData();
		const uint8Array = new Uint8Array(audioBuffer);
		const blob = new Blob([uint8Array], { type: 'audio/ogg' });
		formData.append('file', blob, filename);
		formData.append('language', 'de');

		const response = await fetch(url, {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Local STT error: ${response.status} - ${error}`);
		}

		const result: LocalSTTResponse = await response.json();
		this.logger.debug(`Local STT result: ${result.text.length} chars, model: ${result.model}`);

		return result.text;
	}

	private async transcribeOpenAI(audioBuffer: Buffer, filename: string): Promise<string> {
		if (!this.openai) {
			throw new Error('OpenAI not configured');
		}

		try {
			const uint8Array = new Uint8Array(audioBuffer);
			const file = new File([uint8Array], filename, { type: 'audio/ogg' });

			const response = await this.openai.audio.transcriptions.create({
				file,
				model: 'whisper-1',
				language: 'de',
			});

			this.logger.debug(
				`OpenAI transcribed ${audioBuffer.length} bytes -> ${response.text.length} chars`
			);
			return response.text;
		} catch (error) {
			this.logger.error('OpenAI transcription failed:', error);
			throw new Error('Transkription fehlgeschlagen');
		}
	}

	isAvailable(): boolean {
		return this.provider === 'local' || this.openai !== null;
	}
}
