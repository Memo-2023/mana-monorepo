<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { CalendarViewType } from '@calendar/shared';
	import {
		PillToolbar,
		PillToolbarButton,
		PillToolbarDivider,
		PillTimeRangeSelector,
		PillViewSwitcher,
	} from '@manacore/shared-ui';
	import PillCalendarSelector from './PillCalendarSelector.svelte';

	// View type labels
	const viewLabels: Record<CalendarViewType, string> = {
		day: 'Tag',
		'5day': '5 Tage',
		week: 'Woche',
		'10day': '10 Tage',
		'14day': '14 Tage',
		month: 'Monat',
		year: 'Jahr',
		agenda: 'Agenda',
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

<PillToolbar position="bottom" bottomOffset="140px">
	<!-- Calendar selector -->
	<PillCalendarSelector direction="up" embedded={true} />

	<PillToolbarDivider />

	<!-- Today button -->
	<PillToolbarButton onclick={() => viewStore.goToToday()} title="Zum heutigen Tag springen">
		Heute
	</PillToolbarButton>

	<PillToolbarDivider />

	<!-- Navigation -->
	<PillToolbarButton onclick={() => viewStore.goToPrevious()} title="Zurück" iconOnly>
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
	</PillToolbarButton>
	<PillToolbarButton onclick={() => viewStore.goToNext()} title="Weiter" iconOnly>
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</PillToolbarButton>

	<PillToolbarDivider />

	<!-- Weekdays filter -->
	<PillToolbarButton
		onclick={() => settingsStore.set('showOnlyWeekdays', !settingsStore.showOnlyWeekdays)}
		active={settingsStore.showOnlyWeekdays}
		title="Nur Wochentage anzeigen (Mo-Fr)"
	>
		Mo-Fr
	</PillToolbarButton>

	<!-- Hours filter -->
	<PillToolbarButton
		onclick={() => settingsStore.set('filterHoursEnabled', !settingsStore.filterHoursEnabled)}
		active={settingsStore.filterHoursEnabled}
		title="Stundenfilter ein/aus"
		iconOnly
	>
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	</PillToolbarButton>

	<!-- Time range selector -->
	<PillTimeRangeSelector
		startHour={settingsStore.dayStartHour}
		endHour={settingsStore.dayEndHour}
		onStartHourChange={handleStartHourChange}
		onEndHourChange={handleEndHourChange}
		direction="up"
		embedded={true}
	/>

	<PillToolbarDivider />

	<!-- View selector -->
	<PillViewSwitcher
		options={viewOptions}
		value={viewStore.viewType}
		onChange={handleViewChange}
		primaryColor="#3b82f6"
		embedded={true}
	/>
</PillToolbar>
