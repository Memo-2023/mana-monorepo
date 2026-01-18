/**
 * User Settings Store for ManaCore
 *
 * This store syncs settings with mana-core-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 */

import { browser } from '$app/environment';
import { createUserSettingsStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';

// Get auth URL dynamically at runtime
function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return 'http://localhost:3001';
}

export const userSettings = createUserSettingsStore({
	appId: 'manacore',
	authUrl: getAuthUrl(),
	getAccessToken: () => authStore.getAccessToken(),
});
