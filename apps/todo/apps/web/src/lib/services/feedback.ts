/**
 * Feedback Service Instance for Todo Web App
 */

import { browser } from '$app/environment';
import { createFeedbackService } from '@manacore/feedback';
import { authStore } from '$lib/stores/auth.svelte';

// Get auth URL dynamically at runtime
function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return 'http://localhost:3001';
}

export const feedbackService = createFeedbackService({
	apiUrl: getAuthUrl(),
	appId: 'todo',
	getAuthToken: async () => authStore.getAccessToken(),
});
