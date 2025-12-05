<script lang="ts">
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { createFeedbackService } from '@manacore/shared-feedback-service';
	import { authStore } from '$lib/stores/auth.svelte';

	const feedbackService = createFeedbackService({
		appName: 'mail',
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

<FeedbackPage appName="Mail" onSubmit={handleSubmit} userEmail={authStore.user?.email} />
