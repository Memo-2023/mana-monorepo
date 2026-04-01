<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { useAllContacts } from '$lib/modules/contacts/queries';
	import { contactsFilterStore } from '$lib/modules/contacts/stores/filter.svelte';

	let { children }: { children: Snippet } = $props();

	// Live query — auto-update when IndexedDB changes
	const allContacts = useAllContacts();

	// Provide data to child components via Svelte context
	setContext('contacts', allContacts);

	// Initialize filter state from localStorage
	contactsFilterStore.initialize();
</script>

{@render children()}
