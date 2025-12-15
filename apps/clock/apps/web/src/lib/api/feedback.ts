/**
 * Feedback Service Instance for Clock Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/auth.svelte';
import { browser } from '$app/environment';

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
	appId: 'clock',
	getAuthToken: async () => authStore.getAccessToken(),
});
