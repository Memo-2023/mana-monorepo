import { Injectable } from '@nestjs/common';
import { VoiceService } from '../voice/voice.service';
import { CommandContext } from '../bot/command-router.service';

@Injectable()
export class VoiceHandler {
	constructor(private voiceService: VoiceService) {}

	/**
	 * Show voice settings or toggle voice on/off
	 */
	async voiceSettings(ctx: CommandContext, args: string): Promise<string> {
		const arg = args.trim().toLowerCase();
		const prefs = this.voiceService.getUserPreferences(ctx.userId);

		// Toggle voice on/off
		if (arg === 'an' || arg === 'on' || arg === 'ein') {
			this.voiceService.setVoiceEnabled(ctx.userId, true);
			return '🔊 Sprachantworten aktiviert.';
		}

		if (arg === 'aus' || arg === 'off') {
			this.voiceService.setVoiceEnabled(ctx.userId, false);
			return '🔇 Sprachantworten deaktiviert.';
		}

		// Toggle auto-reply
		if (arg === 'auto an' || arg === 'auto on') {
			this.voiceService.setAutoVoiceReply(ctx.userId, true);
			return '🔊 Auto-Sprachantwort aktiviert (bei Sprachnachrichten).';
		}

		if (arg === 'auto aus' || arg === 'auto off') {
			this.voiceService.setAutoVoiceReply(ctx.userId, false);
			return '🔇 Auto-Sprachantwort deaktiviert.';
		}

		// Show current settings
		const status = prefs.voiceEnabled ? '✅ Aktiviert' : '❌ Deaktiviert';
		const autoReply = prefs.autoVoiceReply ? '✅ Aktiviert' : '❌ Deaktiviert';

		return `**🎤 Voice-Einstellungen**

**Status:** ${status}
**Auto-Antwort:** ${autoReply}
**Stimme:** ${prefs.voice}
**Geschwindigkeit:** ${prefs.speed}x

**Befehle:**
• \`!voice an\` / \`!voice aus\` - Aktivieren/Deaktivieren
• \`!voice auto an/aus\` - Auto-Antwort bei Sprachnachrichten
• \`!stimme [name]\` - Stimme wählen
• \`!stimmen\` - Verfügbare Stimmen anzeigen
• \`!speed [0.5-2.0]\` - Geschwindigkeit ändern`;
	}

	/**
	 * List available TTS voices
	 */
	async listVoices(ctx: CommandContext): Promise<string> {
		const voices = await this.voiceService.getVoices();
		const prefs = this.voiceService.getUserPreferences(ctx.userId);

		if (Object.keys(voices).length === 0) {
			return '❌ Keine Stimmen verfügbar. Voice Service nicht erreichbar.';
		}

		const voiceList = Object.entries(voices)
			.map(([id, desc]) => {
				const current = id === prefs.voice ? ' ✓' : '';
				return `• **${id}**${current}\n  ${desc}`;
			})
			.join('\n');

		return `**🗣️ Verfügbare Stimmen**

${voiceList}

*Wähle mit \`!stimme [name]\`*`;
	}

	/**
	 * Set TTS voice
	 */
	async setVoice(ctx: CommandContext, args: string): Promise<string> {
		const voiceName = args.trim();

		if (!voiceName) {
			return '❌ Bitte gib einen Stimmnamen an. Siehe `!stimmen` für verfügbare Stimmen.';
		}

		const voices = await this.voiceService.getVoices();

		// Check if voice exists
		if (!voices[voiceName]) {
			// Try partial match
			const matches = Object.keys(voices).filter((v) =>
				v.toLowerCase().includes(voiceName.toLowerCase())
			);

			if (matches.length === 1) {
				this.voiceService.setVoice(ctx.userId, matches[0]);
				return `✅ Stimme geändert zu **${matches[0]}**`;
			}

			if (matches.length > 1) {
				return `❌ Mehrere Treffer: ${matches.join(', ')}\nBitte genauer angeben.`;
			}

			return `❌ Stimme "${voiceName}" nicht gefunden. Siehe \`!stimmen\` für verfügbare Stimmen.`;
		}

		this.voiceService.setVoice(ctx.userId, voiceName);
		return `✅ Stimme geändert zu **${voiceName}**`;
	}

	/**
	 * Set speech speed
	 */
	async setSpeed(ctx: CommandContext, args: string): Promise<string> {
		const speedStr = args.trim();

		if (!speedStr) {
			const prefs = this.voiceService.getUserPreferences(ctx.userId);
			return `Aktuelle Geschwindigkeit: **${prefs.speed}x**\n\nNutze \`!speed [0.5-2.0]\` zum Ändern.\n• 0.5 = langsam\n• 1.0 = normal\n• 1.5 = schnell\n• 2.0 = sehr schnell`;
		}

		const speed = parseFloat(speedStr);

		if (isNaN(speed)) {
			return '❌ Bitte gib eine Zahl zwischen 0.5 und 2.0 an.';
		}

		if (speed < 0.5 || speed > 2.0) {
			return '❌ Die Geschwindigkeit muss zwischen 0.5 und 2.0 liegen.';
		}

		this.voiceService.setSpeed(ctx.userId, speed);
		return `✅ Geschwindigkeit geändert zu **${speed}x**`;
	}

	/**
	 * Check voice service health
	 */
	async checkHealth(): Promise<{ stt: boolean; tts: boolean }> {
		return this.voiceService.checkHealth();
	}
}
