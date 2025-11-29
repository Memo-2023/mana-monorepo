/**
 * Feedback Service Instance for Zitare Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/auth.svelte';

const MANA_AUTH_URL = 'http://localhost:3001'; // TODO: Use PUBLIC_MANA_CORE_AUTH_URL from env

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'zitare',
	getAuthToken: async () => authStore.getAccessToken(),
});
