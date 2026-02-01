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

		// Show current settings
		const status = prefs.voiceEnabled ? '✅ Aktiviert' : '❌ Deaktiviert';

		return `**🎤 Voice-Einstellungen**

**Status:** ${status}
**Stimme:** ${prefs.voice}
**Geschwindigkeit:** ${prefs.speed}x

**Befehle:**
• \`!voice an\` / \`!voice aus\` - Aktivieren/Deaktivieren
• \`!stimme [name]\` - Stimme wählen
• \`!stimmen\` - Verfügbare Stimmen anzeigen`;
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
	 * Check voice service health
	 */
	async checkHealth(): Promise<{ stt: boolean; tts: boolean }> {
		return this.voiceService.checkHealth();
	}
}
