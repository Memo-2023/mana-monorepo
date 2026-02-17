import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from '../session/session.service.js';
import { MorningPreferences, DEFAULT_MORNING_PREFERENCES } from './types.js';

/**
 * Morning Preferences Service
 *
 * Manages user preferences for morning summaries.
 * Stores preferences in Redis via SessionService for cross-bot persistence.
 *
 * @example
 * ```typescript
 * // Get preferences
 * const prefs = await preferencesService.getPreferences(matrixUserId);
 *
 * // Enable morning summary
 * await preferencesService.setEnabled(matrixUserId, true);
 *
 * // Set delivery time
 * await preferencesService.setDeliveryTime(matrixUserId, '07:30');
 *
 * // Set weather location
 * await preferencesService.setLocation(matrixUserId, 'Berlin');
 * ```
 */
@Injectable()
export class MorningPreferencesService {
	private readonly logger = new Logger(MorningPreferencesService.name);

	constructor(private sessionService: SessionService) {}

	/**
	 * Get user's morning preferences
	 */
	async getPreferences(matrixUserId: string): Promise<MorningPreferences> {
		try {
			const stored = await this.sessionService.getSessionData<MorningPreferences>(
				matrixUserId,
				'morningPrefs'
			);

			if (stored) {
				// Merge with defaults to ensure all fields exist
				return { ...DEFAULT_MORNING_PREFERENCES, ...stored };
			}

			return { ...DEFAULT_MORNING_PREFERENCES };
		} catch (error) {
			this.logger.error(`Failed to get preferences for ${matrixUserId}:`, error);
			return { ...DEFAULT_MORNING_PREFERENCES };
		}
	}

	/**
	 * Save user's morning preferences
	 */
	async savePreferences(
		matrixUserId: string,
		prefs: Partial<MorningPreferences>
	): Promise<MorningPreferences> {
		try {
			const current = await this.getPreferences(matrixUserId);
			const updated = { ...current, ...prefs };

			await this.sessionService.setSessionData(matrixUserId, 'morningPrefs', updated);

			this.logger.debug(`Saved preferences for ${matrixUserId}`);
			return updated;
		} catch (error) {
			this.logger.error(`Failed to save preferences for ${matrixUserId}:`, error);
			throw error;
		}
	}

	/**
	 * Enable/disable morning summary
	 */
	async setEnabled(matrixUserId: string, enabled: boolean): Promise<MorningPreferences> {
		return this.savePreferences(matrixUserId, { enabled });
	}

	/**
	 * Set delivery time (HH:MM format)
	 */
	async setDeliveryTime(matrixUserId: string, time: string): Promise<MorningPreferences> {
		// Validate time format
		const match = time.match(/^(\d{1,2}):(\d{2})$/);
		if (!match) {
			throw new Error('Invalid time format. Use HH:MM (e.g., 07:00)');
		}

		const hours = parseInt(match[1]);
		const minutes = parseInt(match[2]);

		if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			throw new Error('Invalid time. Hours must be 0-23, minutes 0-59');
		}

		const deliveryTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		return this.savePreferences(matrixUserId, { deliveryTime });
	}

	/**
	 * Set timezone
	 */
	async setTimezone(matrixUserId: string, timezone: string): Promise<MorningPreferences> {
		// Basic validation - check if it's a valid IANA timezone
		try {
			Intl.DateTimeFormat('en', { timeZone: timezone });
		} catch {
			throw new Error(`Invalid timezone: ${timezone}`);
		}

		return this.savePreferences(matrixUserId, { timezone });
	}

	/**
	 * Set weather location
	 */
	async setLocation(matrixUserId: string, location: string | null): Promise<MorningPreferences> {
		return this.savePreferences(matrixUserId, { location });
	}

	/**
	 * Set summary format
	 */
	async setFormat(
		matrixUserId: string,
		format: 'compact' | 'detailed'
	): Promise<MorningPreferences> {
		return this.savePreferences(matrixUserId, { format });
	}

	/**
	 * Get all users with enabled morning summaries
	 * Note: This requires iterating over all sessions, which is only efficient with Redis
	 */
	async getEnabledUsers(): Promise<string[]> {
		// This will be implemented via Redis scan in the scheduler
		// For now, return from in-memory tracking
		const activeUsers = this.sessionService.getActiveUserIds();
		const enabledUsers: string[] = [];

		for (const userId of activeUsers) {
			const prefs = await this.getPreferences(userId);
			if (prefs.enabled) {
				enabledUsers.push(userId);
			}
		}

		return enabledUsers;
	}

	/**
	 * Check if current time matches a user's delivery time
	 */
	shouldDeliverNow(prefs: MorningPreferences, currentTime: Date = new Date()): boolean {
		if (!prefs.enabled) return false;

		try {
			// Get current time in user's timezone
			const userTime = currentTime.toLocaleTimeString('en-US', {
				timeZone: prefs.timezone,
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			});

			// Compare with delivery time (allow 1-minute window)
			const [currentHour, currentMinute] = userTime.split(':').map(Number);
			const [targetHour, targetMinute] = prefs.deliveryTime.split(':').map(Number);

			return currentHour === targetHour && currentMinute === targetMinute;
		} catch (error) {
			this.logger.error(`Error checking delivery time:`, error);
			return false;
		}
	}

	/**
	 * Format preferences for display
	 */
	formatPreferences(prefs: MorningPreferences): string {
		const status = prefs.enabled ? '✅ Aktiviert' : '❌ Deaktiviert';
		const lines = [
			'**Morgenzusammenfassung Einstellungen**',
			'',
			`Status: ${status}`,
			`Uhrzeit: ${prefs.deliveryTime}`,
			`Zeitzone: ${prefs.timezone}`,
			`Format: ${prefs.format === 'compact' ? 'Kompakt' : 'Ausfuehrlich'}`,
		];

		if (prefs.location) {
			lines.push(`Wetter-Ort: ${prefs.location}`);
		} else {
			lines.push(`Wetter-Ort: Nicht gesetzt`);
		}

		lines.push('');
		lines.push('**Optionen:**');
		lines.push(`Wetter: ${prefs.includeWeather ? '✅' : '❌'}`);
		lines.push(`Geburtstage: ${prefs.includeBirthdays ? '✅' : '❌'}`);
		lines.push(`Pflanzen: ${prefs.includePlants ? '✅' : '❌'}`);

		return lines.join('\n');
	}
}
