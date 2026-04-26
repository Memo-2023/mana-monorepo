/**
 * Feedback Service Instance for Mana Web App.
 *
 * Talks to mana-analytics (port 3064 in dev). Two factories:
 *  - feedbackService: auth-required for submit/react/admin
 *  - publicFeedbackService: anonymous read-only for SSR + non-logged-in
 */

import { createFeedbackService, createPublicFeedbackService } from '@mana/feedback';
import { authStore } from '$lib/stores/auth.svelte';
import { getManaAnalyticsUrl } from './config';

export const feedbackService = createFeedbackService({
	apiUrl: getManaAnalyticsUrl(),
	appId: 'mana',
	getAuthToken: async () => authStore.getValidToken(),
});

export const publicFeedbackService = createPublicFeedbackService({
	apiUrl: getManaAnalyticsUrl(),
	appId: 'mana',
});
