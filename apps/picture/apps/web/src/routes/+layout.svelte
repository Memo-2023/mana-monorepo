<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { onMount } from 'svelte';
	import { initPostHog, analytics } from '$lib/analytics/posthog';

	// Import theme stores to initialize them
	import '$lib/stores/theme';

	// Initialize i18n
	import '$lib/i18n';

	let { children, data } = $props();

	onMount(async () => {
		// Initialize PostHog
		initPostHog();

		// Initialize auth with Mana Core
		await authStore.initialize();

		// Identify user in PostHog if logged in
		if (authStore.user) {
			analytics.identify(authStore.user.id, {
				email: authStore.user.email
			});
		}
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
