import { Injectable } from '@nestjs/common';
import { AiService, TodoService, SessionService, CreditService } from '@manacore/bot-services';
import { CommandContext } from '../bot/command-router.service';
import { VoiceService } from '../voice/voice.service';
import { HELP_TEXT } from '../config/configuration';

@Injectable()
export class HelpHandler {
	constructor(
		private aiService: AiService,
		private todoService: TodoService,
		private voiceService: VoiceService,
		private sessionService: SessionService,
		private creditService: CreditService
	) {}

	async showHelp(ctx: CommandContext): Promise<string> {
		return HELP_TEXT;
	}

	async handleLogin(ctx: CommandContext, args: string): Promise<string> {
		const parts = args.split(' ');
		if (parts.length < 2 || !parts[0] || !parts[1]) {
			return 'Verwendung: `!login email passwort`';
		}
		const [email, password] = parts;
		const result = await this.sessionService.login(ctx.userId, email, password);

		if (result.success) {
			const token = await this.sessionService.getToken(ctx.userId);
			if (token) {
				const balance = await this.creditService.getBalance(token);
				return `✅ Erfolgreich angemeldet als **${email}**\n⚡ Credits: ${balance.balance.toFixed(2)}`;
			}
			return `✅ Erfolgreich angemeldet als **${email}**`;
		}
		return `❌ Anmeldung fehlgeschlagen: ${result.error}`;
	}

	async handleLogout(ctx: CommandContext): Promise<string> {
		await this.sessionService.logout(ctx.userId);
		return '👋 Erfolgreich abgemeldet.';
	}

	async showStatus(ctx: CommandContext): Promise<string> {
		// Auth-Status zuerst
		const loggedIn = await this.sessionService.isLoggedIn(ctx.userId);
		const session = await this.sessionService.getSession(ctx.userId);
		const token = await this.sessionService.getToken(ctx.userId);

		let authSection = '';
		if (loggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			authSection = `**👤 Account**
• Angemeldet als: ${session.email}
• Credits: ⚡ ${balance.balance.toFixed(2)}

`;
		} else {
			authSection = `**👤 Account**
• Nicht angemeldet
• Nutze \`!login email passwort\`

`;
		}

		// Check services in parallel
		const [aiConnected, todoStats, voiceHealth] = await Promise.all([
			this.aiService.checkConnection(),
			this.todoService.getStats(ctx.userId),
			this.voiceService.checkHealth(),
		]);

		const aiStatus = aiConnected ? '✅ Online' : '❌ Offline';
		const currentModel =
			this.aiService.getSession(ctx.userId)?.model || this.aiService.getDefaultModel();

		const sttStatus = voiceHealth.stt ? '✅ Online' : '❌ Offline';
		const ttsStatus = voiceHealth.tts ? '✅ Online' : '❌ Offline';

		const voicePrefs = this.voiceService.getUserPreferences(ctx.userId);
		const voiceEnabled = voicePrefs.voiceEnabled ? '✅ Aktiviert' : '❌ Deaktiviert';

		return `**📊 Status**

${authSection}**AI/Ollama**
• Verbindung: ${aiStatus}
• Modell: \`${currentModel}\`

**🎤 Voice**
• STT (Whisper): ${sttStatus}
• TTS (Edge): ${ttsStatus}
• Deine Einstellung: ${voiceEnabled}
• Stimme: ${voicePrefs.voice}

**Todos**
• Offen: ${todoStats.pending}
• Heute fällig: ${todoStats.today}
• Erledigt: ${todoStats.completed}

**Bot**
• Status: ✅ Online
• DSGVO: ✅ Alle Daten lokal`;
	}
}
