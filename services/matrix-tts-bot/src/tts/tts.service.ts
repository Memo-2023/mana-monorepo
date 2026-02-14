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

// German voice mapping
const GERMAN_VOICES: Record<string, string> = {
	de_thorsten: 'de_thorsten', // Local Piper
	de_katja: 'de_katja', // Edge TTS female
	de_conrad: 'de_conrad', // Edge TTS male
	de_amala: 'de_amala', // Edge TTS female young
	de_florian: 'de_florian', // Edge TTS male young
};

const DEFAULT_GERMAN_VOICE = 'de_thorsten';

// Common German words for language detection
const GERMAN_INDICATORS = [
	'ich',
	'du',
	'er',
	'sie',
	'wir',
	'ihr',
	'und',
	'oder',
	'aber',
	'wenn',
	'dass',
	'ist',
	'sind',
	'war',
	'haben',
	'werden',
	'kann',
	'muss',
	'soll',
	'will',
	'nicht',
	'auch',
	'noch',
	'schon',
	'sehr',
	'nur',
	'mehr',
	'hier',
	'jetzt',
	'heute',
	'morgen',
	'gestern',
	'bitte',
	'danke',
	'hallo',
	'guten',
	'tag',
	'abend',
	'nacht',
	'wie',
	'was',
	'wer',
	'wo',
	'wann',
	'warum',
	'welche',
	'diese',
	'keine',
	'eine',
	'einen',
	'einem',
	'einer',
];

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
	 * Detect if text is likely German
	 */
	private isGerman(text: string): boolean {
		const lowerText = text.toLowerCase();

		// Check for German-specific characters
		if (/[äöüß]/.test(lowerText)) {
			return true;
		}

		// Check for common German words
		const words = lowerText.split(/\s+/);
		const germanWordCount = words.filter((word) =>
			GERMAN_INDICATORS.includes(word.replace(/[.,!?;:'"]/g, ''))
		).length;

		// If more than 20% of words are German indicators, consider it German
		return germanWordCount / words.length > 0.2;
	}

	/**
	 * Check if voice is a German voice
	 */
	private isGermanVoice(voice: string): boolean {
		return voice.startsWith('de_');
	}

	/**
	 * Synthesize text to speech - auto-detects language
	 */
	async synthesize(text: string, voice: string = 'af_heart', speed: number = 1.0): Promise<Buffer> {
		// Auto-detect language if using English voice but text is German
		const textIsGerman = this.isGerman(text);
		const voiceIsGerman = this.isGermanVoice(voice);

		if (textIsGerman && !voiceIsGerman) {
			this.logger.debug(`German text detected, switching to German voice`);
			return this.synthesizeGerman(text, DEFAULT_GERMAN_VOICE, speed);
		}

		if (voiceIsGerman) {
			return this.synthesizeGerman(text, voice, speed);
		}

		return this.synthesizeKokoro(text, voice, speed);
	}

	/**
	 * Synthesize using Kokoro (English voices)
	 */
	private async synthesizeKokoro(
		text: string,
		voice: string = 'af_heart',
		speed: number = 1.0
	): Promise<Buffer> {
		const url = `${this.ttsUrl}/synthesize/kokoro`;

		this.logger.debug(
			`Kokoro synthesizing: "${text.substring(0, 50)}..." with voice=${voice}, speed=${speed}`
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
			this.logger.error(`Kokoro TTS failed: ${response.status} - ${errorText}`);
			throw new Error(`TTS synthesis failed: ${response.status}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		this.logger.debug(`Received audio: ${arrayBuffer.byteLength} bytes`);

		return Buffer.from(arrayBuffer);
	}

	/**
	 * Synthesize using auto endpoint (German voices via Piper/Edge)
	 */
	private async synthesizeGerman(
		text: string,
		voice: string = DEFAULT_GERMAN_VOICE,
		speed: number = 1.0
	): Promise<Buffer> {
		const url = `${this.ttsUrl}/synthesize/auto`;

		// Map voice to valid German voice
		const germanVoice = GERMAN_VOICES[voice] || DEFAULT_GERMAN_VOICE;

		this.logger.debug(
			`German synthesizing: "${text.substring(0, 50)}..." with voice=${germanVoice}, speed=${speed}`
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
				voice: germanVoice,
				speed,
				output_format: 'wav',
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			this.logger.error(`German TTS failed: ${response.status} - ${errorText}`);
			throw new Error(`TTS synthesis failed: ${response.status}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		this.logger.debug(`Received German audio: ${arrayBuffer.byteLength} bytes`);

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
