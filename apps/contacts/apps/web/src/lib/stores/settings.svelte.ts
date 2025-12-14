/**
 * Settings Store - Manages user preferences for the Contacts app
 * Uses Svelte 5 runes and localStorage for persistence
 */

import { browser } from '$app/environment';

// Settings types
export type ContactSortBy = 'name' | 'company' | 'created' | 'updated';
export type ContactSortOrder = 'asc' | 'desc';
export type ContactView = 'grid' | 'alphabet' | 'network';
export type DateFormat = 'dd.MM.yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';

export interface ContactsAppSettings {
	// Display Settings
	/** Default view mode for contacts list */
	defaultView: ContactView;
	/** Default sort field */
	sortBy: ContactSortBy;
	/** Default sort order */
	sortOrder: ContactSortOrder;
	/** Show contact photos in list */
	showPhotos: boolean;
	/** Show company name in list */
	showCompany: boolean;
	/** Contacts per page in list view */
	contactsPerPage: number;

	// Contact Display
	/** Display name format: 'first-last' or 'last-first' */
	nameFormat: 'first-last' | 'last-first';
	/** Date format for birthdays etc. */
	dateFormat: DateFormat;
	/** Show birthday reminders */
	showBirthdayReminders: boolean;
	/** Days before birthday to remind */
	birthdayReminderDays: number;

	// Import/Export
	/** Default export format */
	defaultExportFormat: 'vcf' | 'csv' | 'json';
	/** Include notes in export */
	includeNotesInExport: boolean;
	/** Include photos in export */
	includePhotosInExport: boolean;

	// Duplicates
	/** Auto-detect duplicates on import */
	autoDetectDuplicates: boolean;
	/** Duplicate detection sensitivity: 'strict' | 'normal' | 'loose' */
	duplicateSensitivity: 'strict' | 'normal' | 'loose';

	// Privacy
	/** Blur contact photos by default (privacy mode) */
	privacyMode: boolean;
	/** Require confirmation before sharing contact */
	confirmBeforeSharing: boolean;

	// Alphabet Navigation Settings
	/** Hide letters that have no contacts */
	alphabetNavHideInactive: boolean;
	/** Use compact/smaller alphabet buttons */
	alphabetNavCompact: boolean;
	/** Reverse letter order (Z-A instead of A-Z) */
	alphabetNavReverseOrder: boolean;
	/** Show # symbol for non-letter names */
	alphabetNavShowHash: boolean;
}

const DEFAULT_SETTINGS: ContactsAppSettings = {
	// Display Settings
	defaultView: 'alphabet',
	sortBy: 'name',
	sortOrder: 'asc',
	showPhotos: true,
	showCompany: true,
	contactsPerPage: 50,

	// Contact Display
	nameFormat: 'first-last',
	dateFormat: 'dd.MM.yyyy',
	showBirthdayReminders: true,
	birthdayReminderDays: 7,

	// Import/Export
	defaultExportFormat: 'vcf',
	includeNotesInExport: true,
	includePhotosInExport: true,

	// Duplicates
	autoDetectDuplicates: true,
	duplicateSensitivity: 'normal',

	// Privacy
	privacyMode: false,
	confirmBeforeSharing: true,

	// Alphabet Navigation
	alphabetNavHideInactive: false,
	alphabetNavCompact: false,
	alphabetNavReverseOrder: false,
	alphabetNavShowHash: true,
};

const STORAGE_KEY = 'contacts-settings';

// Load settings from localStorage
function loadSettings(): ContactsAppSettings {
	if (!browser) return DEFAULT_SETTINGS;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Merge with defaults to handle new settings added in updates
			return { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch (e) {
		console.error('Failed to load contacts settings:', e);
	}

	return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: ContactsAppSettings) {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (e) {
		console.error('Failed to save contacts settings:', e);
	}
}

// State
let settings = $state<ContactsAppSettings>(loadSettings());

export const contactsSettings = {
	// Full settings object
	get settings() {
		return settings;
	},

	// Display Settings
	get defaultView() {
		return settings.defaultView;
	},
	get sortBy() {
		return settings.sortBy;
	},
	get sortOrder() {
		return settings.sortOrder;
	},
	get showPhotos() {
		return settings.showPhotos;
	},
	get showCompany() {
		return settings.showCompany;
	},
	get contactsPerPage() {
		return settings.contactsPerPage;
	},

	// Contact Display
	get nameFormat() {
		return settings.nameFormat;
	},
	get dateFormat() {
		return settings.dateFormat;
	},
	get showBirthdayReminders() {
		return settings.showBirthdayReminders;
	},
	get birthdayReminderDays() {
		return settings.birthdayReminderDays;
	},

	// Import/Export
	get defaultExportFormat() {
		return settings.defaultExportFormat;
	},
	get includeNotesInExport() {
		return settings.includeNotesInExport;
	},
	get includePhotosInExport() {
		return settings.includePhotosInExport;
	},

	// Duplicates
	get autoDetectDuplicates() {
		return settings.autoDetectDuplicates;
	},
	get duplicateSensitivity() {
		return settings.duplicateSensitivity;
	},

	// Privacy
	get privacyMode() {
		return settings.privacyMode;
	},
	get confirmBeforeSharing() {
		return settings.confirmBeforeSharing;
	},

	// Alphabet Navigation
	get alphabetNavHideInactive() {
		return settings.alphabetNavHideInactive;
	},
	get alphabetNavCompact() {
		return settings.alphabetNavCompact;
	},
	get alphabetNavReverseOrder() {
		return settings.alphabetNavReverseOrder;
	},
	get alphabetNavShowHash() {
		return settings.alphabetNavShowHash;
	},

	/**
	 * Initialize settings from localStorage
	 */
	initialize() {
		if (!browser) return;
		settings = loadSettings();
	},

	/**
	 * Update a single setting
	 */
	set<K extends keyof ContactsAppSettings>(key: K, value: ContactsAppSettings[K]) {
		settings = { ...settings, [key]: value };
		saveSettings(settings);
	},

	/**
	 * Update multiple settings at once
	 */
	update(updates: Partial<ContactsAppSettings>) {
		settings = { ...settings, ...updates };
		saveSettings(settings);
	},

	/**
	 * Reset all settings to defaults
	 */
	reset() {
		settings = { ...DEFAULT_SETTINGS };
		saveSettings(settings);
	},

	/**
	 * Get default settings (for reference)
	 */
	getDefaults() {
		return DEFAULT_SETTINGS;
	},
};
