/**
 * Feedback Service Instance for Chat Web App
 */

import { createFeedbackService } from '@manacore/feedback';
import { authStore } from '$lib/stores/auth.svelte';

// Use environment variable at runtime
const MANA_AUTH_URL = process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'chat',
	getAuthToken: async () => authStore.getAccessToken(),
});
