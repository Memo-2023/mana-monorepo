<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import type { CalendarViewType } from '@calendar/shared';

	// View type labels
	const viewLabels: Record<CalendarViewType, string> = {
		day: 'Tag',
		week: 'Woche',
		month: 'Monat',
		year: 'Jahr',
		agenda: 'Agenda',
	};

	// Format title based on view type
	let title = $derived.by(() => {
		const date = viewStore.currentDate;
		switch (viewStore.viewType) {
			case 'day':
				return format(date, 'EEEE, d. MMMM yyyy', { locale: de });
			case 'week':
				const weekStart = viewStore.viewRange.start;
				const weekEnd = viewStore.viewRange.end;
				if (weekStart.getMonth() === weekEnd.getMonth()) {
					return format(weekStart, 'd.', { locale: de }) + ' - ' + format(weekEnd, 'd. MMMM yyyy', { locale: de });
				}
				return format(weekStart, 'd. MMM', { locale: de }) + ' - ' + format(weekEnd, 'd. MMM yyyy', { locale: de });
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
		<div class="view-selector">
			{#each (['day', 'week', 'month'] as const) as type}
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
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--card));
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
		color: hsl(var(--foreground));
		margin: 0;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.view-selector {
		display: flex;
		background: hsl(var(--muted));
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
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 150ms ease;
	}

	.view-btn:hover {
		color: hsl(var(--foreground));
	}

	.view-btn.active {
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
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
