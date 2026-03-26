<script lang="ts">
	import { browser } from '$app/environment';
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { createFeedbackService } from '@manacore/shared-feedback-service';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	function getAuthUrl(): string {
		if (browser && typeof window !== 'undefined') {
			const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
				.__PUBLIC_MANA_CORE_AUTH_URL__;
			return injectedUrl || 'http://localhost:3001';
		}
		return 'http://localhost:3001';
	}

	const feedbackService = createFeedbackService({
		appId: 'photos',
		apiUrl: getAuthUrl(),
		getAuthToken: () => authStore.getValidToken(),
	});
</script>

<FeedbackPage {feedbackService} appName="Photos" currentUserId={authStore.user?.id} />
