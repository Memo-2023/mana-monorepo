import { type BotTranslations } from '../types';

export const de: BotTranslations = {
	common: {
		// General
		error: 'Fehler',
		errorOccurred: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
		notLoggedIn: 'Du bist nicht angemeldet.',
		loginRequired: 'Bitte melde dich zuerst an mit `!login email passwort`',
		loginSuccess: 'Erfolgreich angemeldet als **{email}**',
		loginFailed: 'Anmeldung fehlgeschlagen: {error}',
		logoutSuccess: 'Erfolgreich abgemeldet.',
		invalidCommand: 'Unbekannter Befehl: {command}',
		helpHint: 'Sag "hilfe" für alle Befehle.',

		// Credits
		credits: 'Credits',
		creditsRemaining: '{amount} verbleibend',
		insufficientCredits: 'Nicht genügend Credits. Benötigt: {required}, Verfügbar: {available}',
		buyCredits: 'Credits kaufen: https://mana.how/credits',

		// Sync
		synced: 'Synchronisiert',
		localStorage: 'Lokaler Speicher',

		// Status
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Angemeldet als: {email}',
		notLoggedInStatus: 'Nicht angemeldet',

		// Language
		languageChanged: 'Sprache geändert zu: **{language}**',
		currentLanguage: 'Aktuelle Sprache: **{language}**',
		availableLanguages: 'Verfügbare Sprachen: {languages}',

		// Dates
		today: 'Heute',
		tomorrow: 'Morgen',
		dayAfterTomorrow: 'Übermorgen',

		// Actions
		created: 'Erstellt',
		deleted: 'Gelöscht',
		updated: 'Aktualisiert',
		completed: 'Erledigt',
	},

	todo: {
		// Inherit common
		error: 'Fehler',
		errorOccurred: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
		notLoggedIn: 'Du bist nicht angemeldet.',
		loginRequired: 'Bitte melde dich zuerst an mit `!login email passwort`',
		loginSuccess: 'Erfolgreich angemeldet als **{email}**',
		loginFailed: 'Anmeldung fehlgeschlagen: {error}',
		logoutSuccess: 'Erfolgreich abgemeldet.',
		invalidCommand: 'Unbekannter Befehl: {command}',
		helpHint: 'Sag "hilfe" für alle Befehle.',
		credits: 'Credits',
		creditsRemaining: '{amount} verbleibend',
		insufficientCredits: 'Nicht genügend Credits. Benötigt: {required}, Verfügbar: {available}',
		buyCredits: 'Credits kaufen: https://mana.how/credits',
		synced: 'Synchronisiert',
		localStorage: 'Lokaler Speicher',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Angemeldet als: {email}',
		notLoggedInStatus: 'Nicht angemeldet',
		languageChanged: 'Sprache geändert zu: **{language}**',
		currentLanguage: 'Aktuelle Sprache: **{language}**',
		availableLanguages: 'Verfügbare Sprachen: {languages}',
		today: 'Heute',
		tomorrow: 'Morgen',
		dayAfterTomorrow: 'Übermorgen',
		created: 'Erstellt',
		deleted: 'Gelöscht',
		updated: 'Aktualisiert',
		completed: 'Erledigt',

		// Tasks
		task: 'Aufgabe',
		tasks: 'Aufgaben',
		taskCreated: 'Aufgabe erstellt: **{title}**',
		taskCompleted: 'Erledigt: ~~{title}~~',
		taskDeleted: 'Gelöscht: {title}',
		noTasks: 'Keine offenen Aufgaben.',
		noTasksToday: 'Keine Aufgaben für heute.',
		inboxEmpty: 'Inbox ist leer.',
		allTasks: 'Alle offenen Aufgaben',
		todayTasks: 'Aufgaben für heute',
		inbox: 'Inbox (ohne Datum)',

		// Projects
		project: 'Projekt',
		projects: 'Projekte',
		noProjects: 'Keine Projekte.',
		projectTasks: 'Projekt: {name}',

		// Priorities
		priority: 'Priorität',
		date: 'Datum',

		// Help
		helpTitle: 'Todo Bot - Hilfe',
		helpCommands: `**Befehle:**
• \`!add [Aufgabe]\` - Neue Aufgabe erstellen
• \`!list\` - Alle offenen Aufgaben
• \`!today\` - Heutige Aufgaben
• \`!inbox\` - Aufgaben ohne Datum
• \`!done [Nr]\` - Aufgabe als erledigt markieren
• \`!delete [Nr]\` - Aufgabe löschen
• \`!projects\` - Alle Projekte
• \`!project [Name]\` - Projektaufgaben anzeigen
• \`!status\` - Bot-Status
• \`!language [de/en]\` - Sprache ändern`,
		helpSyntax: `**Syntax:**
\`!add Aufgabe !p1 @morgen #projekt\`
• \`!p1-4\` - Priorität (1=höchste)
• \`@heute/@morgen/@übermorgen\` - Datum
• \`#projektname\` - Projekt`,
		helpExamples: `**Beispiele:**
• \`Einkaufen gehen\`
• \`Meeting vorbereiten !p1 @morgen\`
• \`Bericht schreiben #arbeit\``,

		// Actions
		markDone: 'Erledigen: `!done [Nr]`',
		delete: 'Löschen: `!delete [Nr]`',
	},

	calendar: {
		// Inherit common
		error: 'Fehler',
		errorOccurred: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
		notLoggedIn: 'Du bist nicht angemeldet.',
		loginRequired: 'Bitte melde dich zuerst an mit `!login email passwort`',
		loginSuccess: 'Erfolgreich angemeldet als **{email}**',
		loginFailed: 'Anmeldung fehlgeschlagen: {error}',
		logoutSuccess: 'Erfolgreich abgemeldet.',
		invalidCommand: 'Unbekannter Befehl: {command}',
		helpHint: 'Sag "hilfe" für alle Befehle.',
		credits: 'Credits',
		creditsRemaining: '{amount} verbleibend',
		insufficientCredits: 'Nicht genügend Credits. Benötigt: {required}, Verfügbar: {available}',
		buyCredits: 'Credits kaufen: https://mana.how/credits',
		synced: 'Synchronisiert',
		localStorage: 'Lokaler Speicher',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Angemeldet als: {email}',
		notLoggedInStatus: 'Nicht angemeldet',
		languageChanged: 'Sprache geändert zu: **{language}**',
		currentLanguage: 'Aktuelle Sprache: **{language}**',
		availableLanguages: 'Verfügbare Sprachen: {languages}',
		today: 'Heute',
		tomorrow: 'Morgen',
		dayAfterTomorrow: 'Übermorgen',
		created: 'Erstellt',
		deleted: 'Gelöscht',
		updated: 'Aktualisiert',
		completed: 'Erledigt',

		// Events
		event: 'Termin',
		events: 'Termine',
		eventCreated: 'Termin erstellt: **{title}**',
		eventDeleted: 'Gelöscht: {title}',
		noEvents: 'Keine anstehenden Termine.',
		noEventsToday: 'Keine Termine für heute.',
		noEventsTomorrow: 'Keine Termine für morgen.',
		noEventsThisWeek: 'Keine Termine diese Woche.',
		upcomingEvents: 'Anstehende Termine',
		todayEvents: 'Termine heute',
		tomorrowEvents: 'Termine morgen',
		weekEvents: 'Termine diese Woche',

		// Calendars
		calendar: 'Kalender',
		calendars: 'Kalender',
		yourCalendars: 'Deine Kalender',

		// Time
		time: 'Zeit',
		allDay: 'ganztägig',
		location: 'Ort',

		// Help
		helpTitle: 'Kalender Bot - Hilfe',
		helpCommands: `**Befehle:**
• \`!add [Termin]\` - Neuen Termin erstellen
• \`!today\` - Heutige Termine
• \`!tomorrow\` - Morgige Termine
• \`!week\` - Termine diese Woche
• \`!events\` - Nächste 14 Tage
• \`!details [Nr]\` - Termindetails
• \`!delete [Nr]\` - Termin löschen
• \`!calendars\` - Alle Kalender
• \`!status\` - Bot-Status
• \`!language [de/en]\` - Sprache ändern`,
		helpSyntax: `**Syntax:**
\`Meeting morgen um 14:00\`
\`Zahnarzt am 15.02. um 10:30\`
\`Urlaub am 01.03. ganztägig\``,
		helpExamples: `**Beispiele:**
• \`Team Meeting morgen um 10:00\`
• \`Arzt am 20.02. um 15:30\`
• \`Geburtstag am 15.03. ganztägig\``,

		// Parsing errors
		couldNotParseDateTime: 'Konnte Datum/Uhrzeit nicht erkennen.',
		pleaseProvideTitle: 'Bitte gib einen Titel für den Termin an.',
	},

	contacts: {
		// Inherit common
		error: 'Fehler',
		errorOccurred: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
		notLoggedIn: 'Du bist nicht angemeldet.',
		loginRequired: 'Bitte melde dich zuerst an mit `!login email passwort`',
		loginSuccess: 'Erfolgreich angemeldet als **{email}**',
		loginFailed: 'Anmeldung fehlgeschlagen: {error}',
		logoutSuccess: 'Erfolgreich abgemeldet.',
		invalidCommand: 'Unbekannter Befehl: {command}',
		helpHint: 'Sag "hilfe" für alle Befehle.',
		credits: 'Credits',
		creditsRemaining: '{amount} verbleibend',
		insufficientCredits: 'Nicht genügend Credits. Benötigt: {required}, Verfügbar: {available}',
		buyCredits: 'Credits kaufen: https://mana.how/credits',
		synced: 'Synchronisiert',
		localStorage: 'Lokaler Speicher',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Angemeldet als: {email}',
		notLoggedInStatus: 'Nicht angemeldet',
		languageChanged: 'Sprache geändert zu: **{language}**',
		currentLanguage: 'Aktuelle Sprache: **{language}**',
		availableLanguages: 'Verfügbare Sprachen: {languages}',
		today: 'Heute',
		tomorrow: 'Morgen',
		dayAfterTomorrow: 'Übermorgen',
		created: 'Erstellt',
		deleted: 'Gelöscht',
		updated: 'Aktualisiert',
		completed: 'Erledigt',

		// Contacts
		contact: 'Kontakt',
		contacts: 'Kontakte',
		contactCreated: 'Kontakt **{name}** erstellt!',
		contactDeleted: 'Kontakt **{name}** gelöscht.',
		contactUpdated: 'Kontakt **{name}** aktualisiert!',
		noContacts: 'Du hast noch keine Kontakte.',

		// Favorites
		favorite: 'Favorit',
		favorites: 'Favoriten',
		noFavorites: 'Du hast noch keine Favoriten.',
		markedAsFavorite: '**{name}** als Favorit markiert ★',
		removedFromFavorites: '**{name}** aus Favoriten entfernt',

		// Search
		search: 'Suche',
		searchResults: 'Suchergebnisse für "{query}"',
		noSearchResults: 'Keine Kontakte gefunden für: "{query}"',

		// Fields
		email: 'E-Mail',
		phone: 'Telefon',
		mobile: 'Mobil',
		company: 'Firma',
		jobTitle: 'Beruf',
		address: 'Adresse',
		website: 'Website',
		birthday: 'Geburtstag',
		notes: 'Notizen',

		// Help
		helpTitle: 'Contacts Bot - Hilfe',
		helpCommands: `**Befehle:**
• \`!contacts\` - Alle Kontakte
• \`!search [text]\` - Kontakte suchen
• \`!favorites\` - Favoriten anzeigen
• \`!contact [Nr]\` - Kontaktdetails
• \`!add Vorname Nachname\` - Neuer Kontakt
• \`!edit [Nr] [feld] [wert]\` - Bearbeiten
• \`!delete [Nr]\` - Kontakt löschen
• \`!fav [Nr]\` - Favorit umschalten
• \`!status\` - Bot-Status
• \`!language [de/en]\` - Sprache ändern`,
		helpFields: `**Felder:** email, phone, mobile, company, job, website, street, city, zip, country, notes, birthday`,
		helpExamples: `**Beispiele:**
• \`Max Mustermann\`
• \`!edit 1 email max@example.com\`
• \`!edit 1 phone +49 123 456789\``,
	},

	clock: {
		// Inherit common
		error: 'Fehler',
		errorOccurred: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
		notLoggedIn: 'Du bist nicht angemeldet.',
		loginRequired: 'Bitte melde dich zuerst an mit `!login email passwort`',
		loginSuccess: 'Erfolgreich angemeldet als **{email}**',
		loginFailed: 'Anmeldung fehlgeschlagen: {error}',
		logoutSuccess: 'Erfolgreich abgemeldet.',
		invalidCommand: 'Unbekannter Befehl: {command}',
		helpHint: 'Sag "hilfe" für alle Befehle.',
		credits: 'Credits',
		creditsRemaining: '{amount} verbleibend',
		insufficientCredits: 'Nicht genügend Credits. Benötigt: {required}, Verfügbar: {available}',
		buyCredits: 'Credits kaufen: https://mana.how/credits',
		synced: 'Synchronisiert',
		localStorage: 'Lokaler Speicher',
		status: 'Status',
		online: 'Online',
		offline: 'Offline',
		loggedInAs: 'Angemeldet als: {email}',
		notLoggedInStatus: 'Nicht angemeldet',
		languageChanged: 'Sprache geändert zu: **{language}**',
		currentLanguage: 'Aktuelle Sprache: **{language}**',
		availableLanguages: 'Verfügbare Sprachen: {languages}',
		today: 'Heute',
		tomorrow: 'Morgen',
		dayAfterTomorrow: 'Übermorgen',
		created: 'Erstellt',
		deleted: 'Gelöscht',
		updated: 'Aktualisiert',
		completed: 'Erledigt',

		// Timer
		timer: 'Timer',
		timerStarted: 'Timer gestartet!',
		timerPaused: 'Timer pausiert',
		timerResumed: 'Timer fortgesetzt',
		timerReset: 'Timer zurückgesetzt.',
		timerFinished: 'Timer beendet!',
		noActiveTimer: 'Kein aktiver Timer.',
		noPausedTimer: 'Kein pausierter Timer.',
		noTimers: 'Keine Timer.',
		remaining: 'Verbleibend',
		duration: 'Dauer',
		label: 'Label',

		// Alarm
		alarm: 'Alarm',
		alarmSet: 'Alarm gestellt!',
		alarmDeleted: 'Alarm gelöscht.',
		noAlarms: 'Keine Alarme.',
		yourAlarms: 'Deine Alarme',

		// World Clock
		worldClock: 'Weltuhr',
		worldClocks: 'Weltuhren',
		worldClockAdded: 'Weltuhr hinzugefügt: {city}',
		noWorldClocks: 'Keine Weltuhren.',
		yourWorldClocks: 'Deine Weltuhren',

		// Time
		currentTime: 'Aktuelle Zeit',

		// Help
		helpTitle: 'Clock Bot - Hilfe',
		helpCommands: `**Befehle:**
• \`!timer 25m\` - Timer starten
• \`!stop\` - Timer pausieren
• \`!resume\` - Timer fortsetzen
• \`!reset\` - Timer zurücksetzen
• \`!timers\` - Alle Timer
• \`!alarm 07:30\` - Alarm stellen
• \`!alarms\` - Alle Alarme
• \`!time\` - Aktuelle Zeit
• \`!worldclock Berlin\` - Weltuhr hinzufügen
• \`!worldclocks\` - Alle Weltuhren
• \`!status\` - Bot-Status
• \`!language [de/en]\` - Sprache ändern`,
		helpExamples: `**Beispiele:**
• \`25\` (25 Minuten Timer)
• \`1h30m\` (1,5 Stunden Timer)
• \`!alarm 7 Uhr 30\``,

		// Parsing errors
		couldNotParseDuration: 'Konnte Zeit nicht verstehen.',
		couldNotParseTime: 'Konnte Uhrzeit nicht verstehen.',
	},
};
