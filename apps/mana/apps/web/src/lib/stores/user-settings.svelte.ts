/**
 * User Settings Store for Mana
 *
 * This store syncs settings with mana-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 */

import { browser } from '$app/environment';
import { createUserSettingsStore } from '@mana/shared-theme';
import { authStore } from './auth.svelte';

// Get auth URL dynamically at runtime
function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
			.__PUBLIC_MANA_AUTH_URL__;
		if (injectedUrl) return injectedUrl;
	}
	return import.meta.env.DEV ? 'http://localhost:3001' : '';
}

export const userSettings = createUserSettingsStore({
	appId: 'mana',
	authUrl: getAuthUrl,
	getAccessToken: () => authStore.getValidToken(),
});
