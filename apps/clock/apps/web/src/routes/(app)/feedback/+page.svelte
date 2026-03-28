<script lang="ts">
	import { browser } from '$app/environment';
	import { FeedbackPage } from '@manacore/feedback';
	import { createFeedbackService } from '@manacore/feedback';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	// Get auth URL dynamically at runtime
	function getAuthUrl(): string {
		if (browser && typeof window !== 'undefined') {
			const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
				.__PUBLIC_MANA_CORE_AUTH_URL__;
			return injectedUrl || 'http://localhost:3001';
		}
		return 'http://localhost:3001';
	}

	const feedbackService = createFeedbackService({
		appName: 'clock',
		apiUrl: getAuthUrl(),
	});

	async function handleSubmit(data: { type: string; message: string; email?: string }) {
		const token = await authStore.getAccessToken();
		return feedbackService.submit({
			...data,
			token: token || undefined,
		});
	}
</script>

<FeedbackPage appName="Clock" onSubmit={handleSubmit} userEmail={authStore.user?.email} />
