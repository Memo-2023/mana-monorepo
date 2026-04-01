<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllAlbums, useAllAlbumItems, useAllFavorites } from '$lib/modules/photos/queries';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allAlbums = useAllAlbums();
	const allAlbumItems = useAllAlbumItems();
	const allFavorites = useAllFavorites();

	// Provide data to child components via Svelte context
	setContext('albums', allAlbums);
	setContext('albumItems', allAlbumItems);
	setContext('favorites', allFavorites);
</script>

{@render children()}
