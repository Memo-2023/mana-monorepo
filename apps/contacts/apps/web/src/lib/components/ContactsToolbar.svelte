<script lang="ts">
	import { ExpandableToolbar } from '@manacore/shared-ui';
	import ContactsToolbarContent from './ContactsToolbarContent.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
	import type { Contact } from '$lib/api/contacts';

	interface Props {
		isSidebarMode?: boolean;
		contacts: Contact[];
	}

	let { isSidebarMode = false, contacts }: Props = $props();

	// Use store for collapsed state
	let isCollapsed = $derived(contactsFilterStore.isToolbarCollapsed);

	function handleCollapsedChange(collapsed: boolean) {
		contactsFilterStore.setToolbarCollapsed(collapsed);
	}
</script>

<ExpandableToolbar
	{isCollapsed}
	onCollapsedChange={handleCollapsedChange}
	{isSidebarMode}
	collapsedTitle="Filter & Optionen"
	expandedTitle="Schließen"
>
	<ContactsToolbarContent {contacts} />
</ExpandableToolbar>
