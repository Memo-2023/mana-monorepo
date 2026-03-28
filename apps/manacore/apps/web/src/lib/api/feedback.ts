/**
 * Feedback Service Instance for ManaCore Web App
 */

import { createFeedbackService } from '@manacore/feedback';
import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from './config';

export const feedbackService = createFeedbackService({
	apiUrl: getManaAuthUrl(),
	appId: 'manacore',
	getAuthToken: async () => authStore.getAccessToken(),
});
