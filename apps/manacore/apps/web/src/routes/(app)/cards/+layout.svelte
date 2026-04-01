<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllDecks } from '$lib/modules/cards/queries';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allDecks = useAllDecks();

	// Provide data to child components via Svelte context
	setContext('cardDecks', allDecks);
</script>

{@render children()}
