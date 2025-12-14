<script lang="ts">
	import { ExpandableToolbar } from '@manacore/shared-ui';
	import NetworkToolbarContent from './NetworkToolbarContent.svelte';
	import { networkStore } from '$lib/stores/network.svelte';

	interface Props {
		isSidebarMode?: boolean;
	}

	let { isSidebarMode = false }: Props = $props();

	// Use store for collapsed state
	let isCollapsed = $derived(networkStore.isToolbarCollapsed);

	function handleCollapsedChange(collapsed: boolean) {
		networkStore.setToolbarCollapsed(collapsed);
	}
</script>

<ExpandableToolbar
	{isCollapsed}
	onCollapsedChange={handleCollapsedChange}
	{isSidebarMode}
	collapsedTitle="Netzwerk-Optionen"
	expandedTitle="Schließen"
>
	<NetworkToolbarContent />
</ExpandableToolbar>
