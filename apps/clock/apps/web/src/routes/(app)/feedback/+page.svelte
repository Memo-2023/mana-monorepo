<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { createFeedbackService } from '@manacore/shared-feedback-service';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	const feedbackService = createFeedbackService({
		appName: 'clock',
		apiUrl: 'http://localhost:3001', // Mana Core API
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
