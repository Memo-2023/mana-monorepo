/**
 * User Settings Store for Calendar
 *
 * This store syncs settings with mana-core-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 *
 * Uses lazy initialization to wait for runtime config to load.
 */

import { browser } from '$app/environment';
import { createUserSettingsStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';
import { getAuthUrl as getRuntimeAuthUrl } from '$lib/config/runtime';

// Get auth URL with fallback for early access (before runtime config loads)
function getAuthUrlSync(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return 'http://localhost:3001';
}

// Lazy-initialized store (created after runtime config is loaded)
let _store: ReturnType<typeof createUserSettingsStore> | null = null;

function getOrCreateStore(authUrl?: string) {
	if (!_store) {
		_store = createUserSettingsStore({
			appId: 'calendar',
			authUrl: authUrl || getAuthUrlSync(),
			getAccessToken: () => authStore.getAccessToken(),
		});
	}
	return _store;
}

// Ensure store is initialized with correct URL from runtime config
async function ensureStore() {
	if (!_store) {
		const authUrl = await getRuntimeAuthUrl();
		_store = createUserSettingsStore({
			appId: 'calendar',
			authUrl,
			getAccessToken: () => authStore.getAccessToken(),
		});
	}
	return _store;
}

// Export proxy that lazily initializes the store
export const userSettings = {
	// Getters - use sync store (may have fallback URL initially)
	get nav() {
		return getOrCreateStore().nav;
	},
	get theme() {
		return getOrCreateStore().theme;
	},
	get locale() {
		return getOrCreateStore().locale;
	},
	get general() {
		return getOrCreateStore().general;
	},
	get startPage() {
		return getOrCreateStore().startPage;
	},
	get globalSettings() {
		return getOrCreateStore().globalSettings;
	},
	get hasAppOverride() {
		return getOrCreateStore().hasAppOverride;
	},
	get syncing() {
		return getOrCreateStore().syncing;
	},
	get loaded() {
		return getOrCreateStore().loaded;
	},
	get deviceId() {
		return getOrCreateStore().deviceId;
	},
	get deviceSettings() {
		return getOrCreateStore().deviceSettings;
	},
	get currentDeviceAppSettings() {
		return getOrCreateStore().currentDeviceAppSettings;
	},

	// Methods that make API calls - ensure store has correct URL
	async load() {
		const store = await ensureStore();
		return store.load();
	},
	async updateGlobal(
		settings: Parameters<ReturnType<typeof createUserSettingsStore>['updateGlobal']>[0]
	) {
		const store = await ensureStore();
		return store.updateGlobal(settings);
	},
	async updateAppOverride(
		settings: Parameters<ReturnType<typeof createUserSettingsStore>['updateAppOverride']>[0]
	) {
		const store = await ensureStore();
		return store.updateAppOverride(settings);
	},
	async removeAppOverride() {
		const store = await ensureStore();
		return store.removeAppOverride();
	},
	async setStartPage(appId: string, path: string) {
		const store = await ensureStore();
		return store.setStartPage(appId, path);
	},
	async updateGeneral(
		settings: Parameters<ReturnType<typeof createUserSettingsStore>['updateGeneral']>[0]
	) {
		const store = await ensureStore();
		return store.updateGeneral(settings);
	},
	getHiddenNavItemsForApp(appId: string) {
		return getOrCreateStore().getHiddenNavItemsForApp(appId);
	},
	async toggleNavItemVisibility(appId: string, href: string) {
		const store = await ensureStore();
		return store.toggleNavItemVisibility(appId, href);
	},
	async setHiddenNavItems(appId: string, hiddenHrefs: string[]) {
		const store = await ensureStore();
		return store.setHiddenNavItems(appId, hiddenHrefs);
	},
	async updateDeviceAppSettings(settings: Record<string, unknown>) {
		const store = await ensureStore();
		return store.updateDeviceAppSettings(settings);
	},
	getDeviceAppSettings() {
		return getOrCreateStore().getDeviceAppSettings();
	},
	async getDevices() {
		const store = await ensureStore();
		return store.getDevices();
	},
	async removeDevice(deviceId: string) {
		const store = await ensureStore();
		return store.removeDevice(deviceId);
	},
};
