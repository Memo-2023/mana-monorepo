import { createFeedbackService } from '@mana/feedback';
import { authStore } from '$lib/stores/auth.svelte';

export const feedbackService = createFeedbackService({
	apiUrl: import.meta.env.DEV ? 'http://localhost:3001' : 'https://auth.mana.how',
	appId: 'arcade',
	getAuthToken: async () => authStore.getAccessToken(),
});
