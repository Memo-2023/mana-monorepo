<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import {
		useAllCollections,
		useAllItems,
		useAllLocations,
		useAllCategories,
	} from '$lib/modules/inventory/queries';
	import { viewStore } from '$lib/modules/inventory/stores/view.svelte';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allCollections = useAllCollections();
	const allItems = useAllItems();
	const allLocations = useAllLocations();
	const allCategories = useAllCategories();

	// Provide data to child components via Svelte context
	setContext('collections', allCollections);
	setContext('items', allItems);
	setContext('locations', allLocations);
	setContext('categories', allCategories);

	// Initialize view preferences
	viewStore.initialize();
</script>

{@render children()}
