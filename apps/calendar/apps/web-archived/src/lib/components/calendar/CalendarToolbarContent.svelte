<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import {
		PillToolbarButton,
		PillToolbarDivider,
		PillTimeRangeSelector,
	} from '@manacore/shared-ui';
	import PillCalendarSelector from './PillCalendarSelector.svelte';

	interface Props {
		vertical?: boolean;
	}

	let { vertical = false }: Props = $props();

	// Hours change handlers
	function handleStartHourChange(hour: number) {
		settingsStore.set('dayStartHour', hour);
	}

	function handleEndHourChange(hour: number) {
		settingsStore.set('dayEndHour', hour);
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
