/**
 * Feedback Service Instance for Picture Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/auth.svelte';
import { env } from '$env/dynamic/public';

const MANA_AUTH_URL = env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'picture',
	getAuthToken: async () => authStore.getAccessToken(),
});
