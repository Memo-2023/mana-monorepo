/**
 * Supported languages
 */
export type Language = 'de' | 'en';

/**
 * Common translations shared across all bots
 */
export interface CommonTranslations {
	// General
	error: string;
	errorOccurred: string;
	notLoggedIn: string;
	loginRequired: string;
	loginSuccess: string;
	loginFailed: string;
	logoutSuccess: string;
	invalidCommand: string;
	helpHint: string;

	// Credits
	credits: string;
	creditsRemaining: string;
	insufficientCredits: string;
	buyCredits: string;

	// Sync
	synced: string;
	localStorage: string;

	// Status
	status: string;
	online: string;
	offline: string;
	loggedInAs: string;
	notLoggedInStatus: string;

	// Language
	languageChanged: string;
	currentLanguage: string;
	availableLanguages: string;

	// Dates
	today: string;
	tomorrow: string;
	dayAfterTomorrow: string;

	// Actions
	created: string;
	deleted: string;
	updated: string;
	completed: string;
}

/**
 * Todo bot translations
 */
export interface TodoTranslations extends CommonTranslations {
	// Tasks
	task: string;
	tasks: string;
	taskCreated: string;
	taskCompleted: string;
	taskDeleted: string;
	noTasks: string;
	noTasksToday: string;
	inboxEmpty: string;
	allTasks: string;
	todayTasks: string;
	inbox: string;

	// Projects
	project: string;
	projects: string;
	noProjects: string;
	projectTasks: string;

	// Priorities
	priority: string;
	date: string;

	// Help
	helpTitle: string;
	helpCommands: string;
	helpSyntax: string;
	helpExamples: string;

	// Actions
	markDone: string;
	delete: string;
}

/**
 * Calendar bot translations
 */
export interface CalendarTranslations extends CommonTranslations {
	// Events
	event: string;
	events: string;
	eventCreated: string;
	eventDeleted: string;
	noEvents: string;
	noEventsToday: string;
	noEventsTomorrow: string;
	noEventsThisWeek: string;
	upcomingEvents: string;
	todayEvents: string;
	tomorrowEvents: string;
	weekEvents: string;

	// Calendars
	calendar: string;
	calendars: string;
	yourCalendars: string;

	// Time
	time: string;
	allDay: string;
	location: string;

	// Help
	helpTitle: string;
	helpCommands: string;
	helpSyntax: string;
	helpExamples: string;

	// Parsing errors
	couldNotParseDateTime: string;
	pleaseProvideTitle: string;
}

/**
 * Contacts bot translations
 */
export interface ContactsTranslations extends CommonTranslations {
	// Contacts
	contact: string;
	contacts: string;
	contactCreated: string;
	contactDeleted: string;
	contactUpdated: string;
	noContacts: string;

	// Favorites
	favorite: string;
	favorites: string;
	noFavorites: string;
	markedAsFavorite: string;
	removedFromFavorites: string;

	// Search
	search: string;
	searchResults: string;
	noSearchResults: string;

	// Fields
	email: string;
	phone: string;
	mobile: string;
	company: string;
	jobTitle: string;
	address: string;
	website: string;
	birthday: string;
	notes: string;

	// Help
	helpTitle: string;
	helpCommands: string;
	helpFields: string;
	helpExamples: string;
}

/**
 * Clock bot translations
 */
export interface ClockTranslations extends CommonTranslations {
	// Timer
	timer: string;
	timerStarted: string;
	timerPaused: string;
	timerResumed: string;
	timerReset: string;
	timerFinished: string;
	noActiveTimer: string;
	noPausedTimer: string;
	noTimers: string;
	remaining: string;
	duration: string;
	label: string;

	// Alarm
	alarm: string;
	alarmSet: string;
	alarmDeleted: string;
	noAlarms: string;
	yourAlarms: string;

	// World Clock
	worldClock: string;
	worldClocks: string;
	worldClockAdded: string;
	noWorldClocks: string;
	yourWorldClocks: string;

	// Time
	currentTime: string;

	// Help
	helpTitle: string;
	helpCommands: string;
	helpExamples: string;

	// Parsing errors
	couldNotParseDuration: string;
	couldNotParseTime: string;
}

/**
 * All bot translations combined
 */
export interface BotTranslations {
	common: CommonTranslations;
	todo: TodoTranslations;
	calendar: CalendarTranslations;
	contacts: ContactsTranslations;
	clock: ClockTranslations;
}

/**
 * I18n service options
 */
export interface I18nOptions {
	defaultLanguage?: Language;
}
