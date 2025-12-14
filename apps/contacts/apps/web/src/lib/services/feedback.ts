/**
 * Feedback Service Instance for Contacts Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/auth.svelte';
import { MANA_AUTH_URL } from '$lib/api/config';

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'contacts',
	getAuthToken: async () => authStore.getAccessToken(),
});
