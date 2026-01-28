import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	RichConsoleLogger,
	LogService,
	LogLevel,
} from 'matrix-bot-sdk';
import { QuotesService } from '../quotes/quotes.service';
import { ZitareService } from '../quotes/zitare.service';
import { SessionService } from '../session/session.service';
import { TranscriptionService } from '../transcription/transcription.service';
import { HELP_MESSAGE, Category } from '../config/configuration';

// Natural language keywords that trigger commands
const KEYWORD_COMMANDS: { keywords: string[]; command: string }[] = [
	{ keywords: ['hilfe', 'help', 'befehle', 'commands'], command: 'help' },
	{ keywords: ['zitat', 'quote', 'inspiration', 'inspiriere'], command: 'zitat' },
	{ keywords: ['heute', 'today', 'tages', 'tageszitat'], command: 'heute' },
	{ keywords: ['motiviere', 'motivation', 'motivier mich'], command: 'motivation' },
	{ keywords: ['guten morgen', 'morgen', 'good morning'], command: 'morgen' },
	{ keywords: ['kategorien', 'categories', 'themen'], command: 'kategorien' },
	{ keywords: ['favoriten', 'favorites', 'meine favoriten'], command: 'favoriten' },
	{ keywords: ['listen', 'lists', 'meine listen'], command: 'listen' },
	{ keywords: ['status', 'info'], command: 'status' },
];

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MatrixService.name);
	private client!: MatrixClient;
	private readonly allowedRooms: string[];
	private botUserId: string = '';

	// Track last shown quote per user for favorites
	private lastQuotes: Map<string, string> = new Map();

	constructor(
		private configService: ConfigService,
		private quotesService: QuotesService,
		private zitareService: ZitareService,
		private sessionService: SessionService,
		private transcriptionService: TranscriptionService
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
		this.client.on('room.invite', async (roomId: string) => {
			this.logger.log(`Invited to room ${roomId}, joining...`);
			await this.client.joinRoom(roomId);

			setTimeout(async () => {
				try {
					await this.sendBotIntroduction(roomId);
				} catch (error) {
					this.logger.error(`Failed to send introduction to ${roomId}:`, error);
				}
			}, 2000);
		});

		// Get bot's user ID
		this.botUserId = await this.client.getUserId();
		this.logger.log(`Bot user ID: ${this.botUserId}`);

		// Setup message handler
		this.client.on('room.message', this.handleRoomMessage.bind(this));

		// Start the client
		await this.client.start();
		this.logger.log('Matrix Zitare Bot started successfully');
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.stop();
			this.logger.log('Matrix bot stopped');
		}
	}

	private async sendBotIntroduction(roomId: string) {
		const dailyQuote = this.quotesService.getDailyQuote();

		const introText = `**Zitare Bot - Tagliche Inspiration**

Ich bringe dir jeden Tag neue Inspiration!

**Zitat des Tages:**
${this.quotesService.formatQuote(dailyQuote)}

Sag "hilfe" fur alle Befehle!`;

		await this.sendMessage(roomId, introText);
	}

	private isRoomAllowed(roomId: string): boolean {
		if (this.allowedRooms.length === 0) return true;
		return this.allowedRooms.some((allowed) => roomId === allowed || roomId.includes(allowed));
	}

	private async handleRoomMessage(roomId: string, event: any) {
		// Ignore messages from self
		if (event.sender === this.botUserId) return;

		// Check if room is allowed
		if (!this.isRoomAllowed(roomId)) {
			this.logger.debug(`Ignoring message from non-allowed room: ${roomId}`);
			return;
		}

		const content = event.content as { msgtype?: string; body?: string; url?: string };

		// Handle audio/voice messages
		if (content.msgtype === 'm.audio') {
			await this.handleAudioMessage(roomId, event.sender, content);
			return;
		}

		// Only handle text messages
		if (content.msgtype !== 'm.text') return;

		const body = content.body;
		if (!body) return;

		this.logger.log(`Message from ${event.sender} in ${roomId}: ${body.substring(0, 50)}...`);

		// Handle commands with ! prefix
		if (body.startsWith('!')) {
			await this.handleCommand(roomId, event.sender, body);
			return;
		}

		// Check for natural language keywords
		const keywordCommand = this.detectKeywordCommand(body);
		if (keywordCommand) {
			await this.handleCommand(roomId, event.sender, `!${keywordCommand}`);
			return;
		}

		// Don't respond to random messages
	}

	private detectKeywordCommand(message: string): string | null {
		const lowerMessage = message.toLowerCase().trim();

		// Only match if the message is short
		if (lowerMessage.length > 50) return null;

		for (const { keywords, command } of KEYWORD_COMMANDS) {
			for (const keyword of keywords) {
				if (lowerMessage === keyword || lowerMessage.startsWith(keyword + ' ')) {
					this.logger.log(`Detected keyword "${keyword}" -> command "${command}"`);
					return command;
				}
			}
		}
		return null;
	}

	private async handleCommand(roomId: string, sender: string, body: string) {
		const [command, ...args] = body.slice(1).split(' ');
		const argString = args.join(' ');

		switch (command.toLowerCase()) {
			case 'help':
			case 'hilfe':
			case 'start':
				await this.sendHelp(roomId);
				break;

			case 'zitat':
			case 'quote':
				await this.handleRandomQuote(roomId, sender);
				break;

			case 'heute':
			case 'today':
				await this.handleDailyQuote(roomId, sender);
				break;

			case 'suche':
			case 'search':
				await this.handleSearch(roomId, sender, argString);
				break;

			case 'kategorie':
			case 'category':
				await this.handleCategory(roomId, sender, argString);
				break;

			case 'kategorien':
			case 'categories':
				await this.handleCategories(roomId);
				break;

			case 'motivation':
			case 'morgen':
				await this.handleCategoryQuote(roomId, sender, 'motivation');
				break;

			case 'login':
				await this.handleLogin(roomId, sender, args);
				break;

			case 'logout':
				this.sessionService.logout(sender);
				await this.sendMessage(roomId, 'Du wurdest abgemeldet.');
				break;

			case 'favorit':
			case 'fav':
				await this.handleAddFavorite(roomId, sender);
				break;

			case 'favoriten':
			case 'favorites':
				await this.handleFavorites(roomId, sender);
				break;

			case 'listen':
			case 'lists':
				await this.handleLists(roomId, sender);
				break;

			case 'liste':
			case 'list':
				await this.handleCreateList(roomId, sender, argString);
				break;

			case 'addliste':
			case 'addlist':
				await this.handleAddToList(roomId, sender, args);
				break;

			case 'status':
				await this.handleStatus(roomId, sender);
				break;

			case 'pin':
				await this.pinHelpMessage(roomId);
				break;

			default:
				await this.sendMessage(
					roomId,
					`Unbekannter Befehl: !${command}\n\nSag "hilfe" fur alle Befehle.`
				);
		}
	}

	private async handleAudioMessage(
		roomId: string,
		sender: string,
		content: { url?: string; body?: string }
	) {
		if (!content.url) {
			this.logger.warn('Audio message without URL');
			return;
		}

		this.logger.log(`Processing voice message from ${sender}`);

		try {
			// Download audio from Matrix
			const httpUrl = this.client.mxcToHttp(content.url);
			const response = await fetch(httpUrl);
			if (!response.ok) {
				throw new Error(`Failed to download audio: ${response.status}`);
			}

			const audioBuffer = Buffer.from(await response.arrayBuffer());

			// Transcribe
			await this.sendMessage(roomId, '🎤 Transkribiere Sprachnotiz...');
			const transcription = await this.transcriptionService.transcribe(audioBuffer);

			if (!transcription || transcription.trim().length === 0) {
				await this.sendMessage(roomId, 'Konnte keine Sprache erkennen.');
				return;
			}

			this.logger.log(`Transcription: ${transcription}`);
			await this.sendMessage(roomId, `📝 "${transcription}"`);

			// Check for commands in transcription
			const cleanText = transcription.trim();

			// Check for keyword commands in the transcription
			const keywordCommand = this.detectKeywordCommand(cleanText);
			if (keywordCommand) {
				await this.handleCommand(roomId, sender, `!${keywordCommand}`);
				return;
			}

			// Check for category names
			const category = this.quotesService.getCategoryByName(cleanText);
			if (category) {
				await this.handleCategoryQuote(roomId, sender, category);
				return;
			}

			// Search for the transcribed text
			const results = this.quotesService.searchQuotes(cleanText);
			if (results.length > 0) {
				const quote = results[0];
				this.lastQuotes.set(sender, quote.id);
				await this.sendMessage(roomId, `**Gefunden:**\n\n${this.quotesService.formatQuote(quote)}`);
			} else {
				// Default to a random quote
				await this.handleRandomQuote(roomId, sender);
			}
		} catch (error) {
			this.logger.error('Failed to process audio message:', error);
			await this.sendMessage(roomId, 'Fehler bei der Verarbeitung der Sprachnotiz.');
		}
	}

	private async sendHelp(roomId: string) {
		await this.sendMessage(roomId, HELP_MESSAGE);
	}

	private async handleRandomQuote(roomId: string, sender: string) {
		const quote = this.quotesService.getRandomQuote();
		this.lastQuotes.set(sender, quote.id);
		await this.sendMessage(roomId, this.quotesService.formatQuote(quote));
	}

	private async handleDailyQuote(roomId: string, sender: string) {
		const quote = this.quotesService.getDailyQuote();
		this.lastQuotes.set(sender, quote.id);

		const dateStr = new Date().toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		});

		await this.sendMessage(
			roomId,
			`**Zitat des Tages - ${dateStr}**\n\n${this.quotesService.formatQuote(quote)}`
		);
	}

	private async handleSearch(roomId: string, sender: string, searchText: string) {
		if (!searchText.trim()) {
			await this.sendMessage(roomId, '**Verwendung:** `!suche [text]`\n\nBeispiel: `!suche Gluck`');
			return;
		}

		const results = this.quotesService.searchQuotes(searchText);

		if (results.length === 0) {
			await this.sendMessage(roomId, `Keine Zitate gefunden fur: "${searchText}"`);
			return;
		}

		let text = `**Suchergebnisse fur "${searchText}" (${results.length}):**\n\n`;

		const maxResults = Math.min(results.length, 5);
		for (let i = 0; i < maxResults; i++) {
			const quote = results[i];
			text += `**${i + 1}.** "${quote.text.substring(0, 80)}${quote.text.length > 80 ? '...' : ''}"\n— *${quote.author}*\n\n`;
		}

		if (results.length > 5) {
			text += `_...und ${results.length - 5} weitere_`;
		}

		// Store first result for favorites
		if (results.length > 0) {
			this.lastQuotes.set(sender, results[0].id);
		}

		await this.sendMessage(roomId, text);
	}

	private async handleCategory(roomId: string, sender: string, categoryName: string) {
		if (!categoryName.trim()) {
			await this.handleCategories(roomId);
			return;
		}

		const category = this.quotesService.getCategoryByName(categoryName);
		if (!category) {
			await this.sendMessage(
				roomId,
				`Kategorie "${categoryName}" nicht gefunden.\n\nNutze \`!kategorien\` fur alle Kategorien.`
			);
			return;
		}

		await this.handleCategoryQuote(roomId, sender, category);
	}

	private async handleCategoryQuote(roomId: string, sender: string, category: Category) {
		const quote = this.quotesService.getRandomQuoteByCategory(category);
		if (!quote) {
			await this.sendMessage(roomId, `Keine Zitate in Kategorie "${category}" gefunden.`);
			return;
		}

		this.lastQuotes.set(sender, quote.id);
		await this.sendMessage(roomId, this.quotesService.formatQuote(quote));
	}

	private async handleCategories(roomId: string) {
		const categories = this.quotesService.getAllCategories();

		let text = `**Verfugbare Kategorien:**\n\n`;
		for (const { category, label, count } of categories) {
			text += `- **${label}** (\`!kategorie ${category}\`) - ${count} Zitate\n`;
		}

		text += `\n**Gesamt:** ${this.quotesService.getTotalCount()} Zitate`;

		await this.sendMessage(roomId, text);
	}

	private async handleLogin(roomId: string, sender: string, args: string[]) {
		if (args.length < 2) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!login email passwort\`\n\nBeispiel: \`!login nutzer@example.com meinpasswort\``
			);
			return;
		}

		const [email, password] = args;

		await this.sendMessage(roomId, 'Anmeldung lauft...');

		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			await this.sendMessage(
				roomId,
				`Erfolgreich angemeldet!\n\nDu kannst jetzt Favoriten speichern und Listen verwalten.`
			);
		} else {
			await this.sendMessage(roomId, `Anmeldung fehlgeschlagen: ${result.error}`);
		}
	}

	private async handleAddFavorite(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		const lastQuoteId = this.lastQuotes.get(sender);
		if (!lastQuoteId) {
			await this.sendMessage(
				roomId,
				`Kein Zitat zum Speichern. Lass dir erst ein Zitat mit \`!zitat\` oder \`!heute\` anzeigen.`
			);
			return;
		}

		try {
			await this.zitareService.addFavorite(lastQuoteId, token);
			const quote = this.quotesService.getQuoteById(lastQuoteId);
			await this.sendMessage(
				roomId,
				`Zu Favoriten hinzugefugt!\n\n"${quote?.text.substring(0, 50)}..."`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleFavorites(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const favorites = await this.zitareService.getFavorites(token);

			if (favorites.length === 0) {
				await this.sendMessage(
					roomId,
					`Du hast noch keine Favoriten.\n\nNutze \`!favorit\` um das letzte angezeigte Zitat zu speichern.`
				);
				return;
			}

			let text = `**Deine Favoriten (${favorites.length}):**\n\n`;

			for (let i = 0; i < Math.min(favorites.length, 10); i++) {
				const fav = favorites[i];
				const quote = this.quotesService.getQuoteById(fav.quoteId);
				if (quote) {
					text += `**${i + 1}.** "${quote.text.substring(0, 60)}${quote.text.length > 60 ? '...' : ''}"\n— *${quote.author}*\n\n`;
				}
			}

			if (favorites.length > 10) {
				text += `_...und ${favorites.length - 10} weitere_`;
			}

			await this.sendMessage(roomId, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleLists(roomId: string, sender: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const lists = await this.zitareService.getLists(token);

			if (lists.length === 0) {
				await this.sendMessage(
					roomId,
					`Du hast noch keine Listen.\n\nNutze \`!liste [name]\` um eine neue Liste zu erstellen.`
				);
				return;
			}

			let text = `**Deine Listen (${lists.length}):**\n\n`;

			for (let i = 0; i < lists.length; i++) {
				const list = lists[i];
				text += `**${i + 1}. ${list.name}** - ${list.quoteIds.length} Zitate\n`;
				if (list.description) {
					text += `   _${list.description}_\n`;
				}
			}

			await this.sendMessage(roomId, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleCreateList(roomId: string, sender: string, name: string) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (!name.trim()) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!liste [name]\`\n\nBeispiel: \`!liste Meine Lieblingszitate\``
			);
			return;
		}

		try {
			const list = await this.zitareService.createList(name.trim(), undefined, token);
			await this.sendMessage(
				roomId,
				`Liste "${list.name}" erstellt!\n\nNutze \`!addliste 1 [zitat-id]\` um Zitate hinzuzufugen.`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleAddToList(roomId: string, sender: string, args: string[]) {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 1) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!addliste [listen-nr]\`\n\nFugt das letzte angezeigte Zitat zur Liste hinzu.`
			);
			return;
		}

		const listIndex = parseInt(args[0], 10);
		if (isNaN(listIndex) || listIndex < 1) {
			await this.sendMessage(roomId, `Ungultige Listennummer.`);
			return;
		}

		const lastQuoteId = this.lastQuotes.get(sender);
		if (!lastQuoteId) {
			await this.sendMessage(
				roomId,
				`Kein Zitat zum Hinzufugen. Lass dir erst ein Zitat anzeigen.`
			);
			return;
		}

		try {
			const lists = await this.zitareService.getLists(token);
			if (listIndex > lists.length) {
				await this.sendMessage(roomId, `Liste ${listIndex} existiert nicht.`);
				return;
			}

			const list = lists[listIndex - 1];
			await this.zitareService.addQuoteToList(list.id, lastQuoteId, token);

			const quote = this.quotesService.getQuoteById(lastQuoteId);
			await this.sendMessage(
				roomId,
				`Zitat zu "${list.name}" hinzugefugt!\n\n"${quote?.text.substring(0, 50)}..."`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendHealthy = await this.zitareService.checkHealth();
		const isLoggedIn = this.sessionService.isLoggedIn(sender);
		const sessionCount = this.sessionService.getSessionCount();
		const totalQuotes = this.quotesService.getTotalCount();

		const statusText = `**Zitare Bot Status**

**Backend:** ${backendHealthy ? 'Online' : 'Offline'}
**Dein Status:** ${isLoggedIn ? 'Angemeldet' : 'Nicht angemeldet'}
**Aktive Sessions:** ${sessionCount}
**Verfugbare Zitate:** ${totalQuotes}

${!isLoggedIn ? 'Nutze `!login email passwort` um dich anzumelden.' : ''}`;

		await this.sendMessage(roomId, statusText);
	}

	private async pinHelpMessage(roomId: string) {
		try {
			const htmlBody = this.markdownToHtml(HELP_MESSAGE);

			const eventId = await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: HELP_MESSAGE,
				format: 'org.matrix.custom.html',
				formatted_body: htmlBody,
			});

			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [eventId],
			});

			this.logger.log(`Pinned help message in room ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to pin help message:`, error);
			await this.sendMessage(roomId, 'Fehler beim Pinnen der Hilfe.');
		}
	}

	private async sendMessage(roomId: string, message: string) {
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
				// Underscore italic
				.replace(/_([^_]+)_/g, '<em>$1</em>')
				// Line breaks
				.replace(/\n/g, '<br/>')
		);
	}
}
