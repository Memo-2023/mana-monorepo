/**
 * Feedback Service Instance for Mana Web App
 */

import { createFeedbackService } from '@mana/feedback';
import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from './config';

export const feedbackService = createFeedbackService({
	apiUrl: getManaAuthUrl(),
	appId: 'mana',
	getAuthToken: async () => authStore.getAccessToken(),
});
