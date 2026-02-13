import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { QuotesService } from '../quotes/quotes.service';
import { ZitareService } from '../quotes/zitare.service';
import { SessionService, TranscriptionService, CreditService } from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';
import type { Category } from '@zitare/content';

@Injectable()
export class MatrixService extends BaseMatrixService {
	// Track last shown quote per user for favorites
	private lastQuotes: Map<string, string> = new Map();

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['zitat', 'quote', 'inspiration', 'inspiriere'], command: 'zitat' },
		{ keywords: ['heute', 'today', 'tages', 'tageszitat'], command: 'heute' },
		{ keywords: ['motiviere', 'motivation', 'motivier mich'], command: 'motivation' },
		{ keywords: ['guten morgen', 'morgen', 'good morning'], command: 'morgen' },
		{ keywords: ['kategorien', 'categories', 'themen'], command: 'kategorien' },
		{ keywords: ['favoriten', 'favorites', 'meine favoriten'], command: 'favoriten' },
		{ keywords: ['listen', 'lists', 'meine listen'], command: 'listen' },
	]);

	constructor(
		configService: ConfigService,
		private quotesService: QuotesService,
		private zitareService: ZitareService,
		private sessionService: SessionService,
		private transcriptionService: TranscriptionService,
		private creditService: CreditService
	) {
		super(configService);
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

	protected getIntroductionMessage(): string {
		const dailyQuote = this.quotesService.getDailyQuote();

		return `**Zitare Bot - Taegliche Inspiration**

Ich bringe dir jeden Tag neue Inspiration!

**Zitat des Tages:**
${this.quotesService.formatQuote(dailyQuote)}

Sag "hilfe" fuer alle Befehle!`;
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		body: string
	): Promise<void> {
		const sender = event.sender;

		this.logger.log(`Message from ${sender} in ${roomId}: ${body.substring(0, 50)}...`);

		// Handle commands with ! prefix
		if (body.startsWith('!')) {
			await this.handleCommand(roomId, sender, body);
			return;
		}

		// Check for natural language keywords
		const keywordCommand = this.keywordDetector.detect(body);
		if (keywordCommand) {
			await this.handleCommand(roomId, sender, `!${keywordCommand}`);
			return;
		}

		// Don't respond to random messages
	}

	protected async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		const content = event.content;
		if (!content?.url) {
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
			await this.sendMessage(roomId, 'Transkribiere Sprachnotiz...');
			const transcription = await this.transcriptionService.transcribe(audioBuffer);

			if (!transcription || transcription.trim().length === 0) {
				await this.sendMessage(roomId, 'Konnte keine Sprache erkennen.');
				return;
			}

			this.logger.log(`Transcription: ${transcription}`);
			await this.sendMessage(roomId, `"${transcription}"`);

			// Check for commands in transcription
			const cleanText = transcription.trim();

			// Check for keyword commands in the transcription
			const keywordCommand = this.keywordDetector.detect(cleanText);
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
				await this.sessionService.logout(sender);
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
					`Unbekannter Befehl: !${command}\n\nSag "hilfe" fuer alle Befehle.`
				);
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
			await this.sendMessage(
				roomId,
				'**Verwendung:** `!suche [text]`\n\nBeispiel: `!suche Glueck`'
			);
			return;
		}

		const results = this.quotesService.searchQuotes(searchText);

		if (results.length === 0) {
			await this.sendMessage(roomId, `Keine Zitate gefunden fuer: "${searchText}"`);
			return;
		}

		let text = `**Suchergebnisse fuer "${searchText}" (${results.length}):**\n\n`;

		const maxResults = Math.min(results.length, 5);
		for (let i = 0; i < maxResults; i++) {
			const quote = results[i];
			text += `**${i + 1}.** "${quote.text.substring(0, 80)}${quote.text.length > 80 ? '...' : ''}"\n-- *${quote.author}*\n\n`;
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
				`Kategorie "${categoryName}" nicht gefunden.\n\nNutze \`!kategorien\` fuer alle Kategorien.`
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

		let text = `**Verfuegbare Kategorien:**\n\n`;
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

		await this.sendMessage(roomId, 'Anmeldung laeuft...');

		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			const token = await this.sessionService.getToken(sender);
			if (token) {
				const balance = await this.creditService.getBalance(token);
				await this.sendMessage(
					roomId,
					`✅ Erfolgreich angemeldet!\n⚡ Credits: ${balance.balance.toFixed(2)}\n\nDu kannst jetzt Favoriten speichern und Listen verwalten.`
				);
			} else {
				await this.sendMessage(
					roomId,
					`Erfolgreich angemeldet!\n\nDu kannst jetzt Favoriten speichern und Listen verwalten.`
				);
			}
		} else {
			await this.sendMessage(roomId, `Anmeldung fehlgeschlagen: ${result.error}`);
		}
	}

	private async handleAddFavorite(roomId: string, sender: string) {
		const token = await this.sessionService.getToken(sender);
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
				`Zu Favoriten hinzugefuegt!\n\n"${quote?.text.substring(0, 50)}..."`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleFavorites(roomId: string, sender: string) {
		const token = await this.sessionService.getToken(sender);
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
					text += `**${i + 1}.** "${quote.text.substring(0, 60)}${quote.text.length > 60 ? '...' : ''}"\n-- *${quote.author}*\n\n`;
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
		const token = await this.sessionService.getToken(sender);
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
		const token = await this.sessionService.getToken(sender);
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
				`Liste "${list.name}" erstellt!\n\nNutze \`!addliste 1 [zitat-id]\` um Zitate hinzuzufuegen.`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleAddToList(roomId: string, sender: string, args: string[]) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendMessage(roomId, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 1) {
			await this.sendMessage(
				roomId,
				`**Verwendung:** \`!addliste [listen-nr]\`\n\nFuegt das letzte angezeigte Zitat zur Liste hinzu.`
			);
			return;
		}

		const listIndex = parseInt(args[0], 10);
		if (isNaN(listIndex) || listIndex < 1) {
			await this.sendMessage(roomId, `Ungueltige Listennummer.`);
			return;
		}

		const lastQuoteId = this.lastQuotes.get(sender);
		if (!lastQuoteId) {
			await this.sendMessage(
				roomId,
				`Kein Zitat zum Hinzufuegen. Lass dir erst ein Zitat anzeigen.`
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
				`Zitat zu "${list.name}" hinzugefuegt!\n\n"${quote?.text.substring(0, 50)}..."`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendMessage(roomId, `Fehler: ${errorMsg}`);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendHealthy = await this.zitareService.checkHealth();
		const isLoggedIn = await this.sessionService.isLoggedIn(sender);
		const sessionCount = this.sessionService.getSessionCount();
		const totalQuotes = this.quotesService.getTotalCount();
		const session = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let statusText = `**Zitare Bot Status**\n\n`;
		statusText += `**Backend:** ${backendHealthy ? 'Online' : 'Offline'}\n`;
		statusText += `**Dein Status:** ${isLoggedIn ? 'Angemeldet' : 'Nicht angemeldet'}\n`;

		if (isLoggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			statusText += `**👤 Angemeldet als:** ${session.email}\n`;
			statusText += `**⚡ Credits:** ${balance.balance.toFixed(2)}\n`;
		}

		statusText += `**Aktive Sessions:** ${sessionCount}\n`;
		statusText += `**Verfuegbare Zitate:** ${totalQuotes}\n`;
		statusText += `\n${!isLoggedIn ? 'Nutze `!login email passwort` um dich anzumelden.' : ''}`;

		await this.sendMessage(roomId, statusText);
	}

	private async pinHelpMessage(roomId: string) {
		try {
			const eventId = await this.sendMessage(roomId, HELP_MESSAGE);

			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [eventId],
			});

			this.logger.log(`Pinned help message in room ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to pin help message:`, error);
			await this.sendMessage(roomId, 'Fehler beim Pinnen der Hilfe.');
		}
	}
}
