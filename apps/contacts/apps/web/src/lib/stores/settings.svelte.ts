/**
 * Settings Store - Manages user preferences for the Contacts app
 * Uses @manacore/shared-stores createAppSettingsStore factory
 */

import { createAppSettingsStore } from '@manacore/shared-stores';

// Settings types
export type ContactSortBy = 'name' | 'company' | 'created' | 'updated';
export type ContactSortOrder = 'asc' | 'desc';
export type ContactView = 'grid' | 'alphabet' | 'network';
export type DateFormat = 'dd.MM.yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';

export interface ContactsAppSettings {
	// Display Settings
	defaultView: ContactView;
	sortBy: ContactSortBy;
	sortOrder: ContactSortOrder;
	showPhotos: boolean;
	showCompany: boolean;
	contactsPerPage: number;

	// Contact Display
	nameFormat: 'first-last' | 'last-first';
	dateFormat: DateFormat;
	showBirthdayReminders: boolean;
	birthdayReminderDays: number;

	// Import/Export
	defaultExportFormat: 'vcf' | 'csv' | 'json';
	includeNotesInExport: boolean;
	includePhotosInExport: boolean;

	// Duplicates
	autoDetectDuplicates: boolean;
	duplicateSensitivity: 'strict' | 'normal' | 'loose';

	// Privacy
	privacyMode: boolean;
	confirmBeforeSharing: boolean;

	// Alphabet Navigation Settings
	alphabetNavHideInactive: boolean;
	alphabetNavCompact: boolean;
	alphabetNavReverseOrder: boolean;
	alphabetNavShowHash: boolean;

	// Immersive Mode
	immersiveModeEnabled: boolean;
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

	// Immersive Mode
	immersiveModeEnabled: false,
};

// Create base store using factory
const baseStore = createAppSettingsStore<ContactsAppSettings>(
	'contacts-settings',
	DEFAULT_SETTINGS
);

// Export with convenience getters for backwards compatibility
export const contactsSettings = {
	// Base store methods
	get settings() {
		return baseStore.settings;
	},
	initialize: baseStore.initialize,
	set: baseStore.set,
	update: baseStore.update,
	reset: baseStore.reset,
	getDefaults: baseStore.getDefaults,
	toggleImmersiveMode: baseStore.toggleImmersiveMode,

	// Convenience getters (backwards compatible)
	get defaultView() {
		return baseStore.settings.defaultView;
	},
	get sortBy() {
		return baseStore.settings.sortBy;
	},
	get sortOrder() {
		return baseStore.settings.sortOrder;
	},
	get showPhotos() {
		return baseStore.settings.showPhotos;
	},
	get showCompany() {
		return baseStore.settings.showCompany;
	},
	get contactsPerPage() {
		return baseStore.settings.contactsPerPage;
	},
	get nameFormat() {
		return baseStore.settings.nameFormat;
	},
	get dateFormat() {
		return baseStore.settings.dateFormat;
	},
	get showBirthdayReminders() {
		return baseStore.settings.showBirthdayReminders;
	},
	get birthdayReminderDays() {
		return baseStore.settings.birthdayReminderDays;
	},
	get defaultExportFormat() {
		return baseStore.settings.defaultExportFormat;
	},
	get includeNotesInExport() {
		return baseStore.settings.includeNotesInExport;
	},
	get includePhotosInExport() {
		return baseStore.settings.includePhotosInExport;
	},
	get autoDetectDuplicates() {
		return baseStore.settings.autoDetectDuplicates;
	},
	get duplicateSensitivity() {
		return baseStore.settings.duplicateSensitivity;
	},
	get privacyMode() {
		return baseStore.settings.privacyMode;
	},
	get confirmBeforeSharing() {
		return baseStore.settings.confirmBeforeSharing;
	},
	get alphabetNavHideInactive() {
		return baseStore.settings.alphabetNavHideInactive;
	},
	get alphabetNavCompact() {
		return baseStore.settings.alphabetNavCompact;
	},
	get alphabetNavReverseOrder() {
		return baseStore.settings.alphabetNavReverseOrder;
	},
	get alphabetNavShowHash() {
		return baseStore.settings.alphabetNavShowHash;
	},
	get immersiveModeEnabled() {
		return baseStore.settings.immersiveModeEnabled;
	},
};
