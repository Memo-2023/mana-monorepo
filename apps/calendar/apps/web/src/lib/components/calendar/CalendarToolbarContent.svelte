<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { CalendarViewType } from '@calendar/shared';
	import {
		PillToolbarButton,
		PillToolbarDivider,
		PillTimeRangeSelector,
		PillViewSwitcher,
	} from '@manacore/shared-ui';
	import PillCalendarSelector from './PillCalendarSelector.svelte';

	interface Props {
		vertical?: boolean;
	}

	let { vertical = false }: Props = $props();

	// View type labels
	const viewLabels: Record<CalendarViewType, string> = {
		day: 'Tag',
		'3day': '3 Tage',
		'5day': '5 Tage',
		week: 'Woche',
		'10day': '10 Tage',
		'14day': '14 Tage',
		'30day': '30 Tage',
		'60day': '60 Tage',
		'90day': '90 Tage',
		'365day': '365 Tage',
		month: 'Monat',
		year: 'Jahr',
		agenda: 'Agenda',
		custom: 'Benutzerdefiniert',
	};

	// Views to show in selector
	const visibleViews: CalendarViewType[] = [
		'day',
		'5day',
		'week',
		'10day',
		'14day',
		'month',
		'year',
		'agenda',
	];

	// Convert to ViewOptions for PillViewSwitcher
	const viewOptions = visibleViews.map((type) => ({
		id: type,
		label: viewLabels[type],
		title: viewLabels[type],
	}));

	// Hours change handlers
	function handleStartHourChange(hour: number) {
		settingsStore.set('dayStartHour', hour);
	}

	function handleEndHourChange(hour: number) {
		settingsStore.set('dayEndHour', hour);
	}

	function handleViewChange(type: string) {
		viewStore.setViewType(type as CalendarViewType);
	}
</script>

<div class="toolbar-content" class:vertical>
	<!-- Calendar selector -->
	<PillCalendarSelector direction={vertical ? 'down' : 'up'} embedded={true} />

	{#if !vertical}
		<PillToolbarDivider />
	{/if}

	<!-- Weekdays filter -->
	<PillToolbarButton
		onclick={() => settingsStore.set('showOnlyWeekdays', !settingsStore.showOnlyWeekdays)}
		active={settingsStore.showOnlyWeekdays}
		title="Nur Wochentage anzeigen (Mo-Fr)"
	>
		Mo-Fr
	</PillToolbarButton>

	<!-- Hours filter with time range selector -->
	<PillTimeRangeSelector
		startHour={settingsStore.dayStartHour}
		endHour={settingsStore.dayEndHour}
		onStartHourChange={handleStartHourChange}
		onEndHourChange={handleEndHourChange}
		direction={vertical ? 'down' : 'up'}
		embedded={true}
		toggleMode={true}
		active={settingsStore.filterHoursEnabled}
		onToggle={() => settingsStore.set('filterHoursEnabled', !settingsStore.filterHoursEnabled)}
		labelFormat="range"
	/>

	{#if !vertical}
		<PillToolbarDivider />
	{/if}

	<!-- View selector -->
	<PillViewSwitcher
		options={viewOptions}
		value={viewStore.viewType}
		onChange={handleViewChange}
		embedded={true}
	/>
</div>

<style>
	.toolbar-content {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.toolbar-content.vertical {
		flex-direction: column;
		align-items: stretch;
		gap: 0.5rem;
		width: 100%;
	}

	/* All elements in vertical mode - full width, left aligned */
	.toolbar-content.vertical :global(.pill-toolbar-btn),
	.toolbar-content.vertical :global(.pill-dropdown .trigger-button),
	.toolbar-content.vertical :global(button) {
		width: 100%;
		justify-content: flex-start;
		text-align: left;
	}

	/* PillViewSwitcher in vertical mode */
	.toolbar-content.vertical :global(.pill-view-switcher) {
		flex-direction: column;
		gap: 0.25rem;
		padding: 0;
		background: transparent;
		border: none;
		box-shadow: none;
		width: 100%;
	}

	/* Hide the sliding indicator in vertical mode */
	.toolbar-content.vertical :global(.pill-view-switcher .sliding-indicator) {
		display: none;
	}

	.toolbar-content.vertical :global(.pill-view-switcher .switcher-btn) {
		width: 100%;
		justify-content: flex-start;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		background: transparent;
		border: 1px solid transparent;
	}

	.toolbar-content.vertical :global(.pill-view-switcher .switcher-btn:hover) {
		background: hsl(var(--color-foreground) / 0.05);
	}

	.toolbar-content.vertical :global(.pill-view-switcher .switcher-btn.active) {
		background: hsl(var(--color-primary) / 0.15);
		border-color: hsl(var(--color-primary) / 0.25);
	}

	/* PillTimeRangeSelector in vertical mode */
	.toolbar-content.vertical :global(.pill-time-range-selector),
	.toolbar-content.vertical :global(.pill-dropdown) {
		width: 100%;
	}

	.toolbar-content.vertical :global(.pill-time-range-selector .trigger-button),
	.toolbar-content.vertical :global(.pill-dropdown .trigger-button) {
		width: 100%;
		justify-content: flex-start;
	}

	/* PillCalendarSelector in vertical mode */
	.toolbar-content.vertical :global(.calendar-selector) {
		width: 100%;
	}

	.toolbar-content.vertical :global(.calendar-selector .trigger-button) {
		width: 100%;
		justify-content: flex-start;
	}
</style>
