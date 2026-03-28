/**
 * Feedback Service Instance for ManaDeck Web App
 */

import { createFeedbackService } from '@manacore/feedback';
import { authService } from '$lib/auth';
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

const MANA_AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

export const feedbackService = createFeedbackService({
	apiUrl: MANA_AUTH_URL,
	appId: 'manadeck',
	getAuthToken: async () => authService.getAppToken(),
});
