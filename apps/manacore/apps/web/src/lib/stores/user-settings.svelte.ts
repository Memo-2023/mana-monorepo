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

// Initialize auth URL from runtime config
let authUrl = 'http://localhost:3001'; // default fallback
getAuthUrl().then((url) => {
	authUrl = url;
});

// Create store with async initialization
export const userSettings = createUserSettingsStore({
	appId: 'manacore',
	get authUrl() {
		return authUrl;
	},
	getAccessToken: () => authStore.getAccessToken(),
});
