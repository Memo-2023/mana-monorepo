/**
 * Feedback Service Instance for Presi Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { auth } from '$lib/stores/auth.svelte';
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

const MANA_AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'presi',
	getAuthToken: async () => auth.getAccessToken(),
});
