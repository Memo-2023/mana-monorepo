<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores';
	import { onMount } from 'svelte';

	onMount(() => {
		if (authStore.isAuthenticated) {
			goto('/items');
		} else {
			goto('/login');
		}
	});
</script>

<div class="flex h-screen items-center justify-center">
	<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
</div>
