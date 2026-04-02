<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	onMount(async () => {
		await authStore.initialize();

		if (authStore.isAuthenticated) {
			goto('/chat', { replaceState: true });
		} else {
			goto('/login', { replaceState: true });
		}
	});
</script>

<svelte:head>
	<title>ManaChat - AI Chat Assistant</title>
	<meta name="description" content="Chat with AI models - GPT-4o, GPT-4o-Mini, and more" />
</svelte:head>

<div class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<div
			class="animate-spin w-10 h-10 border-4 border-primary border-r-transparent rounded-full mx-auto"
		></div>
		<p class="mt-4 text-muted-foreground">Wird geladen...</p>
	</div>
</div>
