<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(async () => {
		await authStore.initialize();
		if (authStore.isAuthenticated) {
			goto('/app/gallery');
		} else {
			goto('/auth/login');
		}
	});
</script>

<svelte:head>
	<title>Picture - AI Image Generation</title>
</svelte:head>

<!-- Redirect happens in onMount -->
