<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { networkStore } from '$lib/stores/network.svelte';
	import { loadAutomations } from '$lib/triggers';
	import SuggestionToast from '$lib/components/SuggestionToast.svelte';
	import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';
	import PwaUpdatePrompt from '$lib/components/PwaUpdatePrompt.svelte';

	let { children } = $props();

	onMount(async () => {
		// Initialize theme
		const cleanupTheme = theme.initialize();

		// Initialize network status tracking
		networkStore.initialize();

		// Initialize auth
		await authStore.initialize();

		// Load cross-module automation triggers
		await loadAutomations();

		return () => {
			cleanupTheme();
			networkStore.destroy();
		};
	});
</script>

{@render children()}
<SuggestionToast />
<OfflineIndicator />
<PwaUpdatePrompt />
