import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { TranscriptionService, SessionService, CreditService } from '@manacore/bot-services';
import { OllamaService } from '../ollama/ollama.service';
import { SYSTEM_PROMPTS } from '../config/configuration';

// Ollama is local, so credits are minimal
const OLLAMA_CHAT_CREDITS = 0.1;

interface UserSession {
	systemPrompt: string;
	model: string;
	history: { role: 'user' | 'assistant'; content: string }[];
	pendingImage?: { url: string; mimeType: string };
}

// Models excluded from !all comparison (specialized, not for general chat)
const NON_CHAT_MODELS = ['deepseek-r1:1.5b'];

// Models that support vision/image input
const VISION_MODELS = ['llava', 'llava:7b', 'llava:13b', 'bakllava', 'moondream'];

// Natural language keyword detector
const keywordDetector = new KeywordCommandDetector([
	...COMMON_KEYWORDS,
	{ keywords: ['modelle', 'models', 'welche modelle', 'liste modelle'], command: 'models' },
	{ keywords: ['verbindung', 'connection', 'online'], command: 'status' },
	{ keywords: ['lösche verlauf', 'clear', 'neustart', 'reset', 'vergiss alles'], command: 'clear' },
]);

@Injectable()
export class MatrixService extends BaseMatrixService {
	private sessions: Map<string, UserSession> = new Map();

	constructor(
		configService: ConfigService,
		private readonly transcriptionService: TranscriptionService,
		private ollamaService: OllamaService,
		private sessionService: SessionService,
		private creditService: CreditService
	) {
		super(configService);
	}

	protected override async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		try {
			const mxcUrl = event.content.url;
			if (!mxcUrl) return;

			const audioBuffer = await this.downloadMedia(mxcUrl);
			const text = await this.transcriptionService.transcribe(audioBuffer);
			if (!text) {
				await this.sendMessage(roomId, '❌ Sprachnachricht konnte nicht erkannt werden.');
				return;
			}

			await this.sendMessage(roomId, `🎤 *"${text}"*`);
			await this.handleTextMessage(roomId, event, text, sender);
		} catch (error) {
			this.logger.error(`Audio transcription error: ${error}`);
			await this.sendMessage(roomId, '❌ Fehler bei der Spracherkennung.');
		}
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl:
				this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath:
				this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected getIntroductionMessage(): string | null {
		return `**Hallo! Ich bin Manai, eure lokale KI-Assistentin.**

Alle Daten bleiben auf diesem Server - 100% DSGVO-konform!

**Quick Start:**
- Schreibt einfach eine Nachricht
- Sagt "hilfe" für alle Befehle
- Sagt "modelle" um KI-Modelle zu sehen`;
	}

	async onModuleInit() {
		await super.onModuleInit();

		if (!this.client) return;

		this.botUserId = await this.client.getUserId();
		this.logger.log(`Bot user ID: ${this.botUserId}`);

		// Setup room join handler for welcome message
		this.client.on('room.join', this.handleRoomJoin.bind(this));

		// Handle image messages
		this.client.on('room.message', async (roomId: string, event: any) => {
			if (event.sender === this.botUserId) return;

			const content = event.content as {
				msgtype?: string;
				body?: string;
				url?: string;
				info?: { mimetype?: string };
			};

			// Handle image messages - store for later use with !vision
			if (content.msgtype === 'm.image' && content.url) {
				const session = this.getSession(event.sender);
				session.pendingImage = {
					url: content.url,
					mimeType: content.info?.mimetype || 'image/png',
				};
				this.logger.log(`Image received from ${event.sender}, stored for !vision command`);
				await this.sendMessage(
					roomId,
					`Bild empfangen! Nutze jetzt:\n- \`!vision [Frage zum Bild]\` - Bild mit einem Modell analysieren\n- \`!vision:all [Frage]\` - Bild mit allen Vision-Modellen vergleichen`
				);
			}
		});
	}

	private async handleRoomJoin(roomId: string, event: any) {
		// Only send welcome when someone else joins (not the bot itself)
		if (event.state_key === this.botUserId) return;
		if (!this.isRoomAllowed(roomId)) return;

		this.logger.log(`User ${event.state_key} joined room ${roomId}`);

		// Send welcome message
		await this.sendWelcomeMessage(roomId, event.state_key);
	}

	private async sendWelcomeMessage(roomId: string, userId: string) {
		const welcomeText = `**Willkommen im Mana Chat, ${this.extractUsername(userId)}!**

Ich bin **Manai**, deine lokale KI-Assistentin (100% DSGVO-konform).

**So nutzt du mich:**
- Schreib einfach eine Nachricht - ich antworte!
- Sag "hilfe" oder "modelle" für mehr Infos
- Oder nutze Befehle wie \`!help\`

**Quick Start:**
- "Was ist TypeScript?" -> Ich erkläre es dir
- "modelle" -> Zeigt verfügbare KI-Modelle
- \`!all Erkläre Recursion\` -> Vergleicht alle Modelle

Viel Spass!`;

		await this.sendMessage(roomId, welcomeText);
	}

	private extractUsername(userId: string): string {
		// Extract username from @user:server.com format
		const match = userId.match(/@([^:]+)/);
		return match ? match[1] : userId;
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

	protected async handleTextMessage(
		roomId: string,
		_event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		// Handle commands with ! prefix
		if (message.startsWith('!')) {
			await this.handleCommand(roomId, sender, message);
			return;
		}

		// Check for natural language keywords
		const detectedCommand = keywordDetector.detect(message);
		if (detectedCommand) {
			this.logger.log(`Detected keyword command: ${detectedCommand}`);
			await this.handleCommand(roomId, sender, `!${detectedCommand}`);
			return;
		}

		// Regular chat message
		await this.handleChat(roomId, sender, message);
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

			case 'vision':
				await this.handleVision(roomId, sender, argString);
				break;

			case 'vision:all':
				await this.handleVisionAll(roomId, sender, argString);
				break;

			case 'pin':
				await this.pinHelpMessage(roomId);
				await this.sendMessage(roomId, 'Hilfe wurde angepinnt!');
				break;

			default:
				await this.sendMessage(
					roomId,
					`Unbekannter Befehl: !${command}\n\nVerwende !help für eine Liste der Befehle.`
				);
		}
	}

	private async sendHelp(roomId: string) {
		const helpText = `**Manai - Lokale KI (100% DSGVO-konform)**

**Einfache Befehle** (sag einfach):
- "hilfe" - Diese Hilfe
- "modelle" - Verfügbare KI-Modelle
- "status" - Verbindungsstatus
- "lösche verlauf" - Chat zurücksetzen

**Power-User Befehle** (mit !):
- \`!model [name]\` - Modell wechseln
- \`!all [frage]\` - Alle Modelle vergleichen
- \`!mode [modus]\` - Modus ändern (default/code/translate/summarize)

**Bild-Analyse:**
1. Sende ein Bild
2. Dann: \`!vision [frage]\` oder \`!vision:all [frage]\`

**Verwendung:**
Schreibe einfach eine Nachricht und ich antworte!

**Beispiele:**
- "Was ist Kubernetes?" -> Direkte Antwort
- "modelle" -> Zeigt alle Modelle
- \`!all Erkläre Docker\` -> Vergleicht alle Modelle

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
		const loggedIn = await this.sessionService.isLoggedIn(sender);
		const authSession = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let statusText = `**Ollama Status**\n\n`;
		statusText += `**Verbindung:** ${connected ? 'Online' : 'Offline'}\n`;
		statusText += `**Modelle:** ${models.length}\n`;
		statusText += `**Dein Modell:** \`${session.model}\`\n`;
		statusText += `**Chat-Verlauf:** ${session.history.length} Nachrichten\n`;

		if (loggedIn && authSession && token) {
			const balance = await this.creditService.getBalance(token);
			statusText += `**👤 Angemeldet als:** ${authSession.email}\n`;
			statusText += `**⚡ Credits:** ${balance.balance.toFixed(2)}\n`;
		}

		statusText += `**DSGVO:** Alle Daten lokal`;

		await this.sendMessage(roomId, statusText);
	}

	private async handleAllModels(roomId: string, sender: string, message: string) {
		if (!message.trim()) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!all [Deine Frage]\`\n\nBeispiel: \`!all Was ist 2+2?\`\n\nDie Frage wird an alle Chat-Modelle gesendet und du siehst die Antworten zum Vergleich.`
			);
			return;
		}

		const allModels = await this.ollamaService.listModels();
		// Filter out non-chat models (OCR, specialized models)
		const models = allModels.filter((m) => !NON_CHAT_MODELS.includes(m.name));

		if (models.length === 0) {
			await this.sendMessage(roomId, 'Keine Chat-Modelle gefunden. Ist Ollama gestartet?');
			return;
		}

		const skipped = allModels.length - models.length;
		const skippedNote = skipped > 0 ? ` (${skipped} spezialisierte Modelle übersprungen)` : '';

		await this.sendMessage(
			roomId,
			`**Vergleiche ${models.length} Chat-Modelle...**${skippedNote}\n\nFrage: "${message}"`
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
		let resultText = `**Modellvergleich**\n\n**Frage:** "${message}"\n\n---\n\n`;

		for (const result of results) {
			const durationSec = (result.duration / 1000).toFixed(1);
			if (result.error) {
				resultText += `**${result.model}** ${durationSec}s\nFehler: ${result.error}\n\n---\n\n`;
			} else {
				// Truncate long responses for readability
				const truncatedResponse =
					result.response.length > 500
						? result.response.substring(0, 500) + '...'
						: result.response;
				resultText += `**${result.model}** ${durationSec}s\n${truncatedResponse}\n\n---\n\n`;
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
			await this.sendMessage(roomId, `Fehler: ${errorMessage}`);
		}
	}

	private async handleVision(roomId: string, sender: string, prompt: string) {
		const session = this.getSession(sender);

		if (!session.pendingImage) {
			await this.sendMessage(
				roomId,
				`Kein Bild vorhanden!\n\nSende zuerst ein Bild, dann nutze \`!vision [Frage zum Bild]\``
			);
			return;
		}

		if (!prompt.trim()) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!vision [Deine Frage zum Bild]\`\n\nBeispiel: \`!vision Was siehst du auf diesem Bild?\``
			);
			return;
		}

		// Find available vision models
		const allModels = await this.ollamaService.listModels();
		const visionModels = allModels.filter((m) => VISION_MODELS.some((v) => m.name.includes(v)));

		if (visionModels.length === 0) {
			await this.sendMessage(
				roomId,
				`Keine Vision-Modelle gefunden!\n\nInstalliere ein Vision-Modell mit:\n\`ollama pull llava\``
			);
			return;
		}

		const model = visionModels[0].name;
		await this.sendMessage(roomId, `Analysiere Bild mit \`${model}\`...`);
		await this.client.setTyping(roomId, true, 120000);

		try {
			// Download image from Matrix
			const imageData = await this.downloadMatrixImage(session.pendingImage.url);

			const response = await this.ollamaService.chatWithImage(prompt, imageData, model);

			await this.client.setTyping(roomId, false);
			await this.sendMessage(roomId, `**${model}:**\n\n${response}`);
		} catch (error) {
			await this.client.setTyping(roomId, false);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler bei der Bildanalyse: ${errorMsg}`);
		}
	}

	private async handleVisionAll(roomId: string, sender: string, prompt: string) {
		const session = this.getSession(sender);

		if (!session.pendingImage) {
			await this.sendMessage(
				roomId,
				`Kein Bild vorhanden!\n\nSende zuerst ein Bild, dann nutze \`!vision:all [Frage zum Bild]\``
			);
			return;
		}

		if (!prompt.trim()) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!vision:all [Deine Frage zum Bild]\`\n\nBeispiel: \`!vision:all Beschreibe was du siehst\``
			);
			return;
		}

		// Find available vision models
		const allModels = await this.ollamaService.listModels();
		const visionModels = allModels.filter((m) => VISION_MODELS.some((v) => m.name.includes(v)));

		if (visionModels.length === 0) {
			await this.sendMessage(
				roomId,
				`Keine Vision-Modelle gefunden!\n\nInstalliere Vision-Modelle mit:\n\`ollama pull llava\`\n\`ollama pull moondream\``
			);
			return;
		}

		await this.sendMessage(
			roomId,
			`**Vergleiche ${visionModels.length} Vision-Modelle...**\n\nFrage: "${prompt}"`
		);
		await this.client.setTyping(roomId, true, 300000);

		try {
			// Download image from Matrix once
			const imageData = await this.downloadMatrixImage(session.pendingImage.url);

			const results: { model: string; response: string; duration: number; error?: string }[] = [];

			for (const model of visionModels) {
				const startTime = Date.now();
				try {
					this.logger.log(`Querying vision model ${model.name}...`);
					const response = await this.ollamaService.chatWithImage(prompt, imageData, model.name);
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
			let resultText = `**Vision-Modellvergleich**\n\n**Frage:** "${prompt}"\n\n---\n\n`;

			for (const result of results) {
				const durationSec = (result.duration / 1000).toFixed(1);
				if (result.error) {
					resultText += `**${result.model}** ${durationSec}s\nFehler: ${result.error}\n\n---\n\n`;
				} else {
					const truncatedResponse =
						result.response.length > 500
							? result.response.substring(0, 500) + '...'
							: result.response;
					resultText += `**${result.model}** ${durationSec}s\n${truncatedResponse}\n\n---\n\n`;
				}
			}

			await this.sendMessage(roomId, resultText);
		} catch (error) {
			await this.client.setTyping(roomId, false);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async downloadMatrixImage(mxcUrl: string): Promise<string> {
		// Convert mxc:// URL to HTTP URL and download
		const httpUrl = this.client.mxcToHttp(mxcUrl);
		this.logger.log(`Downloading image from ${httpUrl}`);

		const response = await fetch(httpUrl);
		if (!response.ok) {
			throw new Error(`Failed to download image: ${response.status}`);
		}

		const buffer = await response.arrayBuffer();
		const base64 = Buffer.from(buffer).toString('base64');
		return base64;
	}

	private async pinHelpMessage(roomId: string) {
		try {
			const helpContent = this.getHelpContent();
			const htmlBody = this.markdownToHtmlLocal(helpContent);

			const eventId = await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: helpContent,
				format: 'org.matrix.custom.html',
				formatted_body: htmlBody,
			});

			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [eventId],
			});

			this.logger.log(`Pinned help message in room ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to pin help message in ${roomId}:`, error);
		}
	}

	private getHelpContent(): string {
		return `**Manai - Befehls-Übersicht**

**Einfach sagen:**
- "hilfe" - Diese Übersicht
- "modelle" - Verfügbare KI-Modelle
- "status" - Bot-Status
- "lösche verlauf" - Chat zurücksetzen

**Power-User (mit !):**
- \`!model [name]\` - Modell wechseln
- \`!all [frage]\` - Alle Modelle vergleichen
- \`!vision [frage]\` - Bild analysieren

**Nutzung:** Einfach schreiben und ich antworte!`;
	}

	private markdownToHtmlLocal(markdown: string): string {
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
