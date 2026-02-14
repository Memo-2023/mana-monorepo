/**
 * Feedback Service Instance for ManaCore Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from './config';

export const feedbackService = createFeedbackService({
	apiUrl: getManaAuthUrl(),
	appId: 'manacore',
	getAuthToken: async () => authStore.getAccessToken(),
});
