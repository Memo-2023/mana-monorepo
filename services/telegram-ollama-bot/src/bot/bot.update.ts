import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from '../ollama/ollama.service';
import { SYSTEM_PROMPTS } from '../config/configuration';

interface UserSession {
	systemPrompt: string;
	model: string;
	history: { role: 'user' | 'assistant'; content: string }[];
}

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);
	private readonly allowedUsers: number[];
	private sessions: Map<number, UserSession> = new Map();

	constructor(
		private readonly ollamaService: OllamaService,
		private configService: ConfigService
	) {
		this.allowedUsers = this.configService.get<number[]>('telegram.allowedUsers') || [];
	}

	private isAllowed(userId: number): boolean {
		// If no users configured, allow all
		if (this.allowedUsers.length === 0) return true;
		return this.allowedUsers.includes(userId);
	}

	private getSession(userId: number): UserSession {
		if (!this.sessions.has(userId)) {
			this.sessions.set(userId, {
				systemPrompt: SYSTEM_PROMPTS.default,
				model: this.ollamaService.getDefaultModel(),
				history: [],
			});
		}
		return this.sessions.get(userId)!;
	}

	private formatHelp(): string {
		return `<b>Ollama Bot - Lokale KI</b>

<b>Commands:</b>
/start - Diese Hilfe anzeigen
/help - Diese Hilfe anzeigen
/models - Verfügbare Modelle anzeigen
/model [name] - Modell wechseln
/mode [modus] - System-Prompt ändern
/clear - Chat-Verlauf löschen
/status - Ollama Status prüfen

<b>Modi:</b>
• <code>default</code> - Allgemeiner Assistent
• <code>classify</code> - Text-Klassifizierung
• <code>summarize</code> - Zusammenfassungen
• <code>translate</code> - Übersetzungen
• <code>code</code> - Programmier-Hilfe

<b>Verwendung:</b>
Schreibe einfach eine Nachricht und ich antworte!

<b>Aktuelles Modell:</b> <code>${this.ollamaService.getDefaultModel()}</code>`;
	}

	@Start()
	async start(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		this.logger.log(`/start from user ${userId}`);
		await ctx.replyWithHTML(this.formatHelp());
	}

	@Help()
	async help(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		await ctx.replyWithHTML(this.formatHelp());
	}

	@Command('models')
	async models(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		this.logger.log(`/models from user ${userId}`);

		const models = await this.ollamaService.listModels();
		if (models.length === 0) {
			await ctx.reply('Keine Modelle gefunden. Ist Ollama gestartet?');
			return;
		}

		const session = this.getSession(userId);
		const modelList = models
			.map((m) => {
				const sizeMB = (m.size / 1024 / 1024).toFixed(0);
				const active = m.name === session.model ? ' ✓' : '';
				return `• <code>${m.name}</code> (${sizeMB} MB)${active}`;
			})
			.join('\n');

		await ctx.replyWithHTML(
			`<b>Verfügbare Modelle:</b>\n\n${modelList}\n\nWechseln mit: /model [name]`
		);
	}

	@Command('model')
	async setModel(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const modelName = text.replace('/model', '').trim();
		if (!modelName) {
			const session = this.getSession(userId);
			await ctx.reply(`Aktuelles Modell: ${session.model}\n\nVerwendung: /model gemma3:4b`);
			return;
		}

		const models = await this.ollamaService.listModels();
		const exists = models.some((m) => m.name === modelName);

		if (!exists) {
			await ctx.reply(
				`Modell "${modelName}" nicht gefunden. Verfügbar: ${models.map((m) => m.name).join(', ')}`
			);
			return;
		}

		const session = this.getSession(userId);
		session.model = modelName;
		session.history = []; // Clear history on model change

		this.logger.log(`User ${userId} switched to model ${modelName}`);
		await ctx.reply(`Modell gewechselt zu: ${modelName}`);
	}

	@Command('mode')
	async setMode(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const mode = text.replace('/mode', '').trim().toLowerCase();
		const availableModes = Object.keys(SYSTEM_PROMPTS);

		if (!mode) {
			const session = this.getSession(userId);
			const currentMode =
				Object.entries(SYSTEM_PROMPTS).find(([_, v]) => v === session.systemPrompt)?.[0] ||
				'custom';
			await ctx.reply(`Aktueller Modus: ${currentMode}\n\nVerfügbar: ${availableModes.join(', ')}`);
			return;
		}

		if (!SYSTEM_PROMPTS[mode]) {
			await ctx.reply(`Unbekannter Modus: ${mode}\n\nVerfügbar: ${availableModes.join(', ')}`);
			return;
		}

		const session = this.getSession(userId);
		session.systemPrompt = SYSTEM_PROMPTS[mode];
		session.history = []; // Clear history on mode change

		this.logger.log(`User ${userId} switched to mode ${mode}`);
		await ctx.reply(`Modus gewechselt zu: ${mode}`);
	}

	@Command('clear')
	async clear(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const session = this.getSession(userId);
		session.history = [];

		this.logger.log(`User ${userId} cleared history`);
		await ctx.reply('Chat-Verlauf gelöscht.');
	}

	@Command('status')
	async status(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		const connected = await this.ollamaService.checkConnection();
		const models = await this.ollamaService.listModels();
		const session = this.getSession(userId);

		const statusText = `<b>Ollama Status</b>

<b>Verbindung:</b> ${connected ? '✅ Online' : '❌ Offline'}
<b>Modelle:</b> ${models.length}
<b>Dein Modell:</b> <code>${session.model}</code>
<b>Chat-Verlauf:</b> ${session.history.length} Nachrichten`;

		await ctx.replyWithHTML(statusText);
	}

	@On('text')
	async onMessage(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('Zugriff verweigert.');
			return;
		}

		// Ignore commands
		if (text.startsWith('/')) return;

		this.logger.log(`Message from user ${userId}: ${text.substring(0, 50)}...`);

		const session = this.getSession(userId);

		// Show typing indicator
		await ctx.sendChatAction('typing');

		try {
			// Add user message to history
			session.history.push({ role: 'user', content: text });

			// Keep only last 10 messages to avoid context overflow
			if (session.history.length > 10) {
				session.history = session.history.slice(-10);
			}

			// Build messages with system prompt
			const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
				{ role: 'system', content: session.systemPrompt },
				...session.history,
			];

			const response = await this.ollamaService.chat(messages, session.model);

			// Add assistant response to history
			session.history.push({ role: 'assistant', content: response });

			// Split long messages (Telegram limit is 4096 chars)
			if (response.length > 4000) {
				const chunks = response.match(/.{1,4000}/gs) || [];
				for (const chunk of chunks) {
					await ctx.reply(chunk);
				}
			} else {
				await ctx.reply(response);
			}
		} catch (error) {
			this.logger.error(`Error processing message:`, error);
			const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await ctx.reply(`Fehler: ${errorMessage}`);
		}
	}
}
