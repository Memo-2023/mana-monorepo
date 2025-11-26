<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		const unsubscribe = user.subscribe((currentUser) => {
			if (currentUser) {
				goto('/app/gallery');
			} else {
				goto('/auth/login');
			}
		});

		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Picture - AI Image Generation</title>
</svelte:head>

<!-- Redirect happens in onMount -->
