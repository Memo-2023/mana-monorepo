/**
 * Feedback Service Instance for uLoad Web App
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { pb } from '$lib/pocketbase';
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

const MANA_AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'uload',
	getAuthToken: async () => pb.authStore.token || '',
});
