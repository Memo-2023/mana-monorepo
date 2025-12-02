<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import type { CalendarViewType } from '@calendar/shared';

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
	const visibleViews: CalendarViewType[] = ['day', '5day', 'week', '10day', '14day', 'month'];

	// Format title based on view type
	let title = $derived.by(() => {
		const date = viewStore.currentDate;
		const rangeStart = viewStore.viewRange.start;
		const rangeEnd = viewStore.viewRange.end;

		// Helper to format date range
		const formatRange = () => {
			if (rangeStart.getMonth() === rangeEnd.getMonth()) {
				return format(rangeStart, 'd.', { locale: de }) + ' - ' + format(rangeEnd, 'd. MMMM yyyy', { locale: de });
			}
			return format(rangeStart, 'd. MMM', { locale: de }) + ' - ' + format(rangeEnd, 'd. MMM yyyy', { locale: de });
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

	function handleViewChange(type: CalendarViewType) {
		viewStore.setViewType(type);
	}
</script>

<header class="calendar-header">
	<div class="header-left">
		<button class="btn btn-ghost" onclick={() => viewStore.goToToday()}>
			Heute
		</button>

		<div class="nav-buttons">
			<button class="btn btn-ghost btn-icon" onclick={() => viewStore.goToPrevious()} aria-label="Zurück">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<button class="btn btn-ghost btn-icon" onclick={() => viewStore.goToNext()} aria-label="Weiter">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<h1 class="header-title">{title}</h1>
	</div>

	<div class="header-right">
		<!-- Filter toggles -->
		<div class="filter-toggles">
			<!-- Weekdays only toggle -->
			<button
				class="filter-toggle"
				class:active={settingsStore.showOnlyWeekdays}
				onclick={() => settingsStore.set('showOnlyWeekdays', !settingsStore.showOnlyWeekdays)}
				title="Nur Wochentage anzeigen (Mo-Fr)"
			>
				Mo-Fr
			</button>

			<!-- Hide early hours toggle -->
			<button
				class="filter-toggle"
				class:active={settingsStore.hideEarlyHours}
				onclick={() => settingsStore.set('hideEarlyHours', !settingsStore.hideEarlyHours)}
				title="Frühe Stunden ausblenden (0-6 Uhr)"
			>
				7-24
			</button>
		</div>

		<div class="view-selector">
			{#each visibleViews as type}
				<button
					class="view-btn"
					class:active={viewStore.viewType === type}
					onclick={() => handleViewChange(type)}
				>
					{viewLabels[type]}
				</button>
			{/each}
		</div>
	</div>
</header>

<style>
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-buttons {
		display: flex;
		gap: 0.25rem;
	}

	.header-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.view-selector {
		display: flex;
		background: hsl(var(--color-muted));
		border-radius: var(--radius-md);
		padding: 0.25rem;
	}

	.view-btn {
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 150ms ease;
	}

	.view-btn:hover {
		color: hsl(var(--color-foreground));
	}

	.view-btn.active {
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.filter-toggles {
		display: flex;
		gap: 0.5rem;
	}

	.filter-toggle {
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 150ms ease;
	}

	.filter-toggle:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.filter-toggle.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}

	.btn-icon {
		padding: 0.5rem;
	}

	@media (max-width: 640px) {
		.calendar-header {
			flex-direction: column;
			gap: 1rem;
		}

		.header-left {
			width: 100%;
			justify-content: space-between;
		}

		.header-title {
			font-size: 1rem;
		}
	}
</style>
