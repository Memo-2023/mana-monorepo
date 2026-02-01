import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TranscriptionResult {
	text: string;
	language: string;
	duration?: number;
}

export interface VoicePreferences {
	voiceEnabled: boolean;
	voice: string;
	speed: number;
}

@Injectable()
export class VoiceService {
	private readonly logger = new Logger(VoiceService.name);
	private readonly sttUrl: string;
	private readonly voiceBotUrl: string;
	private readonly defaultVoice: string;
	private readonly defaultSpeed: number;

	// User preferences (in-memory for now)
	private userPreferences = new Map<string, VoicePreferences>();

	constructor(private configService: ConfigService) {
		this.sttUrl = this.configService.get('voice.sttUrl') || 'http://localhost:3020';
		this.voiceBotUrl = this.configService.get('voice.voiceBotUrl') || 'http://localhost:3050';
		this.defaultVoice = this.configService.get('voice.defaultVoice') || 'de-DE-ConradNeural';
		this.defaultSpeed = this.configService.get('voice.defaultSpeed') || 1.0;

		this.logger.log(`Voice Service initialized`);
		this.logger.log(`STT URL: ${this.sttUrl}`);
		this.logger.log(`Voice Bot URL: ${this.voiceBotUrl}`);
	}

	/**
	 * Transcribe audio to text using mana-stt (Whisper)
	 */
	async transcribe(audioBuffer: Buffer, language = 'de'): Promise<TranscriptionResult> {
		const startTime = Date.now();

		try {
			const formData = new FormData();
			// Convert Buffer to Uint8Array for Blob compatibility
			const uint8Array = new Uint8Array(audioBuffer);
			formData.append('file', new Blob([uint8Array]), 'audio.ogg');
			formData.append('language', language);

			const response = await fetch(`${this.sttUrl}/transcribe`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`STT error: ${response.status} - ${error}`);
			}

			const result = await response.json();
			const duration = Date.now() - startTime;

			this.logger.debug(`Transcribed in ${duration}ms: "${result.text?.substring(0, 50)}..."`);

			return {
				text: result.text || '',
				language: result.language || language,
				duration,
			};
		} catch (error) {
			this.logger.error(`Transcription failed: ${error}`);
			throw error;
		}
	}

	/**
	 * Synthesize speech from text using mana-voice-bot (Edge TTS)
	 */
	async synthesize(text: string, userId?: string): Promise<Buffer> {
		const prefs = this.getUserPreferences(userId);
		const startTime = Date.now();

		try {
			const formData = new FormData();
			formData.append('text', text);
			formData.append('voice', prefs.voice);

			const response = await fetch(`${this.voiceBotUrl}/tts`, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`TTS error: ${response.status} - ${error}`);
			}

			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const duration = Date.now() - startTime;

			this.logger.debug(`Synthesized ${buffer.length} bytes in ${duration}ms`);

			return buffer;
		} catch (error) {
			this.logger.error(`Synthesis failed: ${error}`);
			throw error;
		}
	}

	/**
	 * Get available TTS voices
	 */
	async getVoices(): Promise<Record<string, string>> {
		try {
			const response = await fetch(`${this.voiceBotUrl}/voices`);
			if (!response.ok) {
				throw new Error(`Failed to get voices: ${response.status}`);
			}
			const data = await response.json();
			return data.voices || {};
		} catch (error) {
			this.logger.error(`Failed to get voices: ${error}`);
			return {};
		}
	}

	/**
	 * Check if voice services are available
	 */
	async checkHealth(): Promise<{ stt: boolean; tts: boolean }> {
		const results = { stt: false, tts: false };

		try {
			const sttResponse = await fetch(`${this.sttUrl}/health`, {
				signal: AbortSignal.timeout(5000),
			});
			results.stt = sttResponse.ok;
		} catch {
			results.stt = false;
		}

		try {
			const ttsResponse = await fetch(`${this.voiceBotUrl}/health`, {
				signal: AbortSignal.timeout(5000),
			});
			results.tts = ttsResponse.ok;
		} catch {
			results.tts = false;
		}

		return results;
	}

	/**
	 * Get user voice preferences
	 */
	getUserPreferences(userId?: string): VoicePreferences {
		if (!userId) {
			return {
				voiceEnabled: true,
				voice: this.defaultVoice,
				speed: this.defaultSpeed,
			};
		}

		const prefs = this.userPreferences.get(userId);
		if (prefs) {
			return prefs;
		}

		// Default preferences
		return {
			voiceEnabled: true,
			voice: this.defaultVoice,
			speed: this.defaultSpeed,
		};
	}

	/**
	 * Update user voice preferences
	 */
	setUserPreferences(userId: string, prefs: Partial<VoicePreferences>): void {
		const current = this.getUserPreferences(userId);
		this.userPreferences.set(userId, { ...current, ...prefs });
	}

	/**
	 * Enable/disable voice responses for user
	 */
	setVoiceEnabled(userId: string, enabled: boolean): void {
		this.setUserPreferences(userId, { voiceEnabled: enabled });
	}

	/**
	 * Set user's preferred voice
	 */
	setVoice(userId: string, voice: string): void {
		this.setUserPreferences(userId, { voice });
	}

	/**
	 * Set user's preferred speed
	 */
	setSpeed(userId: string, speed: number): void {
		const clampedSpeed = Math.max(0.5, Math.min(2.0, speed));
		this.setUserPreferences(userId, { speed: clampedSpeed });
	}
}
