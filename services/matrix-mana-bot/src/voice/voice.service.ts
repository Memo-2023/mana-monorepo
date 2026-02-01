import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VoicePreferencesStore, VoicePreferences } from './voice-preferences.store';

export interface TranscriptionResult {
	text: string;
	language: string;
	duration?: number;
}

export class VoiceServiceError extends Error {
	constructor(
		message: string,
		public readonly code: 'STT_UNAVAILABLE' | 'TTS_UNAVAILABLE' | 'TIMEOUT' | 'INVALID_AUDIO' | 'UNKNOWN'
	) {
		super(message);
		this.name = 'VoiceServiceError';
	}
}

// Re-export for convenience
export { VoicePreferences };

// Simple LRU cache for TTS responses
interface CacheEntry {
	buffer: Buffer;
	timestamp: number;
}

@Injectable()
export class VoiceService {
	private readonly logger = new Logger(VoiceService.name);
	private readonly sttUrl: string;
	private readonly voiceBotUrl: string;

	// Timeouts in milliseconds
	private readonly STT_TIMEOUT = 60000; // 60s for transcription (can be slow)
	private readonly TTS_TIMEOUT = 30000; // 30s for synthesis
	private readonly HEALTH_TIMEOUT = 5000; // 5s for health checks

	// Audio size limits
	private readonly MIN_AUDIO_SIZE = 1000; // 1KB minimum
	private readonly MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB maximum

	// TTS cache for common short responses
	private readonly ttsCache = new Map<string, CacheEntry>();
	private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
	private readonly MAX_CACHE_SIZE = 50;

	constructor(
		private configService: ConfigService,
		private preferencesStore: VoicePreferencesStore
	) {
		this.sttUrl = this.configService.get('voice.sttUrl') || 'http://localhost:3020';
		this.voiceBotUrl = this.configService.get('voice.voiceBotUrl') || 'http://localhost:3050';

		this.logger.log(`Voice Service initialized`);
		this.logger.log(`STT URL: ${this.sttUrl}`);
		this.logger.log(`Voice Bot URL: ${this.voiceBotUrl}`);
	}

	/**
	 * Transcribe audio to text using mana-stt (Whisper)
	 */
	async transcribe(audioBuffer: Buffer, language = 'de'): Promise<TranscriptionResult> {
		const startTime = Date.now();

		// Validate audio size
		if (audioBuffer.length < this.MIN_AUDIO_SIZE) {
			throw new VoiceServiceError(
				'Audio zu kurz - bitte länger sprechen.',
				'INVALID_AUDIO'
			);
		}

		if (audioBuffer.length > this.MAX_AUDIO_SIZE) {
			throw new VoiceServiceError(
				'Audio zu groß (max 25MB). Bitte kürzere Nachricht senden.',
				'INVALID_AUDIO'
			);
		}

		try {
			const formData = new FormData();
			// Convert Buffer to Uint8Array for Blob compatibility
			const uint8Array = new Uint8Array(audioBuffer);
			formData.append('file', new Blob([uint8Array]), 'audio.ogg');
			formData.append('language', language);

			const response = await fetch(`${this.sttUrl}/transcribe`, {
				method: 'POST',
				body: formData,
				signal: AbortSignal.timeout(this.STT_TIMEOUT),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new VoiceServiceError(
					`Spracherkennung fehlgeschlagen: ${response.status}`,
					'STT_UNAVAILABLE'
				);
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
			if (error instanceof VoiceServiceError) {
				throw error;
			}

			if (error.name === 'TimeoutError' || error.name === 'AbortError') {
				this.logger.error(`STT timeout after ${this.STT_TIMEOUT}ms`);
				throw new VoiceServiceError(
					'Spracherkennung dauert zu lange. Bitte versuche es erneut.',
					'TIMEOUT'
				);
			}

			this.logger.error(`Transcription failed: ${error}`);
			throw new VoiceServiceError(
				'Spracherkennung nicht erreichbar.',
				'STT_UNAVAILABLE'
			);
		}
	}

	/**
	 * Synthesize speech from text using mana-voice-bot (Edge TTS)
	 * Includes caching for common short responses
	 */
	async synthesize(text: string, userId?: string): Promise<Buffer> {
		const prefs = this.getUserPreferences(userId);
		const startTime = Date.now();

		// Check cache for short texts (< 100 chars)
		if (text.length < 100) {
			const cacheKey = `${prefs.voice}:${text}`;
			const cached = this.getCached(cacheKey);
			if (cached) {
				this.logger.debug(`TTS cache hit for "${text.substring(0, 30)}..."`);
				return cached;
			}
		}

		try {
			const formData = new FormData();
			formData.append('text', text);
			formData.append('voice', prefs.voice);

			const response = await fetch(`${this.voiceBotUrl}/tts`, {
				method: 'POST',
				body: formData,
				signal: AbortSignal.timeout(this.TTS_TIMEOUT),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new VoiceServiceError(
					`Sprachsynthese fehlgeschlagen: ${response.status}`,
					'TTS_UNAVAILABLE'
				);
			}

			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const duration = Date.now() - startTime;

			this.logger.debug(`Synthesized ${buffer.length} bytes in ${duration}ms`);

			// Cache short responses
			if (text.length < 100) {
				const cacheKey = `${prefs.voice}:${text}`;
				this.setCache(cacheKey, buffer);
			}

			return buffer;
		} catch (error) {
			if (error instanceof VoiceServiceError) {
				throw error;
			}

			if (error.name === 'TimeoutError' || error.name === 'AbortError') {
				this.logger.error(`TTS timeout after ${this.TTS_TIMEOUT}ms`);
				throw new VoiceServiceError(
					'Sprachsynthese dauert zu lange.',
					'TIMEOUT'
				);
			}

			this.logger.error(`Synthesis failed: ${error}`);
			throw new VoiceServiceError(
				'Sprachsynthese nicht erreichbar.',
				'TTS_UNAVAILABLE'
			);
		}
	}

	/**
	 * Get cached TTS response
	 */
	private getCached(key: string): Buffer | null {
		const entry = this.ttsCache.get(key);
		if (!entry) return null;

		// Check if expired
		if (Date.now() - entry.timestamp > this.CACHE_TTL) {
			this.ttsCache.delete(key);
			return null;
		}

		return entry.buffer;
	}

	/**
	 * Cache TTS response
	 */
	private setCache(key: string, buffer: Buffer): void {
		// Enforce max cache size
		if (this.ttsCache.size >= this.MAX_CACHE_SIZE) {
			// Remove oldest entry
			const oldestKey = this.ttsCache.keys().next().value;
			if (oldestKey) {
				this.ttsCache.delete(oldestKey);
			}
		}

		this.ttsCache.set(key, {
			buffer,
			timestamp: Date.now(),
		});
	}

	/**
	 * Get available TTS voices
	 */
	async getVoices(): Promise<Record<string, string>> {
		try {
			const response = await fetch(`${this.voiceBotUrl}/voices`, {
				signal: AbortSignal.timeout(this.HEALTH_TIMEOUT),
			});
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
	 * Clear the TTS cache
	 */
	clearCache(): void {
		this.ttsCache.clear();
		this.logger.debug('TTS cache cleared');
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; maxSize: number } {
		return {
			size: this.ttsCache.size,
			maxSize: this.MAX_CACHE_SIZE,
		};
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
	 * Get user voice preferences (persistent)
	 */
	getUserPreferences(userId?: string): VoicePreferences {
		if (!userId) {
			return this.preferencesStore.getDefaults();
		}
		return this.preferencesStore.get(userId);
	}

	/**
	 * Update user voice preferences (persistent)
	 */
	setUserPreferences(userId: string, prefs: Partial<VoicePreferences>): VoicePreferences {
		return this.preferencesStore.set(userId, prefs);
	}

	/**
	 * Enable/disable voice responses for user
	 */
	setVoiceEnabled(userId: string, enabled: boolean): void {
		this.preferencesStore.setVoiceEnabled(userId, enabled);
	}

	/**
	 * Set user's preferred voice
	 */
	setVoice(userId: string, voice: string): void {
		this.preferencesStore.setVoice(userId, voice);
	}

	/**
	 * Set user's preferred speed
	 */
	setSpeed(userId: string, speed: number): void {
		this.preferencesStore.setSpeed(userId, speed);
	}

	/**
	 * Set auto voice reply setting
	 */
	setAutoVoiceReply(userId: string, enabled: boolean): void {
		this.preferencesStore.setAutoVoiceReply(userId, enabled);
	}
}
