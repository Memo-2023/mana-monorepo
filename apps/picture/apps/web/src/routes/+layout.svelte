<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { supabase } from '$lib/supabase';
	import { user, session, loading } from '$lib/stores/auth';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { onMount } from 'svelte';
	import { initPostHog, analytics } from '$lib/analytics/posthog';

	// Import theme stores to initialize them
	import '$lib/stores/theme';

	// Initialize i18n
	import '$lib/i18n';

	let { children, data } = $props();

	onMount(() => {
		// Initialize PostHog
		initPostHog();

		// Get initial session
		supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
			session.set(initialSession);
			user.set(initialSession?.user ?? null);
			loading.set(false);

			// Identify user in PostHog if logged in
			if (initialSession?.user) {
				analytics.identify(initialSession.user.id, {
					email: initialSession.user.email,
					created_at: initialSession.user.created_at
				});
			}
		});

		// Listen for auth changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			session.set(newSession);
			user.set(newSession?.user ?? null);

			// Update PostHog identity on auth changes
			if (newSession?.user) {
				analytics.identify(newSession.user.id, {
					email: newSession.user.email,
					created_at: newSession.user.created_at
				});
			} else {
				// Reset PostHog on logout
				analytics.reset();
			}
		});

		return () => {
			subscription.unsubscribe();
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
