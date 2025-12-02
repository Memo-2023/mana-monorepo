<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast';
	import { FeedbackPage } from '@manacore/shared-feedback-ui';
	import { createFeedbackService } from '@manacore/shared-feedback-service';
	import { env } from '$env/dynamic/public';

	const feedbackService = createFeedbackService(
		env.PUBLIC_BACKEND_URL || 'http://localhost:3014'
	);

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
	});

	async function handleSubmit(type: string, message: string) {
		const token = await authStore.getAccessToken();
		if (!token) {
			toast.error('Bitte melden Sie sich an');
			return { success: false, error: 'Not authenticated' };
		}

		const result = await feedbackService.submit(
			{ type: type as any, message },
			token
		);

		if (!result.success) {
			toast.error(result.error || 'Fehler beim Senden');
			return result;
		}

		toast.success('Feedback gesendet. Vielen Dank!');
		return result;
	}
</script>

<svelte:head>
	<title>Feedback | Kalender</title>
</svelte:head>

<FeedbackPage onSubmit={handleSubmit} appName="Kalender" />
