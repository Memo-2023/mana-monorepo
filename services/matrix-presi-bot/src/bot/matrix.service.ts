import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
} from 'matrix-bot-sdk';
import { PresiService, Deck, Theme, SlideContent } from '../presi/presi.service';
import { SessionService } from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';

@Injectable()
export class MatrixService implements OnModuleInit {
	private readonly logger = new Logger(MatrixService.name);
	private client: MatrixClient;
	private allowedRooms: string[];

	// Store last shown items per user for reference by number
	private lastDecksList: Map<string, Deck[]> = new Map();
	private lastThemesList: Map<string, Theme[]> = new Map();

	constructor(
		private configService: ConfigService,
		private presiService: PresiService,
		private sessionService: SessionService
	) {}

	async onModuleInit() {
		const homeserverUrl = this.configService.get<string>('matrix.homeserverUrl');
		const accessToken = this.configService.get<string>('matrix.accessToken');
		const storagePath = this.configService.get<string>('matrix.storagePath');
		this.allowedRooms = this.configService.get<string[]>('matrix.allowedRooms') || [];

		if (!accessToken) {
			this.logger.warn('No Matrix access token configured, bot disabled');
			return;
		}

		const storage = new SimpleFsStorageProvider(storagePath || './data/bot-storage.json');
		this.client = new MatrixClient(homeserverUrl || 'http://localhost:8008', accessToken, storage);

		AutojoinRoomsMixin.setupOnClient(this.client);

		this.client.on('room.message', this.handleMessage.bind(this));

		await this.client.start();
		this.logger.log('Matrix Presi Bot started');
	}

	private async handleMessage(roomId: string, event: any) {
		if (event.sender === (await this.client.getUserId())) return;
		if (event.content?.msgtype !== 'm.text') return;

		const body = event.content.body?.trim();
		if (!body?.startsWith('!')) return;

		if (this.allowedRooms.length > 0 && !this.allowedRooms.includes(roomId)) {
			return;
		}

		const sender = event.sender;
		const parts = body.slice(1).split(/\s+/);
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

				// Deck commands
				case 'presis':
				case 'decks':
				case 'liste':
					await this.handleListDecks(roomId, sender);
					break;

				case 'presi':
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

				case 'umbenennen':
				case 'rename':
					await this.handleRenameDeck(roomId, sender, args[0], args.slice(1).join(' '));
					break;

				// Slide commands
				case 'folie':
				case 'slide':
					await this.handleAddSlide(roomId, sender, args);
					break;

				case 'folieloeschen':
				case 'deleteslide':
					await this.handleDeleteSlide(roomId, sender, args[0], args[1]);
					break;

				// Theme commands
				case 'themes':
				case 'designs':
					await this.handleListThemes(roomId, sender);
					break;

				case 'theme':
				case 'design':
					await this.handleApplyTheme(roomId, sender, args[0], args[1]);
					break;

				// Share commands
				case 'teilen':
				case 'share':
					await this.handleShareDeck(roomId, sender, argString);
					break;

				case 'links':
				case 'shares':
					await this.handleListShares(roomId, sender, args[0]);
					break;

				default:
					await this.sendHtml(
						roomId,
						`<p>Unbekannter Befehl: <code>${command}</code>. Nutze <code>!help</code> fuer Hilfe.</p>`
					);
			}
		} catch (error) {
			this.logger.error(`Error handling command ${command}:`, error);
			await this.sendHtml(roomId, `<p>Fehler: ${error.message}</p>`);
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
		const backendOk = await this.presiService.checkHealth();
		const loggedIn = this.sessionService.isLoggedIn(sender);
		const sessions = this.sessionService.getSessionCount();

		await this.sendHtml(
			roomId,
			`<h3>Presi Bot Status</h3>
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
		const result = await this.presiService.getDecks(token);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const decks = result.data || [];
		this.lastDecksList.set(sender, decks);

		if (decks.length === 0) {
			await this.sendHtml(
				roomId,
				'<p>Keine Praesentationen vorhanden. Erstelle eine mit <code>!neu Titel</code></p>'
			);
			return;
		}

		let html = '<h3>Deine Praesentationen</h3><ol>';
		for (const deck of decks) {
			const theme = deck.theme ? ` [${deck.theme.name}]` : '';
			const pub = deck.isPublic ? ' &#127760;' : '';
			html += `<li><strong>${deck.title}</strong>${theme}${pub}</li>`;
		}
		html += '</ol>';
		html += '<p><em>Nutze <code>!presi [nr]</code> fuer Details</em></p>';

		await this.sendHtml(roomId, html);
	}

	private async handleDeckDetails(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!presis</code></p>');
			return;
		}

		const result = await this.presiService.getDeck(token, deck.id);
		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const d = result.data!;
		let html = `<h3>${d.title}</h3>`;
		if (d.description) html += `<p><em>${d.description}</em></p>`;

		html += '<ul>';
		if (d.theme) html += `<li>Theme: ${d.theme.name}</li>`;
		html += `<li>Oeffentlich: ${d.isPublic ? 'Ja' : 'Nein'}</li>`;
		html += `<li>Folien: ${d.slides?.length || 0}</li>`;
		html += `<li>Erstellt: ${new Date(d.createdAt).toLocaleDateString('de-DE')}</li>`;
		html += '</ul>';

		if (d.slides && d.slides.length > 0) {
			html += '<p><strong>Folien:</strong></p><ol>';
			for (const slide of d.slides) {
				const title = slide.content.title || slide.content.body?.substring(0, 30) || `(${slide.content.type})`;
				html += `<li>${title}</li>`;
			}
			html += '</ol>';
		}

		html += `<p><em>Nutze <code>!folie ${numberStr} typ Inhalt</code> um Folien hinzuzufuegen</em></p>`;

		await this.sendHtml(roomId, html);
	}

	private async handleCreateDeck(roomId: string, sender: string, input: string) {
		if (!input) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!neu Titel | Beschreibung</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const parts = input.split('|').map((s) => s.trim());
		const title = parts[0];
		const description = parts[1];

		const result = await this.presiService.createDeck(token, title, description);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.lastDecksList.delete(sender);
		await this.sendHtml(
			roomId,
			`<p>Praesentation <strong>${result.data!.title}</strong> erstellt!</p>
<p><em>Nutze <code>!presis</code> und dann <code>!folie [nr] typ Inhalt</code></em></p>`
		);
	}

	private async handleDeleteDeck(roomId: string, sender: string, numberStr: string) {
		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!presis</code></p>');
			return;
		}

		const result = await this.presiService.deleteDeck(token, deck.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		this.lastDecksList.delete(sender);
		await this.sendHtml(roomId, `<p>Praesentation <strong>${deck.title}</strong> geloescht.</p>`);
	}

	private async handleRenameDeck(roomId: string, sender: string, numberStr: string, newTitle: string) {
		if (!newTitle) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!umbenennen [nr] Neuer Titel</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!presis</code></p>');
			return;
		}

		const result = await this.presiService.updateDeck(token, deck.id, { title: newTitle });

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(
			roomId,
			`<p><strong>${deck.title}</strong> umbenannt zu <strong>${newTitle}</strong></p>`
		);
	}

	// Slide handlers
	private async handleAddSlide(roomId: string, sender: string, args: string[]) {
		if (args.length < 2) {
			await this.sendHtml(
				roomId,
				`<p>Verwendung:</p>
<ul>
<li><code>!folie [nr] titel Titel | Untertitel</code></li>
<li><code>!folie [nr] text Titel | Inhalt</code></li>
<li><code>!folie [nr] punkte Titel | Punkt1, Punkt2</code></li>
</ul>`
			);
			return;
		}

		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, args[0]);

		if (!deck) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!presis</code></p>');
			return;
		}

		const slideType = args[1].toLowerCase();
		const contentStr = args.slice(2).join(' ');
		const contentParts = contentStr.split('|').map((s) => s.trim());

		let content: SlideContent;

		switch (slideType) {
			case 'titel':
			case 'title':
				content = {
					type: 'title',
					title: contentParts[0] || 'Titel',
					subtitle: contentParts[1],
				};
				break;

			case 'text':
			case 'content':
			case 'inhalt':
				content = {
					type: 'content',
					title: contentParts[0] || 'Inhalt',
					body: contentParts[1] || '',
				};
				break;

			case 'punkte':
			case 'bullets':
			case 'liste':
				const bullets = contentParts[1]?.split(',').map((s) => s.trim()) || [];
				content = {
					type: 'content',
					title: contentParts[0] || 'Punkte',
					bulletPoints: bullets,
				};
				break;

			case 'bild':
			case 'image':
				content = {
					type: 'image',
					title: contentParts[0],
					imageUrl: contentParts[1],
				};
				break;

			default:
				await this.sendHtml(
					roomId,
					'<p>Unbekannter Folien-Typ. Verfuegbar: titel, text, punkte, bild</p>'
				);
				return;
		}

		const result = await this.presiService.addSlide(token, deck.id, content);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(
			roomId,
			`<p>Folie zu <strong>${deck.title}</strong> hinzugefuegt (Position ${result.data!.order + 1})</p>`
		);
	}

	private async handleDeleteSlide(roomId: string, sender: string, deckNumStr: string, slideNumStr: string) {
		if (!deckNumStr || !slideNumStr) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!folieloeschen [presi-nr] [folien-nr]</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, deckNumStr);

		if (!deck) {
			await this.sendHtml(roomId, '<p>Ungueltige Praesentation-Nummer.</p>');
			return;
		}

		// Get deck with slides
		const deckResult = await this.presiService.getDeck(token, deck.id);
		if (deckResult.error || !deckResult.data?.slides) {
			await this.sendHtml(roomId, `<p>Fehler: ${deckResult.error || 'Keine Folien'}</p>`);
			return;
		}

		const slideIndex = parseInt(slideNumStr, 10) - 1;
		if (isNaN(slideIndex) || slideIndex < 0 || slideIndex >= deckResult.data.slides.length) {
			await this.sendHtml(roomId, '<p>Ungueltige Folien-Nummer.</p>');
			return;
		}

		const slide = deckResult.data.slides[slideIndex];
		const result = await this.presiService.deleteSlide(token, slide.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(roomId, `<p>Folie ${slideNumStr} aus <strong>${deck.title}</strong> geloescht.</p>`);
	}

	// Theme handlers
	private async handleListThemes(roomId: string, sender: string) {
		const result = await this.presiService.getThemes();

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const themes = result.data || [];
		this.lastThemesList.set(sender, themes);

		if (themes.length === 0) {
			await this.sendHtml(roomId, '<p>Keine Themes verfuegbar.</p>');
			return;
		}

		let html = '<h3>Verfuegbare Themes</h3><ol>';
		for (const theme of themes) {
			const def = theme.isDefault ? ' (Standard)' : '';
			html += `<li><strong>${theme.name}</strong>${def}</li>`;
		}
		html += '</ol>';
		html += '<p><em>Nutze <code>!theme [presi-nr] [theme-nr]</code></em></p>';

		await this.sendHtml(roomId, html);
	}

	private async handleApplyTheme(roomId: string, sender: string, deckNumStr: string, themeNumStr: string) {
		if (!deckNumStr || !themeNumStr) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!theme [presi-nr] [theme-nr]</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, deckNumStr);
		const theme = this.getThemeByNumber(sender, themeNumStr);

		if (!deck) {
			await this.sendHtml(roomId, '<p>Ungueltige Praesentation-Nummer.</p>');
			return;
		}

		if (!theme) {
			await this.sendHtml(roomId, '<p>Ungueltige Theme-Nummer. Nutze zuerst <code>!themes</code></p>');
			return;
		}

		const result = await this.presiService.updateDeck(token, deck.id, { themeId: theme.id });

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		await this.sendHtml(
			roomId,
			`<p>Theme <strong>${theme.name}</strong> auf <strong>${deck.title}</strong> angewendet.</p>`
		);
	}

	// Share handlers
	private async handleShareDeck(roomId: string, sender: string, argString: string) {
		const args = argString.split(/\s+/);
		const numberStr = args[0];

		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!presis</code></p>');
			return;
		}

		let expiresAt: string | undefined;

		// Parse --tage N
		const daysMatch = argString.match(/--tage\s+(\d+)/i);
		if (daysMatch) {
			const days = parseInt(daysMatch[1], 10);
			const expDate = new Date();
			expDate.setDate(expDate.getDate() + days);
			expiresAt = expDate.toISOString();
		}

		const result = await this.presiService.createShareLink(token, deck.id, expiresAt);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const shareUrl = this.presiService.getShareUrl(result.data!.shareCode);
		let html = `<p><strong>${deck.title}</strong> wird geteilt:</p>`;
		html += `<p><a href="${shareUrl}">${shareUrl}</a></p>`;
		if (result.data!.expiresAt) {
			html += `<p><em>Gueltig bis: ${new Date(result.data!.expiresAt).toLocaleDateString('de-DE')}</em></p>`;
		}

		await this.sendHtml(roomId, html);
	}

	private async handleListShares(roomId: string, sender: string, numberStr: string) {
		if (!numberStr) {
			await this.sendHtml(roomId, '<p>Verwendung: <code>!links [presi-nr]</code></p>');
			return;
		}

		const token = this.requireAuth(sender);
		const deck = this.getDeckByNumber(sender, numberStr);

		if (!deck) {
			await this.sendHtml(roomId, '<p>Ungueltige Nummer. Nutze zuerst <code>!presis</code></p>');
			return;
		}

		const result = await this.presiService.getShareLinks(token, deck.id);

		if (result.error) {
			await this.sendHtml(roomId, `<p>Fehler: ${result.error}</p>`);
			return;
		}

		const links = result.data || [];

		if (links.length === 0) {
			await this.sendHtml(
				roomId,
				`<p>Keine Share-Links fuer <strong>${deck.title}</strong>. Nutze <code>!teilen ${numberStr}</code></p>`
			);
			return;
		}

		let html = `<h3>Share-Links: ${deck.title}</h3><ol>`;
		for (const link of links) {
			const expires = link.expiresAt
				? ` (bis ${new Date(link.expiresAt).toLocaleDateString('de-DE')})`
				: ' (unbegrenzt)';
			const url = this.presiService.getShareUrl(link.shareCode);
			html += `<li><a href="${url}">${link.shareCode}</a>${expires}</li>`;
		}
		html += '</ol>';

		await this.sendHtml(roomId, html);
	}

	// Helper methods
	private getDeckByNumber(sender: string, numberStr: string): Deck | null {
		const decks = this.lastDecksList.get(sender);
		if (!decks) return null;

		const index = parseInt(numberStr, 10) - 1;
		if (isNaN(index) || index < 0 || index >= decks.length) return null;

		return decks[index];
	}

	private getThemeByNumber(sender: string, numberStr: string): Theme | null {
		const themes = this.lastThemesList.get(sender);
		if (!themes) return null;

		const index = parseInt(numberStr, 10) - 1;
		if (isNaN(index) || index < 0 || index >= themes.length) return null;

		return themes[index];
	}
}
