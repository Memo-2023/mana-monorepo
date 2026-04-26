/**
 * Lasts Settings Store — opt-in toggles for the in-app DueBanner.
 *
 * No OS push integration yet (see docs/plans/lasts-module.md M5.b).
 * These flags only gate which categories of "today touches a last"
 * surfacing happens inside the app shell.
 *
 * Persisted in localStorage via the shared `createAppSettingsStore`
 * factory — same pattern as todo/broadcast/invoices module settings.
 */

import { createAppSettingsStore } from '@mana/shared-stores';

export interface LastsAppSettings extends Record<string, unknown> {
	/** Show "vor X Jahren das letzte Mal …" for confirmed lasts on their anniversary day. */
	anniversaryReminders: boolean;
	/** Show "vor X Jahren als Last erkannt: …" on recognisedAt anniversary. */
	recognitionReminders: boolean;
	/** Surface "X neue Vorschläge in der Inbox" badge on the banner. */
	inboxNotify: boolean;
	/** Hard cap on banner items shown at once. Inbox notify counts as one. */
	bannerMaxItems: number;
}

const DEFAULT_SETTINGS: LastsAppSettings = {
	anniversaryReminders: true,
	recognitionReminders: true,
	inboxNotify: true,
	bannerMaxItems: 3,
};

const baseStore = createAppSettingsStore<LastsAppSettings>('lasts-settings', DEFAULT_SETTINGS);

export const lastsSettings = {
	get settings() {
		return baseStore.settings;
	},
	initialize: baseStore.initialize,
	set: baseStore.set,
	update: baseStore.update,
	reset: baseStore.reset,
	getDefaults: baseStore.getDefaults,

	get anniversaryReminders() {
		return baseStore.settings.anniversaryReminders;
	},
	get recognitionReminders() {
		return baseStore.settings.recognitionReminders;
	},
	get inboxNotify() {
		return baseStore.settings.inboxNotify;
	},
	get bannerMaxItems() {
		return baseStore.settings.bannerMaxItems;
	},
};
