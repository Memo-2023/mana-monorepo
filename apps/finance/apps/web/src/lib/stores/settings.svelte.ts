import { settingsApi } from '$lib/api';
import type { UserSettings, UpdateUserSettingsInput } from '@finance/shared';

const DEFAULT_SETTINGS: UserSettings = {
	id: '',
	userId: '',
	defaultCurrency: 'EUR',
	locale: 'de-DE',
	dateFormat: 'dd.MM.yyyy',
	weekStartsOn: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
};

let settings = $state<UserSettings>(DEFAULT_SETTINGS);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const settingsStore = {
	get settings() {
		return settings;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},

	get currency() {
		return settings.defaultCurrency;
	},

	get locale() {
		return settings.locale;
	},

	get dateFormat() {
		return settings.dateFormat;
	},

	async fetchSettings() {
		isLoading = true;
		error = null;
		try {
			settings = await settingsApi.get();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch settings';
		} finally {
			isLoading = false;
		}
	},

	async updateSettings(data: UpdateUserSettingsInput) {
		isLoading = true;
		error = null;
		try {
			settings = await settingsApi.update(data);
			return settings;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update settings';
			throw e;
		} finally {
			isLoading = false;
		}
	},
};
