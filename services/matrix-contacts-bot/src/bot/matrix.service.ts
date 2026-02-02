import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
	UserListMapper,
} from '@manacore/matrix-bot-common';
import { ContactsService, Contact } from '../contacts/contacts.service';
import { SessionService, TranscriptionService, CreditService } from '@manacore/bot-services';
import { HELP_MESSAGE } from '../config/configuration';

const CONTACT_CREATE_CREDITS = 0.02;

// Natural language keyword detector
const keywordDetector = new KeywordCommandDetector([
	...COMMON_KEYWORDS,
	{ keywords: ['kontakte', 'contacts', 'alle'], command: 'kontakte' },
	{ keywords: ['favoriten', 'favorites', 'favs'], command: 'favoriten' },
	{ keywords: ['suche', 'search', 'finde'], command: 'suche' },
]);

@Injectable()
export class MatrixService extends BaseMatrixService {
	// User list mapper for number-based reference
	private contactsMapper = new UserListMapper<Contact>();

	constructor(
		configService: ConfigService,
		private readonly transcriptionService: TranscriptionService,
		private contactsService: ContactsService,
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
				await this.sendReply(roomId, event, '❌ Sprachnachricht konnte nicht erkannt werden.');
				return;
			}

			await this.sendMessage(roomId, `🎤 *"${text}"*`);
			await this.handleTextMessage(roomId, event, text, sender);
		} catch (error) {
			this.logger.error(`Audio transcription error: ${error}`);
			await this.sendReply(roomId, event, '❌ Fehler bei der Spracherkennung.');
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
		return `**Contacts Bot - Kontaktverwaltung**

Ich helfe dir, deine Kontakte zu verwalten!

**Schnellstart:**
\`!kontakte\` - Alle Kontakte anzeigen
\`!suche Max\` - Kontakte suchen
\`!neu Vorname Nachname\` - Neuen Kontakt

Sag "hilfe" fur alle Befehle!`;
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		if (message.startsWith('!')) {
			await this.handleCommand(roomId, event, sender, message);
			return;
		}

		const detectedCommand = keywordDetector.detect(message);
		if (detectedCommand) {
			this.logger.log(`Detected keyword command: ${detectedCommand}`);
			await this.handleCommand(roomId, event, sender, `!${detectedCommand}`);
			return;
		}
	}

	private async handleCommand(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		body: string
	) {
		const [command, ...args] = body.slice(1).split(' ');
		const argString = args.join(' ');

		switch (command.toLowerCase()) {
			case 'help':
			case 'hilfe':
			case 'start':
				await this.sendReply(roomId, event, HELP_MESSAGE);
				break;

			case 'kontakte':
			case 'contacts':
			case 'liste':
			case 'list':
				await this.handleListContacts(roomId, event, sender);
				break;

			case 'suche':
			case 'search':
				await this.handleSearch(roomId, event, sender, argString);
				break;

			case 'favoriten':
			case 'favorites':
			case 'favs':
				await this.handleFavorites(roomId, event, sender);
				break;

			case 'kontakt':
			case 'contact':
			case 'details':
				await this.handleContactDetails(roomId, event, sender, args);
				break;

			case 'neu':
			case 'new':
			case 'add':
				await this.handleCreateContact(roomId, event, sender, args);
				break;

			case 'edit':
			case 'bearbeiten':
				await this.handleEditContact(roomId, event, sender, args);
				break;

			case 'loeschen':
			case 'delete':
			case 'del':
				await this.handleDeleteContact(roomId, event, sender, args);
				break;

			case 'fav':
			case 'favorit':
				await this.handleToggleFavorite(roomId, event, sender, args);
				break;

			case 'archiv':
			case 'archive':
				await this.handleToggleArchive(roomId, event, sender, args);
				break;

			case 'login':
				await this.handleLogin(roomId, event, sender, args);
				break;

			case 'logout':
				await this.sessionService.logout(sender);
				await this.sendReply(roomId, event, 'Du wurdest abgemeldet.');
				break;

			case 'status':
				await this.handleStatus(roomId, event, sender);
				break;

			case 'pin':
				await this.pinHelpMessage(roomId, event);
				break;

			default:
				await this.sendReply(
					roomId,
					event,
					`Unbekannter Befehl: !${command}\n\nSag "hilfe" fur alle Befehle.`
				);
		}
	}

	private async handleListContacts(roomId: string, event: MatrixRoomEvent, sender: string) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const result = await this.contactsService.getContacts(token, { limit: 20 });
			const contacts = result.contacts;

			if (contacts.length === 0) {
				await this.sendReply(
					roomId,
					event,
					`Du hast noch keine Kontakte.\n\nNutze \`!neu Vorname Nachname\` um einen zu erstellen.`
				);
				return;
			}

			// Store for reference
			this.contactsMapper.setList(sender, contacts);

			let text = `**Deine Kontakte (${result.total}):**\n\n`;
			for (let i = 0; i < contacts.length; i++) {
				const c = contacts[i];
				const name =
					c.displayName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unbenannt';
				const favIcon = c.isFavorite ? ' ★' : '';
				const company = c.company ? ` - ${c.company}` : '';
				text += `**${i + 1}.** ${name}${favIcon}${company}\n`;
			}

			if (result.total > 20) {
				text += `\n_...und ${result.total - 20} weitere_`;
			}

			text += `\n\nNutze \`!kontakt [nr]\` fur Details.`;

			await this.sendReply(roomId, event, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleSearch(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		searchTerm: string
	) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (!searchTerm.trim()) {
			await this.sendReply(
				roomId,
				event,
				`**Verwendung:** \`!suche [text]\`\n\nBeispiel: \`!suche Max\``
			);
			return;
		}

		try {
			const result = await this.contactsService.getContacts(token, {
				search: searchTerm,
				limit: 20,
			});
			const contacts = result.contacts;

			if (contacts.length === 0) {
				await this.sendReply(roomId, event, `Keine Kontakte gefunden fur: "${searchTerm}"`);
				return;
			}

			this.contactsMapper.setList(sender, contacts);

			let text = `**Suchergebnisse fur "${searchTerm}" (${contacts.length}):**\n\n`;
			for (let i = 0; i < contacts.length; i++) {
				const c = contacts[i];
				const name =
					c.displayName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unbenannt';
				const favIcon = c.isFavorite ? ' ★' : '';
				const email = c.email ? ` (${c.email})` : '';
				text += `**${i + 1}.** ${name}${favIcon}${email}\n`;
			}

			await this.sendReply(roomId, event, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleFavorites(roomId: string, event: MatrixRoomEvent, sender: string) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		try {
			const result = await this.contactsService.getContacts(token, { isFavorite: true, limit: 20 });
			const contacts = result.contacts;

			if (contacts.length === 0) {
				await this.sendReply(
					roomId,
					event,
					`Du hast noch keine Favoriten.\n\nNutze \`!fav [nr]\` um einen Kontakt als Favorit zu markieren.`
				);
				return;
			}

			this.contactsMapper.setList(sender, contacts);

			let text = `**Deine Favoriten (${contacts.length}):**\n\n`;
			for (let i = 0; i < contacts.length; i++) {
				const c = contacts[i];
				const name =
					c.displayName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unbenannt';
				const phone = c.phone || c.mobile || '';
				text += `**${i + 1}.** ★ ${name}${phone ? ` - ${phone}` : ''}\n`;
			}

			await this.sendReply(roomId, event, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleContactDetails(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		args: string[]
	) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 1) {
			await this.sendReply(
				roomId,
				event,
				`**Verwendung:** \`!kontakt [nr]\`\n\nNutze \`!kontakte\` um die Liste zu sehen.`
			);
			return;
		}

		const number = parseInt(args[0], 10);
		const contact = this.contactsMapper.getByNumber(sender, number);

		if (!contact) {
			await this.sendReply(
				roomId,
				event,
				`Kontakt ${args[0]} nicht gefunden. Nutze \`!kontakte\` zuerst.`
			);
			return;
		}

		try {
			const details = await this.contactsService.getContact(token, contact.id);

			let text = `**${details.displayName || `${details.firstName || ''} ${details.lastName || ''}`.trim()}**\n\n`;

			if (details.isFavorite) text += `★ Favorit\n\n`;

			if (details.company || details.jobTitle) {
				const job = [details.jobTitle, details.company].filter(Boolean).join(' bei ');
				text += `**Beruf:** ${job}\n`;
			}

			if (details.email) text += `**E-Mail:** ${details.email}\n`;
			if (details.phone) text += `**Telefon:** ${details.phone}\n`;
			if (details.mobile) text += `**Mobil:** ${details.mobile}\n`;

			if (details.street || details.city) {
				const address = [
					details.street,
					`${details.postalCode || ''} ${details.city || ''}`.trim(),
					details.country,
				]
					.filter(Boolean)
					.join(', ');
				if (address) text += `**Adresse:** ${address}\n`;
			}

			if (details.website) text += `**Website:** ${details.website}\n`;
			if (details.birthday)
				text += `**Geburtstag:** ${new Date(details.birthday).toLocaleDateString('de-DE')}\n`;
			if (details.notes) text += `\n**Notizen:** ${details.notes}\n`;

			await this.sendReply(roomId, event, text);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleCreateContact(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		args: string[]
	) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		// Validate credits
		const validation = await this.creditService.validateCredits(token, CONTACT_CREATE_CREDITS);
		if (!validation.hasCredits) {
			const errorMsg = this.creditService.formatInsufficientCreditsError(
				CONTACT_CREATE_CREDITS,
				validation.availableCredits,
				'Kontakt erstellen'
			);
			await this.sendReply(roomId, event, errorMsg.text);
			return;
		}

		if (args.length < 1) {
			await this.sendReply(
				roomId,
				event,
				`**Verwendung:** \`!neu Vorname [Nachname]\`\n\nBeispiel: \`!neu Max Mustermann\``
			);
			return;
		}

		const firstName = args[0];
		const lastName = args.slice(1).join(' ') || undefined;

		try {
			const contact = await this.contactsService.createContact(token, {
				firstName,
				lastName,
			});

			const name = contact.displayName || `${firstName} ${lastName || ''}`.trim();
			const balance = await this.creditService.getBalance(token);
			await this.sendReply(
				roomId,
				event,
				`Kontakt **${name}** erstellt!\n⚡ -${CONTACT_CREATE_CREDITS} Credits (${balance.balance.toFixed(2)} verbleibend)\n\nNutze \`!kontakte\` um die Liste zu sehen oder \`!edit\` um weitere Daten hinzuzufugen.`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleEditContact(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		args: string[]
	) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 3) {
			await this.sendReply(
				roomId,
				event,
				`**Verwendung:** \`!edit [nr] [feld] [wert]\`\n\n**Felder:** email, phone, mobile, company, job, website, street, city, zip, country, notes, birthday\n\n**Beispiel:** \`!edit 1 email max@example.com\``
			);
			return;
		}

		const number = parseInt(args[0], 10);
		const field = args[1].toLowerCase();
		const value = args.slice(2).join(' ');

		const contact = this.contactsMapper.getByNumber(sender, number);
		if (!contact) {
			await this.sendReply(
				roomId,
				event,
				`Kontakt ${args[0]} nicht gefunden. Nutze \`!kontakte\` zuerst.`
			);
			return;
		}

		const fieldMap: Record<string, string> = {
			email: 'email',
			phone: 'phone',
			telefon: 'phone',
			mobile: 'mobile',
			mobil: 'mobile',
			handy: 'mobile',
			company: 'company',
			firma: 'company',
			job: 'jobTitle',
			jobtitle: 'jobTitle',
			beruf: 'jobTitle',
			website: 'website',
			web: 'website',
			street: 'street',
			strasse: 'street',
			city: 'city',
			stadt: 'city',
			zip: 'postalCode',
			plz: 'postalCode',
			country: 'country',
			land: 'country',
			notes: 'notes',
			notizen: 'notes',
			birthday: 'birthday',
			geburtstag: 'birthday',
			firstname: 'firstName',
			vorname: 'firstName',
			lastname: 'lastName',
			nachname: 'lastName',
		};

		const mappedField = fieldMap[field];
		if (!mappedField) {
			await this.sendReply(
				roomId,
				event,
				`Unbekanntes Feld: ${field}\n\n**Gultige Felder:** email, phone, mobile, company, job, website, street, city, zip, country, notes, birthday`
			);
			return;
		}

		try {
			const updated = await this.contactsService.updateContact(token, contact.id, {
				[mappedField]: value,
			});

			const name =
				updated.displayName || `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
			await this.sendReply(
				roomId,
				event,
				`Kontakt **${name}** aktualisiert!\n\n**${field}:** ${value}`
			);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleDeleteContact(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		args: string[]
	) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 1) {
			await this.sendReply(
				roomId,
				event,
				`**Verwendung:** \`!loeschen [nr]\`\n\nNutze \`!kontakte\` um die Liste zu sehen.`
			);
			return;
		}

		const number = parseInt(args[0], 10);
		const contact = this.contactsMapper.getByNumber(sender, number);
		if (!contact) {
			await this.sendReply(
				roomId,
				event,
				`Kontakt ${args[0]} nicht gefunden. Nutze \`!kontakte\` zuerst.`
			);
			return;
		}

		const name =
			contact.displayName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();

		try {
			await this.contactsService.deleteContact(token, contact.id);
			await this.sendReply(roomId, event, `Kontakt **${name}** geloscht.`);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleToggleFavorite(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		args: string[]
	) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 1) {
			await this.sendReply(
				roomId,
				event,
				`**Verwendung:** \`!fav [nr]\`\n\nNutze \`!kontakte\` um die Liste zu sehen.`
			);
			return;
		}

		const number = parseInt(args[0], 10);
		const contact = this.contactsMapper.getByNumber(sender, number);
		if (!contact) {
			await this.sendReply(
				roomId,
				event,
				`Kontakt ${args[0]} nicht gefunden. Nutze \`!kontakte\` zuerst.`
			);
			return;
		}

		try {
			const updated = await this.contactsService.toggleFavorite(token, contact.id);
			const name =
				updated.displayName || `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
			const status = updated.isFavorite ? 'als Favorit markiert ★' : 'aus Favoriten entfernt';
			await this.sendReply(roomId, event, `**${name}** ${status}`);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleToggleArchive(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		args: string[]
	) {
		const token = await this.sessionService.getToken(sender);
		if (!token) {
			await this.sendReply(roomId, event, `Du bist nicht angemeldet. Nutze \`!login\` zuerst.`);
			return;
		}

		if (args.length < 1) {
			await this.sendReply(
				roomId,
				event,
				`**Verwendung:** \`!archiv [nr]\`\n\nNutze \`!kontakte\` um die Liste zu sehen.`
			);
			return;
		}

		const number = parseInt(args[0], 10);
		const contact = this.contactsMapper.getByNumber(sender, number);
		if (!contact) {
			await this.sendReply(
				roomId,
				event,
				`Kontakt ${args[0]} nicht gefunden. Nutze \`!kontakte\` zuerst.`
			);
			return;
		}

		try {
			const updated = await this.contactsService.toggleArchive(token, contact.id);
			const name =
				updated.displayName || `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
			const status = updated.isArchived ? 'archiviert' : 'aus dem Archiv geholt';
			await this.sendReply(roomId, event, `**${name}** ${status}`);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler: ${errorMsg}`);
		}
	}

	private async handleLogin(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string,
		args: string[]
	) {
		if (args.length < 2) {
			await this.sendReply(
				roomId,
				event,
				`**Verwendung:** \`!login email passwort\`\n\nBeispiel: \`!login nutzer@example.com meinpasswort\``
			);
			return;
		}

		const [email, password] = args;

		await this.sendReply(roomId, event, 'Anmeldung lauft...');

		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			const token = await this.sessionService.getToken(sender);
			if (token) {
				const balance = await this.creditService.getBalance(token);
				await this.sendReply(
					roomId,
					event,
					`✅ Erfolgreich angemeldet als **${email}**\n⚡ Credits: ${balance.balance.toFixed(2)}\n\nNutze \`!kontakte\` um deine Kontakte zu sehen.`
				);
			} else {
				await this.sendReply(
					roomId,
					event,
					`✅ Erfolgreich angemeldet!\n\nNutze \`!kontakte\` um deine Kontakte zu sehen.`
				);
			}
		} else {
			await this.sendReply(roomId, event, `❌ Anmeldung fehlgeschlagen: ${result.error}`);
		}
	}

	private async handleStatus(roomId: string, event: MatrixRoomEvent, sender: string) {
		const backendHealthy = await this.contactsService.checkHealth();
		const isLoggedIn = await this.sessionService.isLoggedIn(sender);
		const sessionCount = this.sessionService.getSessionCount();
		const session = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let statusText = `**Contacts Bot Status**\n\n`;
		statusText += `**Backend:** ${backendHealthy ? '✅ Online' : '❌ Offline'}\n`;
		statusText += `**Aktive Sessions:** ${sessionCount}\n\n`;

		if (isLoggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			statusText += `👤 Angemeldet als: ${session.email}\n`;
			statusText += `⚡ Credits: ${balance.balance.toFixed(2)}\n`;
		} else {
			statusText += `👤 Nicht angemeldet\n`;
			statusText += `💡 Login: \`!login email passwort\``;
		}

		await this.sendReply(roomId, event, statusText);
	}

	private async pinHelpMessage(roomId: string, event: MatrixRoomEvent) {
		try {
			const eventId = await this.sendMessage(roomId, HELP_MESSAGE);

			await this.getClient().sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [eventId],
			});

			this.logger.log(`Pinned help message in room ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to pin help message:`, error);
			await this.sendReply(roomId, event, 'Fehler beim Pinnen der Hilfe.');
		}
	}
}
