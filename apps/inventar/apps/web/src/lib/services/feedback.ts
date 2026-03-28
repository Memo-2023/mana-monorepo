import { browser } from '$app/environment';
import { createFeedbackService } from '@manacore/feedback';
import { authStore } from '$lib/stores/auth.svelte';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		if (injectedUrl) return injectedUrl;
	}
	return import.meta.env.DEV ? 'http://localhost:3001' : '';
}

export const feedbackService = createFeedbackService({
	appId: 'inventar',
	authUrl: getAuthUrl,
	getAccessToken: () => authStore.getAccessToken(),
});
