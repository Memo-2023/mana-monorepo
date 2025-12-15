/**
 * User Settings Store for ManaCore
 *
 * This store syncs settings with mana-core-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 */

import { createUserSettingsStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';
import { getAuthUrl } from '$lib/config/runtime';

// Create store with async initialization
export const userSettings = createUserSettingsStore({
	appId: 'manacore',
	authUrl: 'http://localhost:3001', // Will be updated after config loads
	getAccessToken: () => authStore.getAccessToken(),
});

// Update auth URL after runtime config loads
getAuthUrl().then((url) => {
	// Update the store's auth URL after config loads
	if (userSettings.settings) {
		(userSettings.settings as { authUrl: string }).authUrl = url;
	}
});
