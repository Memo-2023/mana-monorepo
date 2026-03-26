/**
 * Tag Store - Uses shared createTagStore backed by central mana-core-auth
 *
 * Matrix uses its own auth (Matrix homeserver), not mana-core-auth directly.
 * The mana-core-auth token is obtained via session-to-token exchange and stored
 * in localStorage. Tags will work when user has a mana-core-auth session.
 */
import { browser } from '$app/environment';
import { createTagStore } from '@manacore/shared-stores';
import { loadStoredAccessToken } from '$lib/stores/userSettings.svelte';

const AUTH_URL = import.meta.env.VITE_MANA_AUTH_URL || 'https://auth.mana.how';

function getAuthUrl(): string {
	return AUTH_URL;
}

export const tagStore = createTagStore({
	authUrl: getAuthUrl(),
	getToken: () => {
		if (!browser) return null;
		return loadStoredAccessToken();
	},
});
