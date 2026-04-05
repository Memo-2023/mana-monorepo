<!--
  SlotSuggestions — Shows available free time slots.
  Used in task scheduling and event creation to suggest optimal times.
-->
<script lang="ts">
	import { db } from '$lib/data/database';
	import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
	import { toTimeBlock, findFreeSlots } from '$lib/data/time-blocks/queries';
	import type { TimeBlock } from '$lib/data/time-blocks/types';
	import { CalendarBlank } from '@manacore/shared-icons';
	import { format, addDays, isToday, isTomorrow } from 'date-fns';
	import { de } from 'date-fns/locale';

	let {
		minDurationMinutes = 30,
		onSelect,
	}: {
		minDurationMinutes?: number;
		onSelect: (start: Date, end: Date) => void;
	} = $props();

	let slots = $state<{ date: Date; start: Date; end: Date; durationMinutes: number }[]>([]);
	let loading = $state(true);

	$effect(() => {
		loadSlots();
	});

	async function loadSlots() {
		loading = true;
		const locals = await db.table<LocalTimeBlock>('timeBlocks').toArray();
		const blocks = locals.filter((b) => !b.deletedAt).map(toTimeBlock);

		const results: typeof slots = [];
		const today = new Date();

		for (let d = 0; d < 5 && results.length < 6; d++) {
			const date = addDays(today, d);
			const daySlots = findFreeSlots(blocks, date, minDurationMinutes);
			for (const slot of daySlots) {
				if (results.length >= 6) break;
				// For today, only future slots
				if (d === 0 && slot.start < today) continue;
				results.push({ date, ...slot });
			}
		}

		slots = results;
		loading = false;
	}

	function formatDayLabel(date: Date): string {
		if (isToday(date)) return 'Heute';
		if (isTomorrow(date)) return 'Morgen';
		return format(date, 'EEE, d. MMM', { locale: de });
	}
</script>

{#if loading}
	<div class="slot-loading">Suche freie Zeiten...</div>
{:else if slots.length === 0}
	<div class="slot-empty">Keine freien Slots gefunden</div>
{:else}
	<div class="slot-list">
		<span class="slot-label">Freie Zeiten</span>
		{#each slots as slot}
			<button class="slot-btn" onclick={() => onSelect(slot.start, slot.end)}>
				<CalendarBlank size={12} />
				<span class="slot-day">{formatDayLabel(slot.date)}</span>
				<span class="slot-time">
					{format(slot.start, 'HH:mm')}–{format(slot.end, 'HH:mm')}
				</span>
				<span class="slot-duration">{slot.durationMinutes}min</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	.slot-loading,
	.slot-empty {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem 0;
	}

	.slot-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.slot-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
		padding-bottom: 0.125rem;
	}

	.slot-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: transparent;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}

	.slot-btn:hover {
		background: hsl(var(--color-primary) / 0.05);
		border-color: hsl(var(--color-primary) / 0.3);
	}

	.slot-day {
		font-weight: 500;
		min-width: 4rem;
	}

	.slot-time {
		font-variant-numeric: tabular-nums;
	}

	.slot-duration {
		margin-left: auto;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
	}
</style>
