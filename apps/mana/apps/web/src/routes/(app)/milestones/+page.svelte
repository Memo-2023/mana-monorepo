<script lang="ts">
	import { _ } from 'svelte-i18n';
	import TimelineView from '$lib/components/milestones/TimelineView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>{$_('milestones.timeline.title')} - Mana</title>
</svelte:head>

<RoutePage appId="milestones" title={$_('milestones.timeline.title')}>
	<TimelineView />
</RoutePage>
