<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { FeedbackPage } from '@manacore/shared-feedback-ui';

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Feedback | Todo</title>
</svelte:head>

<FeedbackPage
	appName="Todo"
	userEmail={authStore.user?.email || undefined}
	primaryColor="#8b5cf6"
/>
