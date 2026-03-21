<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	onMount(() => {
		if (authStore.isAuthenticated) {
			goto('/library', { replaceState: true });
		} else {
			goto('/login', { replaceState: true });
		}
	});
</script>

<svelte:head>
	<title>Mukke</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center">
	<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
</div>
