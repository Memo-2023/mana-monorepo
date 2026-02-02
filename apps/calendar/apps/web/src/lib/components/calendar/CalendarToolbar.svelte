<script lang="ts">
	import { ExpandableToolbar } from '@manacore/shared-ui';
	import CalendarToolbarContent from './CalendarToolbarContent.svelte';

	interface Props {
		isCollapsed?: boolean;
		isMobile?: boolean;
		bottomOffset?: string;
		onCollapsedChange?: (isCollapsed: boolean) => void;
	}

	let {
		isCollapsed = true,
		isMobile = false,
		bottomOffset = '70px',
		onCollapsedChange,
	}: Props = $props();
</script>

<ExpandableToolbar
	{isCollapsed}
	{onCollapsedChange}
	{bottomOffset}
	collapsedTitle="Kalender-Optionen"
	expandedTitle="Schließen"
>
	<CalendarToolbarContent />
</ExpandableToolbar>
