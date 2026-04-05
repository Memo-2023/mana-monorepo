<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import {
		useAllImages,
		useArchivedImages,
		useAllBoards,
		useAllPictureTags,
		useAllImageTags,
	} from '$lib/modules/picture/queries';
	import { pictureViewStore } from '$lib/modules/picture/stores/view.svelte';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allImages = useAllImages();
	const archivedImages = useArchivedImages();
	const allBoards = useAllBoards();
	const allPictureTags = useAllPictureTags();
	const allImageTags = useAllImageTags();

	// Provide data to child components via Svelte context
	setContext('allImages', allImages);
	setContext('archivedImages', archivedImages);
	setContext('allBoards', allBoards);
	setContext('pictureTags', allPictureTags);
	setContext('allImageTags', allImageTags);

	// Initialize view preferences
	pictureViewStore.initialize();
</script>

{@render children()}
