<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';

	let { data, children } = $props();

	onMount(() => {
		// Initialize theme
		const cleanupTheme = theme.initialize();

		// Setup auth state change listener
		const {
			data: { subscription },
		} = data.supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
				invalidate('supabase:auth');
			} else if (event === 'SIGNED_OUT') {
				invalidate('supabase:auth');
			}
		});

		return () => {
			cleanupTheme();
			subscription.unsubscribe();
		};
	});
</script>

{@render children()}
