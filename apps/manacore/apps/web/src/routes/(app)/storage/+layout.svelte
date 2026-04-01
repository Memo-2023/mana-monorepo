<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllFiles, useAllFolders, useAllStorageTags } from '$lib/modules/storage/queries';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes (local writes, sync, other tabs)
	const allFiles = useAllFiles();
	const allFolders = useAllFolders();
	const allStorageTags = useAllStorageTags();

	// Provide data to child components via Svelte context
	setContext('storageFiles', allFiles);
	setContext('storageFolders', allFolders);
	setContext('storageTags', allStorageTags);
</script>

{@render children()}
