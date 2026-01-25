<script lang="ts">
	import '../app.css';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	// Initialize auth on mount
	$effect(() => {
		authStore.initialize();
	});
</script>

<svelte:head>
	<title>NutriPhi - Ernährung verstehen</title>
</svelte:head>

{@render children()}
