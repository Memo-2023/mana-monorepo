<script lang="ts">
	import { getContext } from 'svelte';
	import type { CalendarEvent, Calendar as CalendarType } from '@calendar/shared';
	import { getCalendarColorWithBirthdays } from '$lib/data/queries';
	import { Calendar, MapPin } from '@manacore/shared-icons';
	import { format } from 'date-fns';
	import { toDate } from '$lib/utils/eventDateHelpers';

	interface Props {
		event: CalendarEvent;
		onclick?: () => void;
	}

	let { event, onclick }: Props = $props();

	const calendarsCtx: { readonly value: CalendarType[] } = getContext('calendars');

	const eventColor = $derived(getCalendarColorWithBirthdays(calendarsCtx.value, event.calendarId));
	const eventTimeLabel = $derived.by(() => {
		if (event.isAllDay) return 'Ganztägig';
		const start = toDate(event.startTime);
		const end = toDate(event.endTime);
		return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
	});
</script>

<button type="button" class="agenda-item event" style="--item-color: {eventColor};" {onclick}>
	<div class="item-indicator">
		<Calendar size={14} />
	</div>
	<div class="item-content">
		<div class="item-header">
			<span class="item-time">{eventTimeLabel}</span>
		</div>
		<span class="item-title">{event.title}</span>
		{#if event.location}
			<div class="item-meta">
				<MapPin size={12} />
				<span>{event.location}</span>
			</div>
		{/if}
	</div>
</button>

<style>
	.agenda-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		background: hsl(var(--color-surface));
		transition: all 150ms ease;
		border: none;
		cursor: pointer;
		text-align: left;
		width: 100%;
		border-left: 4px solid var(--item-color);
	}
	.agenda-item:hover {
		background: hsl(var(--color-muted) / 0.5);
		transform: translateX(4px);
	}
	.item-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-sm);
		background: var(--item-color);
		color: white;
		flex-shrink: 0;
	}
	.item-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.item-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.item-time {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}
	.item-title {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.item-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.item-meta :global(svg) {
		flex-shrink: 0;
	}
</style>
