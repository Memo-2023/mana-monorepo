<script lang="ts">
	import { calendarViewStore } from '../stores/view.svelte';
	import type { CalendarViewType } from '../types';
	import type { TimeBlockType } from '$lib/data/time-blocks/types';
	import {
		CaretLeft,
		CaretRight,
		Plus,
		CalendarBlank,
		CheckSquare,
		Timer,
		Heart,
		Funnel,
		Export,
	} from '@mana/shared-icons';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
	import { toTimeBlock } from '$lib/data/time-blocks/queries';
	import { downloadICalendar } from '$lib/data/time-blocks/ical-export';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';

	interface Props {
		onNewEvent: () => void;
	}

	let { onNewEvent }: Props = $props();

	let showFilters = $state(false);

	const blockTypeConfig: { type: TimeBlockType; label: string; icon: typeof CalendarBlank }[] = [
		{ type: 'event', label: 'Termine', icon: CalendarBlank },
		{ type: 'task', label: 'Aufgaben', icon: CheckSquare },
		{ type: 'timeEntry', label: 'Zeiten', icon: Timer },
		{ type: 'habit', label: 'Habits', icon: Heart },
	];

	let allActive = $derived(
		blockTypeConfig.every((c) => calendarViewStore.visibleBlockTypes.has(c.type))
	);

	async function handleExport() {
		const locals = await db.table<LocalTimeBlock>('timeBlocks').toArray();
		const visible = locals.filter((b) => !b.deletedAt);
		// iCal export embeds the title/description in the file — must
		// decrypt before writing or we'd ship ciphertext to the user.
		const decrypted = await decryptRecords('timeBlocks', visible);
		const blocks = decrypted
			.map(toTimeBlock)
			.filter((b) => calendarViewStore.visibleBlockTypes.has(b.type));
		downloadICalendar(blocks);
	}

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

		<button
			onclick={() => (showFilters = !showFilters)}
			class="filter-btn"
			class:active={!allActive}
			aria-label="Filter"
		>
			<Funnel size={16} />
		</button>

		<button class="filter-btn" onclick={handleExport} aria-label="Exportieren">
			<Export size={16} />
		</button>

		<button onclick={onNewEvent} class="new-event-btn">
			<Plus size={16} />
			Termin
		</button>
	</div>

	{#if showFilters}
		<div class="filter-bar">
			{#each blockTypeConfig as cfg}
				{@const isActive = calendarViewStore.visibleBlockTypes.has(cfg.type)}
				<button
					class="filter-chip"
					class:active={isActive}
					onclick={() => calendarViewStore.toggleBlockType(cfg.type)}
				>
					<svelte:component this={cfg.icon} size={14} />
					{cfg.label}
				</button>
			{/each}
		</div>
	{/if}
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

	.filter-btn {
		padding: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		border-radius: var(--radius-md, 8px);
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
	}

	.filter-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.filter-btn.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary) / 0.3);
		color: hsl(var(--color-primary));
	}

	.filter-bar {
		display: flex;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-top: 1px solid hsl(var(--color-border));
		width: 100%;
	}

	.filter-chip {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		background: transparent;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.filter-chip:hover {
		background: hsl(var(--color-muted));
	}

	.filter-chip.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary) / 0.3);
		color: hsl(var(--color-primary));
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
