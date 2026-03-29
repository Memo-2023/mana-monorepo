import { browser } from '$app/environment';
import { createUserSettingsStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		if (injectedUrl) return injectedUrl;
	}
	return import.meta.env.DEV ? 'http://localhost:3001' : '';
}

export const userSettings = createUserSettingsStore({
	appId: 'mana-games',
	authUrl: getAuthUrl,
	getAccessToken: () => authStore.getAccessToken(),
});
