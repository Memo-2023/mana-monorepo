<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { onMount } from 'svelte';

	// Import and initialize theme
	import { theme } from '$lib/stores/theme';

	// Initialize i18n
	import '$lib/i18n';

	let { children, data } = $props();

	onMount(() => {
		// Initialize theme (applies CSS variables and loads from localStorage)
		const cleanupTheme = theme.initialize();

		// Initialize auth with Mana Core
		authStore.initialize();

		return () => {
			cleanupTheme();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<!-- Umami Analytics -->
	{#if import.meta.env.PUBLIC_UMAMI_WEBSITE_ID && import.meta.env.PUBLIC_UMAMI_URL}
		<script
			defer
			src={`${import.meta.env.PUBLIC_UMAMI_URL}/script.js`}
			data-website-id={import.meta.env.PUBLIC_UMAMI_WEBSITE_ID}
			data-do-not-track="true"
		></script>
	{/if}
</svelte:head>

{@render children?.()}

<!-- Global Toast Notifications -->
<Toast />
