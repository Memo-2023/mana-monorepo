<script lang="ts">
	import { calendarViewStore } from '../stores/view.svelte';
	import type { CalendarViewType } from '../types';
	import { CaretLeft, CaretRight, Plus } from '@manacore/shared-icons';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		onNewEvent: () => void;
	}

	let { onNewEvent }: Props = $props();

	let headerLabel = $derived.by(() => {
		if (calendarViewStore.viewType === 'month') {
			return format(calendarViewStore.currentDate, 'MMMM yyyy', { locale: de });
		}
		return format(calendarViewStore.currentDate, "'KW' w — MMMM yyyy", { locale: de });
	});

	const viewLabels: Record<CalendarViewType, string> = {
		week: 'Woche',
		month: 'Monat',
		agenda: 'Agenda',
	};
</script>

<header class="calendar-header">
	<div class="header-left">
		<h1 class="header-label">{headerLabel}</h1>
		<div class="nav-buttons">
			<button onclick={() => calendarViewStore.goToPrevious()} class="nav-btn" aria-label="Zurück">
				<CaretLeft size={18} />
			</button>
			<button onclick={() => calendarViewStore.goToToday()} class="today-btn"> Heute </button>
			<button onclick={() => calendarViewStore.goToNext()} class="nav-btn" aria-label="Weiter">
				<CaretRight size={18} />
			</button>
		</div>
	</div>

	<div class="header-right">
		<div class="view-switcher">
			{#each ['week', 'month', 'agenda'] as CalendarViewType[] as view}
				<button
					onclick={() => calendarViewStore.setViewType(view)}
					class="view-btn"
					class:active={calendarViewStore.viewType === view}
				>
					{viewLabels[view]}
				</button>
			{/each}
		</div>

		<button onclick={onNewEvent} class="new-event-btn">
			<Plus size={16} />
			Termin
		</button>
	</div>
</header>

<style>
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid hsl(var(--color-border));
		padding: 0.75rem 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-label {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
		white-space: nowrap;
	}

	.nav-buttons {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.nav-btn {
		padding: 0.375rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-md, 8px);
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
	}

	.nav-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.today-btn {
		padding: 0.25rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-md, 8px);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
	}

	.today-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.view-switcher {
		display: flex;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md, 8px);
		overflow: hidden;
		background: hsl(var(--color-card));
	}

	.view-btn {
		padding: 0.375rem 0.75rem;
		border: none;
		background: transparent;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
	}

	.view-btn:hover {
		color: hsl(var(--color-foreground));
	}

	.view-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.new-event-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: var(--radius-md, 8px);
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.new-event-btn:hover {
		opacity: 0.9;
	}
</style>
