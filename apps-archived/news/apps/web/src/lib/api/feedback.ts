/**
 * Feedback Service Instance for News Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/auth.svelte';
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

const MANA_AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'news',
	getAuthToken: async () => authStore.getAccessToken(),
});
