import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VoiceInfo {
	id: string;
	name: string;
	description: string;
	type: string;
}

export interface VoicesResponse {
	kokoro_voices: VoiceInfo[];
	custom_voices: VoiceInfo[];
}

@Injectable()
export class TtsService {
	private readonly logger = new Logger(TtsService.name);
	private readonly ttsUrl: string;
	private readonly apiKey: string;

	constructor(private configService: ConfigService) {
		this.ttsUrl = this.configService.get<string>('tts.url', 'http://localhost:3022');
		this.apiKey = this.configService.get<string>('tts.apiKey', '');
	}

	/**
	 * Synthesize text to speech using Kokoro model
	 */
	async synthesize(text: string, voice: string = 'af_heart', speed: number = 1.0): Promise<Buffer> {
		const url = `${this.ttsUrl}/synthesize/kokoro`;

		this.logger.debug(
			`Synthesizing: "${text.substring(0, 50)}..." with voice=${voice}, speed=${speed}`
		);

		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (this.apiKey) {
			headers['X-API-Key'] = this.apiKey;
		}

		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				text,
				voice,
				speed,
				output_format: 'wav',
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			this.logger.error(`TTS failed: ${response.status} - ${errorText}`);
			throw new Error(`TTS synthesis failed: ${response.status}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		this.logger.debug(`Received audio: ${arrayBuffer.byteLength} bytes`);

		return Buffer.from(arrayBuffer);
	}

	/**
	 * Get list of available voices
	 */
	async getVoices(): Promise<VoicesResponse> {
		const url = `${this.ttsUrl}/voices`;

		const headers: Record<string, string> = {};
		if (this.apiKey) {
			headers['X-API-Key'] = this.apiKey;
		}

		const response = await fetch(url, { headers });

		if (!response.ok) {
			throw new Error(`Failed to get voices: ${response.status}`);
		}

		return response.json();
	}

	/**
	 * Check if TTS service is healthy
	 */
	async isHealthy(): Promise<boolean> {
		try {
			const response = await fetch(`${this.ttsUrl}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Check if a voice exists
	 */
	async voiceExists(voiceId: string): Promise<boolean> {
		try {
			const voices = await this.getVoices();
			const allVoices = [...voices.kokoro_voices, ...voices.custom_voices];
			return allVoices.some((v) => v.id === voiceId);
		} catch {
			return false;
		}
	}
}
