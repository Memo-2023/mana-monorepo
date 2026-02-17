import { Injectable, Logger } from '@nestjs/common';
import {
	SessionService,
	MorningSummaryService,
	MorningPreferencesService,
} from '@manacore/bot-services';
import { CommandContext } from '../bot/command-router.service';

/**
 * Morning Handler
 *
 * Handles morning summary commands including configuration and instant summaries.
 *
 * Commands:
 * - !morning / !morgen - Get summary now
 * - !morning-on - Enable automatic summary
 * - !morning-off - Disable automatic summary
 * - !morning-time HH:MM - Set delivery time
 * - !morning-location [City] - Set weather location
 * - !morning-settings - Show current settings
 */
@Injectable()
export class MorningHandler {
	private readonly logger = new Logger(MorningHandler.name);

	constructor(
		private sessionService: SessionService,
		private morningSummaryService: MorningSummaryService,
		private preferencesService: MorningPreferencesService
	) {}

	/**
	 * Get morning summary now
	 */
	async getSummary(ctx: CommandContext): Promise<string> {
		const token = await this.sessionService.getToken(ctx.userId);
		if (!token) {
			return this.requireLogin();
		}

		try {
			const prefs = await this.preferencesService.getPreferences(ctx.userId);
			const summary = await this.morningSummaryService.generateSummary(ctx.userId, token);
			return this.morningSummaryService.formatSummary(summary, prefs.format);
		} catch (error) {
			this.logger.error(`Failed to generate summary for ${ctx.userId}:`, error);
			return '❌ Fehler beim Erstellen der Zusammenfassung.';
		}
	}

	/**
	 * Enable automatic morning summary
	 */
	async enable(ctx: CommandContext): Promise<string> {
		const token = await this.sessionService.getToken(ctx.userId);
		if (!token) {
			return this.requireLogin();
		}

		try {
			const prefs = await this.preferencesService.setEnabled(ctx.userId, true);
			this.logger.log(`Morning summary enabled for ${ctx.userId}`);

			let response = `✅ Morgenzusammenfassung aktiviert!\n\n`;
			response += `Du erhaeltst taeglich um **${prefs.deliveryTime}** (${prefs.timezone}) deine Zusammenfassung.`;

			if (!prefs.location) {
				response += `\n\n💡 Tipp: Setze deinen Wetter-Ort mit \`!morning-location Berlin\``;
			}

			return response;
		} catch (error) {
			this.logger.error(`Failed to enable morning summary for ${ctx.userId}:`, error);
			return '❌ Fehler beim Aktivieren der Morgenzusammenfassung.';
		}
	}

	/**
	 * Disable automatic morning summary
	 */
	async disable(ctx: CommandContext): Promise<string> {
		// Require login for persistent storage
		const token = await this.sessionService.getToken(ctx.userId);
		if (!token) {
			return this.requireLogin();
		}

		try {
			await this.preferencesService.setEnabled(ctx.userId, false);
			this.logger.log(`Morning summary disabled for ${ctx.userId}`);
			return '✅ Morgenzusammenfassung deaktiviert.';
		} catch (error) {
			this.logger.error(`Failed to disable morning summary for ${ctx.userId}:`, error);
			return '❌ Fehler beim Deaktivieren der Morgenzusammenfassung.';
		}
	}

	/**
	 * Set delivery time
	 */
	async setTime(ctx: CommandContext, args: string): Promise<string> {
		// Require login for persistent storage
		const token = await this.sessionService.getToken(ctx.userId);
		if (!token) {
			return this.requireLogin();
		}

		const time = args.trim();

		if (!time) {
			return '❌ Bitte gib eine Uhrzeit an.\n\nBeispiel: `!morning-time 07:30`';
		}

		try {
			const prefs = await this.preferencesService.setDeliveryTime(ctx.userId, time);
			this.logger.log(`Morning delivery time set to ${prefs.deliveryTime} for ${ctx.userId}`);
			return `✅ Uhrzeit auf **${prefs.deliveryTime}** gesetzt (${prefs.timezone}).`;
		} catch (error) {
			if (error instanceof Error) {
				return `❌ ${error.message}`;
			}
			return '❌ Fehler beim Setzen der Uhrzeit. Verwende das Format HH:MM (z.B. 07:00).';
		}
	}

	/**
	 * Set weather location
	 */
	async setLocation(ctx: CommandContext, args: string): Promise<string> {
		// Require login for persistent storage
		const token = await this.sessionService.getToken(ctx.userId);
		if (!token) {
			return this.requireLogin();
		}

		const location = args.trim();

		if (!location) {
			// Show current location
			const prefs = await this.preferencesService.getPreferences(ctx.userId);
			if (prefs.location) {
				return `🌍 Aktueller Wetter-Ort: **${prefs.location}**\n\nAendern mit: \`!morning-location [Stadt]\``;
			}
			return '🌍 Kein Wetter-Ort gesetzt.\n\nSetze mit: `!morning-location Berlin`';
		}

		try {
			const prefs = await this.preferencesService.setLocation(ctx.userId, location);
			this.logger.log(`Morning location set to ${location} for ${ctx.userId}`);
			return `✅ Wetter-Ort auf **${prefs.location}** gesetzt.`;
		} catch (error) {
			this.logger.error(`Failed to set location for ${ctx.userId}:`, error);
			return '❌ Fehler beim Setzen des Wetter-Orts.';
		}
	}

	/**
	 * Set timezone
	 */
	async setTimezone(ctx: CommandContext, args: string): Promise<string> {
		// Require login for persistent storage
		const token = await this.sessionService.getToken(ctx.userId);
		if (!token) {
			return this.requireLogin();
		}

		const timezone = args.trim();

		if (!timezone) {
			const prefs = await this.preferencesService.getPreferences(ctx.userId);
			return `🕐 Aktuelle Zeitzone: **${prefs.timezone}**\n\nAendern mit: \`!morning-timezone Europe/Berlin\``;
		}

		try {
			const prefs = await this.preferencesService.setTimezone(ctx.userId, timezone);
			this.logger.log(`Morning timezone set to ${timezone} for ${ctx.userId}`);
			return `✅ Zeitzone auf **${prefs.timezone}** gesetzt.`;
		} catch (error) {
			if (error instanceof Error) {
				return `❌ ${error.message}`;
			}
			return '❌ Ungueltige Zeitzone. Verwende IANA Format (z.B. Europe/Berlin).';
		}
	}

	/**
	 * Set summary format
	 */
	async setFormat(ctx: CommandContext, args: string): Promise<string> {
		// Require login for persistent storage
		const token = await this.sessionService.getToken(ctx.userId);
		if (!token) {
			return this.requireLogin();
		}

		const format = args.trim().toLowerCase();

		if (
			format !== 'compact' &&
			format !== 'detailed' &&
			format !== 'kompakt' &&
			format !== 'ausfuehrlich'
		) {
			const prefs = await this.preferencesService.getPreferences(ctx.userId);
			const currentFormat = prefs.format === 'compact' ? 'Kompakt' : 'Ausfuehrlich';
			return `📋 Aktuelles Format: **${currentFormat}**\n\nAendern mit: \`!morning-format kompakt\` oder \`!morning-format ausfuehrlich\``;
		}

		try {
			const newFormat = format === 'compact' || format === 'kompakt' ? 'compact' : 'detailed';
			const prefs = await this.preferencesService.setFormat(ctx.userId, newFormat);
			const formatName = prefs.format === 'compact' ? 'Kompakt' : 'Ausfuehrlich';
			this.logger.log(`Morning format set to ${prefs.format} for ${ctx.userId}`);
			return `✅ Format auf **${formatName}** gesetzt.`;
		} catch (error) {
			this.logger.error(`Failed to set format for ${ctx.userId}:`, error);
			return '❌ Fehler beim Setzen des Formats.';
		}
	}

	/**
	 * Show current settings
	 */
	async showSettings(ctx: CommandContext): Promise<string> {
		try {
			const prefs = await this.preferencesService.getPreferences(ctx.userId);
			return this.preferencesService.formatPreferences(prefs);
		} catch (error) {
			this.logger.error(`Failed to get settings for ${ctx.userId}:`, error);
			return '❌ Fehler beim Laden der Einstellungen.';
		}
	}

	/**
	 * Show help for morning commands
	 */
	showHelp(): string {
		return `**Morgenzusammenfassung Befehle** ☀️

\`!morning\` / \`!morgen\` - Zusammenfassung jetzt abrufen
\`!morning-on\` - Automatische Zusammenfassung aktivieren
\`!morning-off\` - Automatische Zusammenfassung deaktivieren
\`!morning-time HH:MM\` - Sendezeit einstellen (z.B. 07:30)
\`!morning-location [Stadt]\` - Wetter-Standort setzen
\`!morning-timezone [Zone]\` - Zeitzone setzen (z.B. Europe/Berlin)
\`!morning-format [kompakt|ausfuehrlich]\` - Format waehlen
\`!morning-settings\` - Aktuelle Einstellungen anzeigen`;
	}

	private requireLogin(): string {
		return '❌ Du musst angemeldet sein, um die Morgenzusammenfassung zu nutzen.\n\nMelde dich an mit: `!login deine@email.de passwort`';
	}
}
