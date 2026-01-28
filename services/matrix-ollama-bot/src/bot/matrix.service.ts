import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
	RichConsoleLogger,
	LogService,
	LogLevel,
} from 'matrix-bot-sdk';
import { OllamaService } from '../ollama/ollama.service';
import { SYSTEM_PROMPTS } from '../config/configuration';

interface UserSession {
	systemPrompt: string;
	model: string;
	history: { role: 'user' | 'assistant'; content: string }[];
}

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MatrixService.name);
	private client!: MatrixClient;
	private sessions: Map<string, UserSession> = new Map();
	private readonly allowedRooms: string[];
	private botUserId: string = '';

	constructor(
		private configService: ConfigService,
		private ollamaService: OllamaService
	) {
		this.allowedRooms = this.configService.get<string[]>('matrix.allowedRooms') || [];
	}

	async onModuleInit() {
		const homeserverUrl = this.configService.get<string>('matrix.homeserverUrl');
		const accessToken = this.configService.get<string>('matrix.accessToken');
		const storagePath = this.configService.get<string>('matrix.storagePath');

		if (!accessToken) {
			this.logger.error('MATRIX_ACCESS_TOKEN is required');
			return;
		}

		// Setup logging
		LogService.setLogger(new RichConsoleLogger());
		LogService.setLevel(LogLevel.INFO);

		// Storage for sync token persistence
		const storage = new SimpleFsStorageProvider(storagePath || './data/bot-storage.json');

		// Create Matrix client
		this.client = new MatrixClient(homeserverUrl!, accessToken, storage);

		// Auto-join rooms when invited
		AutojoinRoomsMixin.setupOnClient(this.client);

		// Get bot's user ID
		this.botUserId = await this.client.getUserId();
		this.logger.log(`Bot user ID: ${this.botUserId}`);

		// Setup message handler
		this.client.on('room.message', this.handleRoomMessage.bind(this));

		// Start the client
		await this.client.start();
		this.logger.log('Matrix bot started successfully');
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.stop();
			this.logger.log('Matrix bot stopped');
		}
	}

	private isRoomAllowed(roomId: string): boolean {
		if (this.allowedRooms.length === 0) return true;
		return this.allowedRooms.some((allowed) => roomId === allowed || roomId.includes(allowed));
	}

	private getSession(senderId: string): UserSession {
		if (!this.sessions.has(senderId)) {
			this.sessions.set(senderId, {
				systemPrompt: SYSTEM_PROMPTS.default,
				model: this.ollamaService.getDefaultModel(),
				history: [],
			});
		}
		return this.sessions.get(senderId)!;
	}

	private async handleRoomMessage(roomId: string, event: any) {
		// Ignore messages from self
		if (event.sender === this.botUserId) return;

		// Check if room is allowed
		if (!this.isRoomAllowed(roomId)) {
			this.logger.debug(`Ignoring message from non-allowed room: ${roomId}`);
			return;
		}

		// Only handle text messages
		const content = event.content as { msgtype?: string; body?: string };
		if (content.msgtype !== 'm.text') return;

		const body = content.body;
		if (!body) return;

		this.logger.log(`Message from ${event.sender} in ${roomId}: ${body.substring(0, 50)}...`);

		// Handle commands
		if (body.startsWith('!')) {
			await this.handleCommand(roomId, event.sender, body);
			return;
		}

		// Regular chat message
		await this.handleChat(roomId, event.sender, body);
	}

	private async handleCommand(roomId: string, sender: string, body: string) {
		const [command, ...args] = body.slice(1).split(' ');
		const argString = args.join(' ');

		switch (command.toLowerCase()) {
			case 'help':
			case 'start':
				await this.sendHelp(roomId);
				break;

			case 'models':
				await this.sendModels(roomId, sender);
				break;

			case 'model':
				await this.setModel(roomId, sender, argString);
				break;

			case 'mode':
				await this.setMode(roomId, sender, argString);
				break;

			case 'clear':
				await this.clearHistory(roomId, sender);
				break;

			case 'status':
				await this.sendStatus(roomId, sender);
				break;

			case 'all':
				await this.handleAllModels(roomId, sender, argString);
				break;

			default:
				await this.sendMessage(
					roomId,
					`Unbekannter Befehl: !${command}\n\nVerwende !help für eine Liste der Befehle.`
				);
		}
	}

	private async sendHelp(roomId: string) {
		const helpText = `**Mana Chat - Lokale KI (DSGVO-konform)**

**Befehle:**
- \`!help\` - Diese Hilfe anzeigen
- \`!models\` - Verfügbare Modelle anzeigen
- \`!model [name]\` - Modell wechseln
- \`!all [frage]\` - **Alle Modelle vergleichen**
- \`!mode [modus]\` - System-Prompt ändern
- \`!clear\` - Chat-Verlauf löschen
- \`!status\` - Ollama Status prüfen

**Modi:**
- \`default\` - Allgemeiner Assistent
- \`classify\` - Text-Klassifizierung
- \`summarize\` - Zusammenfassungen
- \`translate\` - Übersetzungen
- \`code\` - Programmier-Hilfe

**Verwendung:**
Schreibe einfach eine Nachricht und ich antworte!

**Beispiel Modellvergleich:**
\`!all Was ist der Sinn des Lebens?\`

**Aktuelles Modell:** \`${this.ollamaService.getDefaultModel()}\``;

		await this.sendMessage(roomId, helpText);
	}

	private async sendModels(roomId: string, sender: string) {
		const models = await this.ollamaService.listModels();
		if (models.length === 0) {
			await this.sendMessage(roomId, 'Keine Modelle gefunden. Ist Ollama gestartet?');
			return;
		}

		const session = this.getSession(sender);
		const modelList = models
			.map((m) => {
				const sizeMB = (m.size / 1024 / 1024).toFixed(0);
				const active = m.name === session.model ? ' ✓' : '';
				return `- \`${m.name}\` (${sizeMB} MB)${active}`;
			})
			.join('\n');

		await this.sendMessage(
			roomId,
			`**Verfügbare Modelle:**\n\n${modelList}\n\nWechseln mit: \`!model [name]\``
		);
	}

	private async setModel(roomId: string, sender: string, modelName: string) {
		if (!modelName) {
			const session = this.getSession(sender);
			await this.sendMessage(
				roomId,
				`Aktuelles Modell: \`${session.model}\`\n\nVerwendung: \`!model gemma3:4b\``
			);
			return;
		}

		const models = await this.ollamaService.listModels();
		const exists = models.some((m) => m.name === modelName);

		if (!exists) {
			const available = models.map((m) => m.name).join(', ');
			await this.sendMessage(
				roomId,
				`Modell "${modelName}" nicht gefunden.\n\nVerfügbar: ${available}`
			);
			return;
		}

		const session = this.getSession(sender);
		session.model = modelName;
		session.history = [];

		this.logger.log(`User ${sender} switched to model ${modelName}`);
		await this.sendMessage(roomId, `Modell gewechselt zu: \`${modelName}\``);
	}

	private async setMode(roomId: string, sender: string, mode: string) {
		const availableModes = Object.keys(SYSTEM_PROMPTS);

		if (!mode) {
			const session = this.getSession(sender);
			const currentMode =
				Object.entries(SYSTEM_PROMPTS).find(([_, v]) => v === session.systemPrompt)?.[0] ||
				'custom';
			await this.sendMessage(
				roomId,
				`Aktueller Modus: \`${currentMode}\`\n\nVerfügbar: ${availableModes.join(', ')}`
			);
			return;
		}

		const normalizedMode = mode.toLowerCase();
		if (!SYSTEM_PROMPTS[normalizedMode]) {
			await this.sendMessage(
				roomId,
				`Unbekannter Modus: ${mode}\n\nVerfügbar: ${availableModes.join(', ')}`
			);
			return;
		}

		const session = this.getSession(sender);
		session.systemPrompt = SYSTEM_PROMPTS[normalizedMode];
		session.history = [];

		this.logger.log(`User ${sender} switched to mode ${normalizedMode}`);
		await this.sendMessage(roomId, `Modus gewechselt zu: \`${normalizedMode}\``);
	}

	private async clearHistory(roomId: string, sender: string) {
		const session = this.getSession(sender);
		session.history = [];

		this.logger.log(`User ${sender} cleared history`);
		await this.sendMessage(roomId, 'Chat-Verlauf gelöscht.');
	}

	private async sendStatus(roomId: string, sender: string) {
		const connected = await this.ollamaService.checkConnection();
		const models = await this.ollamaService.listModels();
		const session = this.getSession(sender);

		const statusText = `**Ollama Status**

**Verbindung:** ${connected ? '✅ Online' : '❌ Offline'}
**Modelle:** ${models.length}
**Dein Modell:** \`${session.model}\`
**Chat-Verlauf:** ${session.history.length} Nachrichten
**DSGVO:** ✅ Alle Daten lokal`;

		await this.sendMessage(roomId, statusText);
	}

	private async handleAllModels(roomId: string, sender: string, message: string) {
		if (!message.trim()) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!all [Deine Frage]\`\n\nBeispiel: \`!all Was ist 2+2?\`\n\nDie Frage wird an alle Modelle gesendet und du siehst die Antworten zum Vergleich.`
			);
			return;
		}

		const models = await this.ollamaService.listModels();
		if (models.length === 0) {
			await this.sendMessage(roomId, '❌ Keine Modelle gefunden. Ist Ollama gestartet?');
			return;
		}

		await this.sendMessage(
			roomId,
			`🔄 **Vergleiche ${models.length} Modelle...**\n\nFrage: "${message}"`
		);

		// Send typing indicator
		await this.client.setTyping(roomId, true, 300000);

		const session = this.getSession(sender);
		const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
			{ role: 'system', content: session.systemPrompt },
			{ role: 'user', content: message },
		];

		const results: { model: string; response: string; duration: number; error?: string }[] = [];

		for (const model of models) {
			const startTime = Date.now();
			try {
				this.logger.log(`Querying model ${model.name}...`);
				const response = await this.ollamaService.chat(messages, model.name);
				const duration = Date.now() - startTime;
				results.push({ model: model.name, response, duration });
			} catch (error) {
				const duration = Date.now() - startTime;
				const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
				results.push({ model: model.name, response: '', duration, error: errorMessage });
			}
		}

		await this.client.setTyping(roomId, false);

		// Format results
		let resultText = `**📊 Modellvergleich**\n\n**Frage:** "${message}"\n\n---\n\n`;

		for (const result of results) {
			const durationSec = (result.duration / 1000).toFixed(1);
			if (result.error) {
				resultText += `**${result.model}** ⏱️ ${durationSec}s\n❌ Fehler: ${result.error}\n\n---\n\n`;
			} else {
				// Truncate long responses for readability
				const truncatedResponse =
					result.response.length > 500
						? result.response.substring(0, 500) + '...'
						: result.response;
				resultText += `**${result.model}** ⏱️ ${durationSec}s\n${truncatedResponse}\n\n---\n\n`;
			}
		}

		await this.sendMessage(roomId, resultText);
	}

	private async handleChat(roomId: string, sender: string, message: string) {
		const session = this.getSession(sender);

		// Send typing indicator
		await this.client.setTyping(roomId, true, 30000);

		try {
			// Add user message to history
			session.history.push({ role: 'user', content: message });

			// Keep only last 10 messages
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

			// Stop typing indicator
			await this.client.setTyping(roomId, false);

			// Send response (Matrix has higher message limits than Telegram)
			await this.sendMessage(roomId, response);
		} catch (error) {
			await this.client.setTyping(roomId, false);
			this.logger.error(`Error processing message:`, error);
			const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `❌ Fehler: ${errorMessage}`);
		}
	}

	private async sendMessage(roomId: string, message: string) {
		// Convert markdown to basic HTML for Matrix
		const htmlBody = this.markdownToHtml(message);

		await this.client.sendMessage(roomId, {
			msgtype: 'm.text',
			body: message,
			format: 'org.matrix.custom.html',
			formatted_body: htmlBody,
		});
	}

	private markdownToHtml(markdown: string): string {
		return (
			markdown
				// Code blocks
				.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
				// Inline code
				.replace(/`([^`]+)`/g, '<code>$1</code>')
				// Bold
				.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
				// Italic
				.replace(/\*([^*]+)\*/g, '<em>$1</em>')
				// Line breaks
				.replace(/\n/g, '<br/>')
		);
	}
}
