import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface VoicePreferences {
	voiceEnabled: boolean;
	voice: string;
	speed: number;
	autoVoiceReply: boolean; // Auto-enable voice replies when user sends voice
}

interface StoredPreferences {
	[userId: string]: VoicePreferences;
}

@Injectable()
export class VoicePreferencesStore implements OnModuleInit {
	private readonly logger = new Logger(VoicePreferencesStore.name);
	private readonly storagePath: string;
	private readonly defaultVoice: string;
	private readonly defaultSpeed: number;

	private preferences: StoredPreferences = {};
	private saveTimeout: NodeJS.Timeout | null = null;

	constructor(private configService: ConfigService) {
		this.storagePath =
			this.configService.get('voice.preferencesPath') || './data/voice-preferences.json';
		this.defaultVoice = this.configService.get('voice.defaultVoice') || 'de-DE-ConradNeural';
		this.defaultSpeed = this.configService.get('voice.defaultSpeed') || 1.0;
	}

	async onModuleInit() {
		await this.load();
	}

	/**
	 * Get preferences for a user
	 */
	get(userId: string): VoicePreferences {
		if (this.preferences[userId]) {
			return { ...this.preferences[userId] };
		}

		return this.getDefaults();
	}

	/**
	 * Get default preferences
	 */
	getDefaults(): VoicePreferences {
		return {
			voiceEnabled: true,
			voice: this.defaultVoice,
			speed: this.defaultSpeed,
			autoVoiceReply: true,
		};
	}

	/**
	 * Update preferences for a user
	 */
	set(userId: string, updates: Partial<VoicePreferences>): VoicePreferences {
		const current = this.get(userId);
		const updated = { ...current, ...updates };

		// Validate speed range
		if (updated.speed !== undefined) {
			updated.speed = Math.max(0.5, Math.min(2.0, updated.speed));
		}

		this.preferences[userId] = updated;
		this.scheduleSave();

		return updated;
	}

	/**
	 * Enable/disable voice responses
	 */
	setVoiceEnabled(userId: string, enabled: boolean): void {
		this.set(userId, { voiceEnabled: enabled });
	}

	/**
	 * Set preferred voice
	 */
	setVoice(userId: string, voice: string): void {
		this.set(userId, { voice });
	}

	/**
	 * Set speech speed
	 */
	setSpeed(userId: string, speed: number): void {
		this.set(userId, { speed });
	}

	/**
	 * Set auto voice reply
	 */
	setAutoVoiceReply(userId: string, enabled: boolean): void {
		this.set(userId, { autoVoiceReply: enabled });
	}

	/**
	 * Load preferences from disk
	 */
	private async load(): Promise<void> {
		try {
			// Ensure directory exists
			const dir = path.dirname(this.storagePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			if (fs.existsSync(this.storagePath)) {
				const data = fs.readFileSync(this.storagePath, 'utf-8');
				this.preferences = JSON.parse(data);
				this.logger.log(`Loaded voice preferences for ${Object.keys(this.preferences).length} users`);
			} else {
				this.preferences = {};
				this.logger.log('No voice preferences file found, starting fresh');
			}
		} catch (error) {
			this.logger.error(`Failed to load voice preferences: ${error}`);
			this.preferences = {};
		}
	}

	/**
	 * Save preferences to disk (debounced)
	 */
	private scheduleSave(): void {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}

		this.saveTimeout = setTimeout(() => {
			this.save();
		}, 1000);
	}

	/**
	 * Save preferences to disk immediately
	 */
	private save(): void {
		try {
			const dir = path.dirname(this.storagePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			fs.writeFileSync(this.storagePath, JSON.stringify(this.preferences, null, 2));
			this.logger.debug(`Saved voice preferences for ${Object.keys(this.preferences).length} users`);
		} catch (error) {
			this.logger.error(`Failed to save voice preferences: ${error}`);
		}
	}
}
