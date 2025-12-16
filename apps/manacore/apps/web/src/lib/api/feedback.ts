/**
 * Feedback Service Instance for ManaCore Web App
 *
 * Uses runtime configuration for 12-factor compliance
 */

import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/auth.svelte';
import { getAuthUrl } from '$lib/config/runtime';

// Lazy initialization to allow runtime config to load first
let _feedbackService: ReturnType<typeof createFeedbackService> | null = null;

async function getFeedbackService() {
	if (!_feedbackService) {
		const authUrl = await getAuthUrl();
		_feedbackService = createFeedbackService({
			apiUrl: authUrl,
			appId: 'manacore',
			getAuthToken: async () => authStore.getAccessToken(),
		});
	}
	return _feedbackService;
}

// Export the async getter for components
export { getFeedbackService as getService };
