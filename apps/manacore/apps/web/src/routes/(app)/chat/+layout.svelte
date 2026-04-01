<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import {
		useAllConversations,
		useArchivedConversations,
		useAllTemplates,
	} from '$lib/modules/chat/queries';

	let { children }: { children: Snippet } = $props();

	// Live queries — auto-update when IndexedDB changes
	const allConversations = useAllConversations();
	const archivedConversations = useArchivedConversations();
	const allTemplates = useAllTemplates();

	// Provide data to child components via Svelte context
	setContext('conversations', allConversations);
	setContext('archivedConversations', archivedConversations);
	setContext('templates', allTemplates);
</script>

{@render children()}
