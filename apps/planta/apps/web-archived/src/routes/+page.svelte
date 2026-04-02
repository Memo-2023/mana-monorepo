<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	onMount(() => {
		if (authStore.isAuthenticated) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div
		class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
	></div>
</div>
