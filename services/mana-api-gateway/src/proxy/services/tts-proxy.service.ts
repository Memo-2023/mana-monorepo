import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SynthesizeRequestDto {
	text: string;
	voice?: string;
	language?: string;
	speed?: number;
	format?: 'mp3' | 'wav' | 'ogg';
}

@Injectable()
export class TtsProxyService {
	private readonly ttsUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.ttsUrl = this.configService.get('services.tts') || 'http://localhost:3022';
	}

	async synthesize(body: SynthesizeRequestDto): Promise<Buffer> {
		const response = await fetch(`${this.ttsUrl}/api/v1/synthesize`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new HttpException(
				`TTS service error: ${error}`,
				response.status || HttpStatus.BAD_GATEWAY
			);
		}

		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}

	async getVoices(): Promise<any> {
		const response = await fetch(`${this.ttsUrl}/api/v1/voices`);

		if (!response.ok) {
			throw new HttpException('Failed to get TTS voices', HttpStatus.BAD_GATEWAY);
		}

		return response.json();
	}

	async getLanguages(): Promise<any> {
		const response = await fetch(`${this.ttsUrl}/api/v1/languages`);

		if (!response.ok) {
			throw new HttpException('Failed to get TTS languages', HttpStatus.BAD_GATEWAY);
		}

		return response.json();
	}
}
