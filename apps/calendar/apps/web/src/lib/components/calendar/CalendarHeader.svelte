<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { isNavCollapsed } from '$lib/stores/navigation';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import type { CalendarViewType } from '@calendar/shared';
	import { PillTimeRangeSelector, PillViewSwitcher } from '@manacore/shared-ui';

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

	// Format title based on view type
	let title = $derived.by(() => {
		const date = viewStore.currentDate;
		const rangeStart = viewStore.viewRange.start;
		const rangeEnd = viewStore.viewRange.end;

		// Helper to format date range
		const formatRange = () => {
			if (rangeStart.getMonth() === rangeEnd.getMonth()) {
				return (
					format(rangeStart, 'd.', { locale: de }) +
					' - ' +
					format(rangeEnd, 'd. MMMM yyyy', { locale: de })
				);
			}
			return (
				format(rangeStart, 'd. MMM', { locale: de }) +
				' - ' +
				format(rangeEnd, 'd. MMM yyyy', { locale: de })
			);
		};

		switch (viewStore.viewType) {
			case 'day':
				return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
			case '5day':
			case 'week':
			case '10day':
			case '14day':
				return formatRange();
			case 'month':
				return format(date, 'MMMM yyyy', { locale: de });
			case 'year':
				return format(date, 'yyyy', { locale: de });
			case 'agenda':
				return 'Agenda';
			default:
				return format(date, 'MMMM yyyy', { locale: de });
		}
	});

	function handleViewChange(type: string) {
		viewStore.setViewType(type as CalendarViewType);
	}
</script>

<header class="calendar-header" class:nav-collapsed={$isNavCollapsed}>
	<div class="header-left">
		<button
			class="pill glass-pill today-btn"
			onclick={() => viewStore.goToToday()}
			title="Zum heutigen Tag springen"
		>
			Heute
		</button>

		<div class="nav-buttons glass-pill">
			<button class="nav-btn" onclick={() => viewStore.goToPrevious()} aria-label="Zurück">
				<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
			<div class="nav-divider"></div>
			<button class="nav-btn" onclick={() => viewStore.goToNext()} aria-label="Weiter">
				<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<h1 class="header-title">{title}</h1>
	</div>

	<div class="header-right">
		<!-- Filter toggles as pills -->
		<div class="filter-pills">
			<!-- Weekdays only toggle -->
			<button
				class="pill glass-pill filter-pill"
				class:active={settingsStore.showOnlyWeekdays}
				onclick={() => settingsStore.set('showOnlyWeekdays', !settingsStore.showOnlyWeekdays)}
				title="Nur Wochentage anzeigen (Mo-Fr)"
			>
				Mo-Fr
			</button>

			<!-- Hours filter toggle -->
			<button
				class="pill glass-pill filter-pill"
				class:active={settingsStore.filterHoursEnabled}
				onclick={() => settingsStore.set('filterHoursEnabled', !settingsStore.filterHoursEnabled)}
				title="Stundenfilter ein/aus"
			>
				<svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</button>

			<!-- Hours time range selector -->
			<PillTimeRangeSelector
				startHour={settingsStore.dayStartHour}
				endHour={settingsStore.dayEndHour}
				onStartHourChange={handleStartHourChange}
				onEndHourChange={handleEndHourChange}
				direction="down"
			/>
		</div>

		<!-- View selector -->
		<PillViewSwitcher
			options={viewOptions}
			value={viewStore.viewType}
			onChange={handleViewChange}
			primaryColor="#3b82f6"
		/>
	</div>
</header>

<style>
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: transparent;
		transition: padding-left 300ms ease;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.calendar-header.nav-collapsed {
		padding-left: 4rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
		white-space: nowrap;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	/* Glass pill base styles */
	.pill {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}

	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #374151;
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.glass-pill:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .glass-pill:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	/* Today button */
	.today-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
	}

	/* Navigation buttons group */
	.nav-buttons {
		display: flex;
		align-items: center;
		padding: 0;
		gap: 0;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
		transition: background 0.2s;
	}

	.nav-btn:first-child {
		border-radius: 9999px 0 0 9999px;
	}

	.nav-btn:last-child {
		border-radius: 0 9999px 9999px 0;
	}

	.nav-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .nav-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.nav-icon {
		width: 1rem;
		height: 1rem;
	}

	.nav-divider {
		width: 1px;
		height: 1rem;
		background: rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .nav-divider {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Filter pills */
	.filter-pills {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-pill {
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
	}

	.filter-pill.active {
		background: color-mix(in srgb, #3b82f6 20%, white 80%);
		border-color: #3b82f6;
		color: #3b82f6;
	}

	:global(.dark) .filter-pill.active {
		background: color-mix(in srgb, #3b82f6 30%, transparent 70%);
		border-color: #3b82f6;
		color: #3b82f6;
	}

	.pill-icon {
		width: 0.875rem;
		height: 0.875rem;
	}

	/* Responsive */
	@media (max-width: 900px) {
		.calendar-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			padding: 0.75rem;
		}

		.header-left {
			width: 100%;
			justify-content: flex-start;
		}

		.header-right {
			width: 100%;
			justify-content: flex-start;
		}

		.header-title {
			font-size: 1rem;
		}
	}

	@media (max-width: 640px) {
		.header-title {
			font-size: 0.875rem;
		}

		.filter-pills {
			flex-wrap: wrap;
		}
	}
</style>
