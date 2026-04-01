<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import {
		useAllMemos,
		useArchivedMemos,
		useAllTags,
		useAllMemoTags,
	} from '$lib/modules/memoro/queries';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes
	const allMemos = useAllMemos();
	const archivedMemos = useArchivedMemos();
	const allTags = useAllTags();
	const allMemoTags = useAllMemoTags();

	// Provide data to child components via Svelte context
	setContext('memos', allMemos);
	setContext('archivedMemos', archivedMemos);
	setContext('tags', allTags);
	setContext('memoTags', allMemoTags);
</script>

{@render children()}
