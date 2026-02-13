import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import {
	TranscriptionService,
	SessionService,
	CreditService,
	CalendarApiService,
	CalendarEvent as ApiCalendarEvent,
	I18nService,
	Language,
	LANGUAGE_NAMES,
} from '@manacore/bot-services';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

const EVENT_CREATE_CREDITS = 0.02;

// Alias for consistency
type CalendarEvent = ApiCalendarEvent;

@Injectable()
export class MatrixService extends BaseMatrixService {
	private readonly keywordDetector = new KeywordCommandDetector(
		[
			...COMMON_KEYWORDS,
			{ keywords: ['was kannst du'], command: 'help' },
			{
				keywords: ['was steht heute an', 'termine heute', 'heute termine', "today's events"],
				command: 'today',
			},
			{ keywords: ['termine morgen', 'morgen termine', 'was ist morgen'], command: 'tomorrow' },
			{ keywords: ['diese woche', 'wochenübersicht', 'week', 'woche'], command: 'week' },
			{ keywords: ['zeige kalender', 'meine kalender', 'calendars'], command: 'calendars' },
			{ keywords: ['verbindung', 'connection'], command: 'status' },
		],
		{ partialMatch: true }
	);

	constructor(
		configService: ConfigService,
		private readonly transcriptionService: TranscriptionService,
		private calendarApiService: CalendarApiService,
		private sessionService: SessionService,
		private creditService: CreditService,
		private i18nService: I18nService
	) {
		super(configService);
	}

	/**
	 * Check if user is logged in and has a valid token for API access
	 */
	private async getToken(userId: string): Promise<string | null> {
		return this.sessionService.getToken(userId);
	}

	/**
	 * Require login - returns token or sends login prompt and returns null
	 */
	private async requireLogin(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string
	): Promise<string | null> {
		const token = await this.getToken(userId);
		if (!token) {
			await this.sendReply(
				roomId,
				event,
				'🔐 **Login erforderlich**\n\n' +
					'Um Termine zu verwalten, melde dich bitte an:\n\n' +
					'`!login deine@email.de deinpasswort`\n\n' +
					'Deine Termine werden dann mit der Kalender-App synchronisiert.'
			);
			return null;
		}
		return token;
	}

	/**
	 * Normalize event from API format
	 */
	private normalizeEvent(event: ApiCalendarEvent): CalendarEvent {
		return {
			id: event.id,
			title: event.title,
			description: event.description || null,
			location: event.location || null,
			startTime: event.startTime,
			endTime: event.endTime,
			isAllDay: event.isAllDay,
			calendarId: event.calendarId || '',
			calendarName: 'Kalender',
			createdAt: event.createdAt || new Date().toISOString(),
			userId: event.userId || '',
		};
	}

	protected override async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		try {
			// Require login for audio messages
			const token = await this.requireLogin(roomId, event, sender);
			if (!token) return;

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
		return BOT_INTRODUCTION;
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		// Check for ! commands first (before keyword detection)
		if (message.startsWith('!')) {
			const [command, ...args] = message.slice(1).split(' ');
			await this.executeCommand(roomId, event, sender, command.toLowerCase(), args.join(' '));
			return;
		}

		// Check for natural language keywords
		const keywordCommand = this.keywordDetector.detect(message);
		if (keywordCommand) {
			await this.executeCommand(roomId, event, sender, keywordCommand, '');
			return;
		}

		// Fallback: treat any message as an event
		await this.handleCreateEvent(roomId, event, sender, message);
	}

	private async executeCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		command: string,
		args: string
	) {
		switch (command) {
			case 'help':
			case 'hilfe':
				await this.sendReply(roomId, event, HELP_TEXT);
				break;

			case 'heute':
			case 'today':
				await this.handleTodayEvents(roomId, event, userId);
				break;

			case 'morgen':
			case 'tomorrow':
				await this.handleTomorrowEvents(roomId, event, userId);
				break;

			case 'woche':
			case 'week':
				await this.handleWeekEvents(roomId, event, userId);
				break;

			case 'termine':
			case 'events':
			case 'upcoming':
				await this.handleUpcomingEvents(roomId, event, userId);
				break;

			case 'termin':
			case 'event':
			case 'neu':
			case 'add':
				await this.handleCreateEvent(roomId, event, userId, args);
				break;

			case 'details':
			case 'info':
				await this.handleEventDetails(roomId, event, userId, args);
				break;

			case 'löschen':
			case 'delete':
			case 'entfernen':
				await this.handleDeleteEvent(roomId, event, userId, args);
				break;

			case 'kalender':
			case 'calendars':
				await this.handleCalendars(roomId, event, userId);
				break;

			case 'status':
				await this.handleStatus(roomId, event, userId);
				break;

			case 'pin':
				await this.handlePinHelp(roomId, event);
				break;

			case 'login':
				await this.handleLogin(roomId, event, userId, args);
				break;

			case 'logout':
				await this.handleLogout(roomId, event, userId);
				break;

			case 'language':
			case 'sprache':
			case 'lang':
				await this.handleLanguage(roomId, event, userId, args);
				break;

			default:
				// Unknown command - ignore silently
				break;
		}
	}

	private async handleTodayEvents(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		const apiEvents = await this.calendarApiService.getTodayEvents(token);
		const events = apiEvents.map((e) => this.normalizeEvent(e));

		if (events.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine Termine für heute.\n\nErstelle einen mit `!termin Titel heute um 14:00`'
			);
			return;
		}

		let response = this.formatEventList('📅 **Termine heute:**', events);
		response += '\n\n🔄 Synchronisiert';
		await this.sendReply(roomId, event, response);
	}

	private async handleTomorrowEvents(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		// Get events for tomorrow
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = tomorrow.toISOString().split('T')[0];
		const apiEvents = await this.calendarApiService.getEvents(token, {
			start: tomorrowStr,
			end: tomorrowStr,
		});
		const events = apiEvents.map((e) => this.normalizeEvent(e));

		if (events.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine Termine für morgen.\n\nErstelle einen mit `!termin Titel morgen um 10:00`'
			);
			return;
		}

		let response = this.formatEventList('📅 **Termine morgen:**', events);
		response += '\n\n🔄 Synchronisiert';
		await this.sendReply(roomId, event, response);
	}

	private async handleWeekEvents(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		const apiEvents = await this.calendarApiService.getUpcomingEvents(token, 7);
		const events = apiEvents.map((e) => this.normalizeEvent(e));

		if (events.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine Termine diese Woche.\n\nErstelle einen mit `!termin Titel am 20.02. um 14:00`'
			);
			return;
		}

		let response = this.formatEventList('📅 **Termine diese Woche:**', events);
		response += '\n\n🔄 Synchronisiert';
		await this.sendReply(roomId, event, response);
	}

	private async handleUpcomingEvents(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		const apiEvents = await this.calendarApiService.getUpcomingEvents(token, 14);
		const events = apiEvents.map((e) => this.normalizeEvent(e));

		if (events.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine anstehenden Termine.\n\nErstelle einen mit `!termin Meeting am 15.02. um 14:00`'
			);
			return;
		}

		let response = this.formatEventList('📅 **Anstehende Termine:**', events);
		response += '\n\n🔄 Synchronisiert';
		await this.sendReply(roomId, event, response);
	}

	private async handleCreateEvent(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		input: string
	) {
		if (!input.trim()) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib einen Termin an.\n\nBeispiele:\n• `!termin Meeting morgen um 14:00`\n• `!termin Geburtstag am 20.03. ganztägig`\n• `!termin Zahnarzt am 15.02. um 10:30`'
			);
			return;
		}

		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		// Validate credits
		const validation = await this.creditService.validateCredits(token, EVENT_CREATE_CREDITS);
		if (!validation.hasCredits) {
			const errorMsg = this.creditService.formatInsufficientCreditsError(
				EVENT_CREATE_CREDITS,
				validation.availableCredits,
				'Termin erstellen'
			);
			await this.sendReply(roomId, event, errorMsg.text);
			return;
		}

		// Use API service
		const { title, startTime, endTime, isAllDay, location } =
			this.calendarApiService.parseEventInput(input);

		if (!startTime || !endTime) {
			await this.sendReply(
				roomId,
				event,
				'❌ Konnte Datum/Uhrzeit nicht erkennen.\n\nBeispiele:\n• `!termin Meeting morgen um 14:00`\n• `!termin Arzt am 15.02. um 10:00`\n• `!termin Urlaub am 01.03. ganztägig`'
			);
			return;
		}

		if (!title) {
			await this.sendReply(roomId, event, '❌ Bitte gib einen Titel für den Termin an.');
			return;
		}

		const apiEvent = await this.calendarApiService.createEvent(token, {
			title,
			startTime,
			endTime,
			isAllDay,
			location: location || undefined,
		});

		if (!apiEvent) {
			await this.sendReply(
				roomId,
				event,
				'❌ Fehler beim Erstellen des Termins. Bitte versuche es erneut.'
			);
			return;
		}

		const calendarEvent = this.normalizeEvent(apiEvent);
		const timeStr = this.formatEventTime(calendarEvent);
		let response = `✅ Termin erstellt: **${calendarEvent.title}**\n📆 ${timeStr}`;

		const balance = await this.creditService.getBalance(token);
		response += `\n⚡ -${EVENT_CREATE_CREDITS} Credits (${balance.balance.toFixed(2)} verbleibend)`;
		response += '\n🔄 Synchronisiert';

		await this.sendReply(roomId, event, response);
	}

	private async handleEventDetails(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		const eventNumber = parseInt(args.trim());

		if (isNaN(eventNumber) || eventNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib eine gültige Terminnummer an.\n\nBeispiel: `!details 1`'
			);
			return;
		}

		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		let calendarEvent: CalendarEvent | null = null;

		// Use API service - get event list first
		const apiEvents = await this.calendarApiService.getUpcomingEvents(token, 30);
		if (eventNumber > 0 && eventNumber <= apiEvents.length) {
			calendarEvent = this.normalizeEvent(apiEvents[eventNumber - 1]);
		}

		if (!calendarEvent) {
			await this.sendReply(roomId, event, `❌ Termin #${eventNumber} nicht gefunden.`);
			return;
		}

		const timeStr = this.formatEventTime(calendarEvent);
		let response = `📅 **${calendarEvent.title}**\n\n`;
		response += `🕐 ${timeStr}\n`;
		response += `📁 Kalender: ${calendarEvent.calendarName}\n`;

		if (calendarEvent.location) {
			response += `📍 Ort: ${calendarEvent.location}\n`;
		}

		if (calendarEvent.description) {
			response += `\n📝 ${calendarEvent.description}`;
		}

		response += '\n\n🔄 Synchronisiert';

		await this.sendReply(roomId, event, response);
	}

	private async handleDeleteEvent(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		const eventNumber = parseInt(args.trim());

		if (isNaN(eventNumber) || eventNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib eine gültige Terminnummer an.\n\nBeispiel: `!löschen 1`'
			);
			return;
		}

		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		let deletedEvent: CalendarEvent | null = null;

		// Use API service - get event list first to find event by index
		const apiEvents = await this.calendarApiService.getUpcomingEvents(token, 30);
		if (eventNumber > 0 && eventNumber <= apiEvents.length) {
			const targetEvent = apiEvents[eventNumber - 1];
			const success = await this.calendarApiService.deleteEvent(token, targetEvent.id);
			if (success) {
				deletedEvent = this.normalizeEvent(targetEvent);
			}
		}

		if (!deletedEvent) {
			await this.sendReply(roomId, event, `❌ Termin #${eventNumber} nicht gefunden.`);
			return;
		}

		const response = `🗑️ Gelöscht: ${deletedEvent.title}\n\n🔄 Synchronisiert`;
		await this.sendReply(roomId, event, response);
	}

	private async handleCalendars(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		const calendars = await this.calendarApiService.getCalendars(token);

		let response = '📁 **Deine Kalender:**\n\n';
		for (const calendar of calendars) {
			response += `• ${calendar.name}\n`;
		}

		response += '\n🔄 Synchronisiert';

		await this.sendReply(roomId, event, response);
	}

	private async handleStatus(roomId: string, event: MatrixRoomEvent, userId: string) {
		const token = await this.getToken(userId);
		const session = await this.sessionService.getSession(userId);

		let response = `📊 **Status**\n\n`;

		if (token && session) {
			// Get stats from API
			const apiTodayEvents = await this.calendarApiService.getTodayEvents(token);
			const apiEvents = await this.calendarApiService.getUpcomingEvents(token, 7);
			const todayEvents = apiTodayEvents.map((e) => this.normalizeEvent(e));
			const events = apiEvents.map((e) => this.normalizeEvent(e));

			response += `• Termine heute: ${todayEvents.length}\n`;
			response += `• Termine nächste 7 Tage: ${events.length}\n\n`;

			const balance = await this.creditService.getBalance(token);
			response += `👤 Angemeldet als: ${session.email}\n`;
			response += `⚡ Credits: ${balance.balance.toFixed(2)}\n\n`;
			response += `🔄 Synchronisiert mit calendar-backend\n`;
			response += `Bot: ✅ Online`;
		} else {
			response += `👤 Nicht angemeldet\n\n`;
			response += `🔐 **Login erforderlich**\n\n`;
			response += `Um Termine zu verwalten, melde dich an:\n`;
			response += `\`!login deine@email.de deinpasswort\`\n\n`;
			response += `Deine Termine werden dann mit der Kalender-App synchronisiert.\n\n`;
			response += `Bot: ✅ Online`;
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleLogin(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const parts = args.trim().split(/\s+/);
		if (parts.length < 2) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib Email und Passwort an.\n\nBeispiel: `!login email@example.com passwort`'
			);
			return;
		}

		const [email, password] = parts;
		const result = await this.sessionService.login(userId, email, password);

		if (!result.success) {
			await this.sendReply(roomId, event, `❌ Login fehlgeschlagen: ${result.error}`);
			return;
		}

		const token = await this.sessionService.getToken(userId);
		if (token) {
			const balance = await this.creditService.getBalance(token);
			await this.sendReply(
				roomId,
				event,
				`✅ Erfolgreich angemeldet als **${email}**\n⚡ Credits: ${balance.balance.toFixed(2)}`
			);
		} else {
			await this.sendReply(roomId, event, `✅ Erfolgreich angemeldet als **${email}**`);
		}
	}

	private async handleLogout(roomId: string, event: MatrixRoomEvent, userId: string) {
		const session = await this.sessionService.getSession(userId);
		if (!session) {
			await this.sendReply(roomId, event, '❌ Du bist nicht angemeldet.');
			return;
		}

		this.sessionService.logout(userId);
		await this.sendReply(roomId, event, '✅ Erfolgreich abgemeldet.');
	}

	private async handlePinHelp(roomId: string, event: MatrixRoomEvent) {
		try {
			// Send help message
			const helpEventId = await this.sendMessage(roomId, HELP_TEXT);

			// Pin it
			await this.getClient().sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [helpEventId],
			});

			await this.sendReply(roomId, event, '📌 Hilfe wurde angepinnt!');
		} catch (error) {
			this.logger.error('Failed to pin help:', error);
			await this.sendReply(
				roomId,
				event,
				'❌ Konnte Hilfe nicht anpinnen (fehlende Berechtigung?)'
			);
		}
	}

	private formatEventList(header: string, events: CalendarEvent[]): string {
		let response = `${header}\n\n`;

		events.forEach((event, index) => {
			const num = index + 1;
			const timeStr = this.formatEventTime(event);
			response += `**${num}.** ${event.title}\n   🕐 ${timeStr}\n`;
		});

		response += `\n📋 Details: \`!details [Nr]\` | 🗑️ Löschen: \`!löschen [Nr]\``;
		return response;
	}

	/**
	 * Format event time for display
	 */
	private formatEventTime(event: CalendarEvent): string {
		const start = new Date(event.startTime);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		// Check if date is today or tomorrow
		let dateStr: string;
		if (start.toDateString() === today.toDateString()) {
			dateStr = 'Heute';
		} else if (start.toDateString() === tomorrow.toDateString()) {
			dateStr = 'Morgen';
		} else {
			dateStr = start.toLocaleDateString('de-DE', {
				weekday: 'short',
				day: '2-digit',
				month: '2-digit',
			});
		}

		if (event.isAllDay) {
			return `${dateStr} (ganztägig)`;
		}

		const timeStr = start.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});

		return `${dateStr}, ${timeStr}`;
	}

	// Public method to send welcome message to new users
	async sendWelcomeMessage(roomId: string, userId: string) {
		try {
			await this.sendMessage(roomId, WELCOME_TEXT);
			this.logger.log(`Sent welcome message to ${userId} in ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to send welcome message: ${error}`);
		}
	}

	private async handleLanguage(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		const lang = args.trim().toLowerCase();

		if (!lang) {
			const currentLang = await this.i18nService.getLanguage(userId);
			const langName = LANGUAGE_NAMES[currentLang];
			const available = this.i18nService
				.getAvailableLanguages()
				.map((l) => `${l} (${LANGUAGE_NAMES[l]})`)
				.join(', ');
			await this.sendReply(
				roomId,
				event,
				`**Sprache / Language:** ${langName}\n\n**Verfügbar / Available:** ${available}\n\nÄndern / Change: \`!language de\` oder / or \`!language en\``
			);
			return;
		}

		if (!this.i18nService.isValidLanguage(lang)) {
			const available = this.i18nService.getAvailableLanguages().join(', ');
			await this.sendReply(
				roomId,
				event,
				`Unbekannte Sprache / Unknown language: ${lang}\n\nVerfügbar / Available: ${available}`
			);
			return;
		}

		await this.i18nService.setLanguage(userId, lang as Language);
		const langName = LANGUAGE_NAMES[lang as Language];

		if (lang === 'de') {
			await this.sendReply(roomId, event, `Sprache geändert zu: **${langName}**`);
		} else {
			await this.sendReply(roomId, event, `Language changed to: **${langName}**`);
		}
	}
}
