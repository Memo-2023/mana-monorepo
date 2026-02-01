import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	UserListMapper,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { ManadeckService, Deck, Card } from '../manadeck/manadeck.service';
import { SessionService } from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';

@Injectable()
export class MatrixService extends BaseMatrixService {
	// Store last shown decks/cards per user for reference by number
	private decksMapper = new UserListMapper<Deck>();
	private cardsMapper = new UserListMapper<Card>();
	private currentDeckId: Map<string, string> = new Map();

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['decks', 'meine decks', 'kartendecks', 'liste'], command: 'decks' },
		{ keywords: ['karten', 'cards', 'meine karten'], command: 'karten' },
		{ keywords: ['lernen', 'study', 'ueben', 'wiederholen'], command: 'lernen' },
		{ keywords: ['faellig', 'due', 'anstehend', 'zu lernen'], command: 'faellig' },
		{ keywords: ['mana', 'credits', 'guthaben', 'punkte'], command: 'mana' },
		{ keywords: ['stats', 'statistik', 'fortschritt', 'statistiken'], command: 'stats' },
		{ keywords: ['generieren', 'generate', 'erstellen', 'ai'], command: 'generate' },
		{ keywords: ['featured', 'empfohlen', 'beliebte decks'], command: 'featured' },
		{ keywords: ['rangliste', 'leaderboard', 'bestenliste'], command: 'leaderboard' },
	]);

	constructor(
		configService: ConfigService,
		private manadeckService: ManadeckService,
		private sessionService: SessionService
	) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl: this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath: this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected async handleTextMessage(
		roomId: string,
		_event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		// Check for keyword commands first
		const keywordCommand = this.keywordDetector.detect(message);
		if (keywordCommand) {
			message = `!${keywordCommand}`;
		}

		if (!message.startsWith('!')) return;

		const parts = message.slice(1).split(/\s+/);
		const command = parts[0].toLowerCase();
		const args = parts.slice(1);
		const argString = args.join(' ');

		try {
			switch (command) {
				case 'help':
				case 'hilfe':
					await this.sendHtml(roomId, HELP_MESSAGE);
					break;

				case 'login':
					await this.handleLogin(roomId, sender, args);
					break;

				case 'logout':
					this.sessionService.logout(sender);
					await this.sendHtml(roomId, '<p>Erfolgreich abgemeldet.</p>');
					break;

				case 'status':
					await this.handleStatus(roomId, sender);
					break;

				case 'decks':
				case 'liste':
					await this.handleListDecks(roomId, sender);
					break;

				case 'deck':
				case 'details':
					await this.handleDeckDetails(roomId, sender, args[0]);
					break;

				case 'neu':
				case 'new':
				case 'create':
					await this.handleCreateDeck(roomId, sender, argString);
					break;

				case 'loeschen':
				case 'delete':
					await this.handleDeleteDeck(roomId, sender, args[0]);
					break;

				case 'karten':
				case 'cards':
					await this.handleListCards(roomId, sender, args[0]);
					break;

				case 'karte':
				case 'card':
					await this.handleCardDetails(roomId, sender, args[0], args[1]);
					break;

				case 'generate':
				case 'gen':
				case 'generieren':
					await this.handleGenerate(roomId, sender, argString);
					break;

				case 'lernen':
				case 'study':
					await this.handleStartStudy(roomId, sender, args[0]);
					break;

				case 'faellig':
				case 'due':
					await this.handleDueCards(roomId, sender);
					break;

				case 'stats':
				case 'statistik':
					await this.handleStats(roomId, sender);
					break;

				case 'mana':
				case 'credits':
				case 'guthaben':
					await this.handleCredits(roomId, sender);
					break;

				case 'featured':
				case 'empfohlen':
					await this.handleFeatured(roomId);
					break;

				case 'leaderboard':
				case 'rangliste':
					await this.handleLeaderboard(roomId);
					break;

				default:
					await this.sendHtml(
						roomId,
						`<p>Unbekannter Befehl: <code>${command}</code>. Nutze <code>!help</code> fuer Hilfe.</p>`
					);
			}
		} catch (error) {
			this.logger.error(`Error handling command ${command}:`, error);
			await this.sendHtml(roomId, `<p>Fehler: ${(error as Error).message}</p>`);
		}
	}

	private async sendHtml(roomId: string, html: string) {
		await this.client.sendMessage(roomId, {
			msgtype: 'm.text',
			body: html.replace(/<[^>]*>/g, ''),
			format: 'org.matrix.custom.html',
			formatted_body: html,
		});
	}

	private requireAuth(sender: string): string {
		const token = this.sessionService.getToken(sender);
		if (!token) {
			throw new Error('Nicht angemeldet. Nutze <code>!login email passwort</code>');
		}
		return token;
	}

	// Auth handlers
	private async handleLogin(roomId: string, sender: string, args: string[]) {
		if (args.length < 2) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!login email passwort</code></p>');
			return;
		}

		const [email, password] = args;
		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			await this.sendHtml(roomId, `<p>Erfolgreich angemeldet als <strong>${email}</strong></p>`);
		} else {
			await this.sendHtml(roomId, `<p>Login fehlgeschlagen: ${result.error}</p>`);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const backendOk = await this.manadeckService.checkHealth();
		const loggedIn = this.sessionService.isLoggedIn(sender);
		const sessions = this.sessionService.getSessionCount();

		await this.sendHtml(
			roomId,
			`<h3>ManaDeck Bot Status</h3>
<ul>
<li>Backend: ${backendOk ? 'Online' : 'Offline'}</li>
<li>Angemeldet: ${loggedIn ? 'Ja' : 'Nein'}</li>
<li>Aktive Sessions: ${sessions}</li>
</ul>`
		);
	}

	// Deck handlers
	private async handleListDecks(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.manadeckService.getDecks(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const decks = result.data || [];
		this.decksMapper.setList(sender, decks);

		if (decks.length === 0) {
			await this.sendHtml(
				roomId,
				'<p>Keine Decks vorhanden. Erstelle eines mit <code>!neu Titel</code></p>'
			);
			return;
		}

		let html = '<h3>Deine Decks</h3><ol>';
		for (const deck of decks) {
			const cardInfo = deck.cardCount !== undefined ? ` (${deck.cardCount} Karten)` : '';
			const tags = deck.tags?.length ? ` [${deck.tags.join(', ')}]` : '';
			html += `<li><strong>${deck.title}</strong>${cardInfo}${tags}</li>`;
		}
		html += '</ol>';
		html += '<p><em>Nutze <code>!deck [nr]</code> fuer Details</em></p>';

		await this.sendHtml(roomId, html);
	}

	private async handleDeckDetails(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!decks</code></p>'
			);
			return;
		}

		const result = await this.manadeckService.getDeck(token, deck.id);
		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const d = result.data!;
		let html = `<h3>${d.title}</h3>`;
		if (d.description) html += `<p>${d.description}</p>`;
		html += '<ul>';
		html += `<li>Karten: ${d.cardCount || 0}</li>`;
		html += `<li>Oeffentlich: ${d.isPublic ? 'Ja' : 'Nein'}</li>`;
		if (d.tags?.length) html += `<li>Tags: ${d.tags.join(', ')}</li>`;
		html += `<li>Erstellt: ${new Date(d.createdAt).toLocaleDateString('de-DE')}</li>`;
		html += '</ul>';
		html += `<p><em>Nutze <code>!karten ${numberStr}</code> um Karten zu sehen</em></p>`;

		await this.sendHtml(roomId, html);
	}

	private async handleCreateDeck(roomId: string, sender: string, title: string) {
		if (!title) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!neu Titel [Beschreibung]</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const parts = title.split('|').map((s) => s.trim());
		const deckTitle = parts[0];
		const description = parts[1];

		const result = await this.manadeckService.createDeck(token, deckTitle, description);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(
			roomId,
			`<p>Deck <strong>${result.data!.title}</strong> erstellt! (10 Mana verbraucht)</p>`
		);
	}

	private async handleDeleteDeck(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!decks</code></p>'
			);
			return;
		}

		const result = await this.manadeckService.deleteDeck(token, deck.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		// Clear cached list
		this.decksMapper.clearList(sender);
		await this.sendHtml(roomId, `<p>Deck <strong>${deck.title}</strong> geloescht.</p>`);
	}

	// Card handlers
	private async handleListCards(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!decks</code></p>'
			);
			return;
		}

		const result = await this.manadeckService.getCards(token, deck.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const cards = result.data || [];
		this.cardsMapper.setList(sender, cards);
		this.currentDeckId.set(sender, deck.id);

		if (cards.length === 0) {
			await this.sendHtml(
				roomId,
				`<p>Keine Karten in <strong>${deck.title}</strong>.</p>`
			);
			return;
		}

		let html = `<h3>Karten in "${deck.title}"</h3><ol>`;
		for (const card of cards) {
			const title = card.title || this.getCardPreview(card);
			const fav = card.isFavorite ? ' &#11088;' : '';
			html += `<li><strong>${card.cardType}</strong>: ${title}${fav}</li>`;
		}
		html += '</ol>';
		html += `<p><em>Nutze <code>!karte ${numberStr} [nr]</code> fuer Details</em></p>`;

		await this.sendHtml(roomId, html);
	}

	private async handleCardDetails(
		roomId: string,
		sender: string,
		deckNumStr: string,
		cardNumStr: string
	) {
		const token = this.requireAuth(sender);
		const deck = this.decksMapper.getByNumber(sender, parseInt(deckNumStr, 10));

		if (!deck) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Deck-Nummer. Nutze zuerst <code>!decks</code></p>'
			);
			return;
		}

		// Refresh cards if needed
		const cachedDeckId = this.currentDeckId.get(sender);
		if (!cachedDeckId || cachedDeckId !== deck.id || !this.cardsMapper.hasList(sender)) {
			const result = await this.manadeckService.getCards(token, deck.id);
			if (result.error) {
				await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
				return;
			}
			this.cardsMapper.setList(sender, result.data || []);
			this.currentDeckId.set(sender, deck.id);
		}

		const cardNum = parseInt(cardNumStr, 10);
		const card = this.cardsMapper.getByNumber(sender, cardNum);
		if (!card) {
			await this.sendHtml(
				roomId,
				`<p>Ungueltige Kartennummer. Nutze <code>!karten ${deckNumStr}</code></p>`
			);
			return;
		}
		let html = `<h3>Karte #${cardNumStr}</h3>`;
		html += `<p><strong>Typ:</strong> ${card.cardType}</p>`;

		switch (card.cardType) {
			case 'flashcard':
				html += `<p><strong>Vorderseite:</strong> ${card.content.front}</p>`;
				html += `<p><strong>Rueckseite:</strong> ${card.content.back}</p>`;
				if (card.content.hint) html += `<p><strong>Hinweis:</strong> ${card.content.hint}</p>`;
				break;
			case 'quiz':
				html += `<p><strong>Frage:</strong> ${card.content.question}</p>`;
				html += '<p><strong>Optionen:</strong></p><ol>';
				for (const opt of card.content.options || []) {
					html += `<li>${opt}</li>`;
				}
				html += '</ol>';
				html += `<p><strong>Richtig:</strong> Option ${(card.content.correctAnswer || 0) + 1}</p>`;
				break;
			case 'text':
				html += `<p>${card.content.text}</p>`;
				break;
			default:
				html += `<pre>${JSON.stringify(card.content, null, 2)}</pre>`;
		}

		await this.sendHtml(roomId, html);
	}

	// AI generation
	private async handleGenerate(roomId: string, sender: string, argString: string) {
		const token = this.requireAuth(sender);

		// Parse options from argString
		const options: any = {};
		let prompt = argString;

		// Extract --count N
		const countMatch = prompt.match(/--count\s+(\d+)/i);
		if (countMatch) {
			options.cardCount = Math.min(50, Math.max(1, parseInt(countMatch[1], 10)));
			prompt = prompt.replace(countMatch[0], '').trim();
		}

		// Extract --type TYPE
		const typeMatch = prompt.match(/--type\s+(flashcard|quiz|text|mixed)/i);
		if (typeMatch) {
			options.cardTypes = [typeMatch[1].toLowerCase()];
			prompt = prompt.replace(typeMatch[0], '').trim();
		}

		// Extract --difficulty LEVEL
		const diffMatch = prompt.match(/--difficulty\s+(beginner|intermediate|advanced)/i);
		if (diffMatch) {
			options.difficulty = diffMatch[1].toLowerCase();
			prompt = prompt.replace(diffMatch[0], '').trim();
		}

		if (!prompt) {
			await this.sendHtml(
				roomId,
				'<p>Verwendung: <code>!generate Thema [--count 10] [--type flashcard] [--difficulty intermediate]</code></p>'
			);
			return;
		}

		await this.sendHtml(roomId, '<p>Generiere Deck mit AI... (30 Mana)</p>');

		const result = await this.manadeckService.generateDeck(token, prompt, options);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const { deck, cards } = result.data!;
		await this.sendHtml(
			roomId,
			`<p>Deck <strong>${deck.title}</strong> mit ${cards.length} Karten erstellt!</p>
<p><em>Nutze <code>!decks</code> um deine Decks zu sehen.</em></p>`
		);
	}

	// Study
	private async handleStartStudy(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(
				roomId,
				'<p>Ungueltige Nummer. Nutze zuerst <code>!decks</code></p>'
			);
			return;
		}

		const result = await this.manadeckService.startStudySession(token, deck.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const session = result.data!;
		await this.sendHtml(
			roomId,
			`<p>Lernsession fuer <strong>${deck.title}</strong> gestartet!</p>
<p>${session.totalCards} Karten zu lernen.</p>
<p><em>Oeffne die ManaDeck App um mit dem Lernen zu beginnen.</em></p>`
		);
	}

	private async handleDueCards(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.manadeckService.getDueCards(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const dueCards = result.data || [];

		if (dueCards.length === 0) {
			await this.sendHtml(roomId, '<p>Keine faelligen Karten! Gut gemacht!</p>');
			return;
		}

		await this.sendHtml(
			roomId,
			`<p><strong>${dueCards.length}</strong> Karten sind faellig.</p>
<p><em>Oeffne die ManaDeck App um sie zu wiederholen.</em></p>`
		);
	}

	// Stats
	private async handleStats(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.manadeckService.getStats(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const stats = result.data!;
		await this.sendHtml(
			roomId,
			`<h3>Deine Statistiken</h3>
<ul>
<li>Decks: ${stats.totalDecks || 0}</li>
<li>Karten: ${stats.totalCards || 0}</li>
<li>Sessions: ${stats.totalSessions || 0}</li>
<li>Streak: ${stats.streakDays || 0} Tage</li>
<li>Genauigkeit: ${stats.averageAccuracy?.toFixed(1) || 0}%</li>
</ul>`
		);
	}

	private async handleCredits(roomId: string, sender: string) {
		const token = this.requireAuth(sender);
		const result = await this.manadeckService.getCredits(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(
			roomId,
			`<p>Dein Mana-Guthaben: <strong>${result.data!.balance}</strong></p>
<p><em>Kosten: Deck erstellen (10), AI-Generierung (30)</em></p>`
		);
	}

	// Public endpoints
	private async handleFeatured(roomId: string) {
		const result = await this.manadeckService.getFeaturedDecks();

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const decks = result.data || [];

		if (decks.length === 0) {
			await this.sendHtml(roomId, '<p>Keine empfohlenen Decks verfuegbar.</p>');
			return;
		}

		let html = '<h3>Empfohlene Decks</h3><ol>';
		for (const deck of decks) {
			const cardInfo = deck.cardCount !== undefined ? ` (${deck.cardCount} Karten)` : '';
			html += `<li><strong>${deck.title}</strong>${cardInfo}</li>`;
		}
		html += '</ol>';

		await this.sendHtml(roomId, html);
	}

	private async handleLeaderboard(roomId: string) {
		const result = await this.manadeckService.getLeaderboard(10);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const users = result.data || [];

		if (users.length === 0) {
			await this.sendHtml(roomId, '<p>Noch keine Eintraege in der Rangliste.</p>');
			return;
		}

		let html = '<h3>Rangliste (Top 10)</h3><ol>';
		for (const user of users) {
			html += `<li>${user.totalWins || 0} Siege - ${user.streakDays || 0} Tage Streak</li>`;
		}
		html += '</ol>';

		await this.sendHtml(roomId, html);
	}

	// Helper methods
	private getDeckByNumber(sender: string, numberStr: string): Deck | null {
		const num = parseInt(numberStr, 10);
		if (isNaN(num)) return null;
		return this.decksMapper.getByNumber(sender, num);
	}

	private getCardPreview(card: Card): string {
		if (card.content.front) return card.content.front.substring(0, 50);
		if (card.content.question) return card.content.question.substring(0, 50);
		if (card.content.text) return card.content.text.substring(0, 50);
		return '(keine Vorschau)';
	}
}
