/**
 * Feedback Service Instance for Moodlit Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/authStore.svelte';

const MANA_AUTH_URL = 'http://localhost:3001';

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'moodlit',
	getAuthToken: async () => authStore.getAccessToken(),
});
