/**
 * Tag Store - Uses shared createTagStore backed by central mana-core-auth
 */
import { browser } from '$app/environment';
import { createTagStore } from '@manacore/shared-stores';
import { auth } from '$lib/stores/auth.svelte';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return 'http://localhost:3001';
}

export const tagStore = createTagStore({
	authUrl: getAuthUrl(),
	getToken: () => auth.getValidToken(),
});
