<script lang="ts">
	import { browser } from '$app/environment';
	import { FeedbackPage } from '@manacore/feedback';
	import { createFeedbackService } from '@manacore/feedback';
	import { matrixStore } from '$lib/matrix';

	function getAuthUrl(): string {
		if (browser && typeof window !== 'undefined') {
			const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
				.__PUBLIC_MANA_CORE_AUTH_URL__;
			return injectedUrl || 'http://localhost:3001';
		}
		return 'http://localhost:3001';
	}

	const feedbackService = createFeedbackService({
		appId: 'matrix',
		apiUrl: getAuthUrl(),
	});
</script>

<FeedbackPage
	{feedbackService}
	appName="Manalink"
	currentUserId={matrixStore.userId || undefined}
/>
