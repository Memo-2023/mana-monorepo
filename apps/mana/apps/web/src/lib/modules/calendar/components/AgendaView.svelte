<script lang="ts">
	import { getDateFnsLocale } from '$lib/i18n/format';
	import { getContext } from 'svelte';
	import { calendarViewStore } from '../stores/view.svelte';
	import { eventsStore } from '../stores/events.svelte';
	import {
		filterEventsByVisibleCalendars,
		getEventsInRange,
		sortEventsByTime,
		getCalendarColor,
	} from '../queries';
	import type { Calendar, CalendarEvent } from '../types';
	import { toDate } from '../utils/event-date-helpers';
	import { format, parseISO, isToday, isTomorrow, startOfDay, addMonths } from 'date-fns';
	import { CalendarBlank, MapPin, CaretRight } from '@mana/shared-icons';

	interface Props {
		onEventClick?: (event: CalendarEvent) => void;
	}

	let { onEventClick }: Props = $props();

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');
	const eventsCtx: { readonly value: CalendarEvent[] } = getContext('calendarEvents');

	let rangeEvents = $derived.by(() => {
		const filtered = filterEventsByVisibleCalendars(eventsCtx.value, calendarsCtx.value).filter(
			(e) => calendarViewStore.visibleBlockTypes.has(e.blockType)
		);
		return getEventsInRange(
			filtered,
			calendarViewStore.currentDate,
			addMonths(calendarViewStore.currentDate, 3)
		);
	});

	function getItemColor(event: CalendarEvent): string {
		if (event.calendarId !== '__external__') {
			return getCalendarColor(calendarsCtx.value, event.calendarId);
		}
		return event.color || '#6b7280';
	}

	let groupedEvents = $derived.by(() => {
		const currentEvents = rangeEvents ?? [];
		if (!Array.isArray(currentEvents)) return [];

		const startDate = startOfDay(calendarViewStore.currentDate);
		const groups: Map<string, CalendarEvent[]> = new Map();

		for (const event of currentEvents) {
			const start = toDate(event.startTime);
			if (start < startDate) continue;

			const dateKey = format(start, 'yyyy-MM-dd');
			if (!groups.has(dateKey)) {
				groups.set(dateKey, []);
			}
			groups.get(dateKey)!.push(event);
		}

		return Array.from(groups.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dateKey, events]) => ({
				date: parseISO(dateKey),
				events: events.sort((a, b) => {
					const aStart = toDate(a.startTime);
					const bStart = toDate(b.startTime);
					return aStart.getTime() - bStart.getTime();
				}),
			}))
			.filter((group) => group.events.length > 0);
	});

	function formatDateHeader(date: Date) {
		if (isToday(date)) return 'Heute';
		if (isTomorrow(date)) return 'Morgen';
		return format(date, 'EEEE, d. MMMM', { locale: getDateFnsLocale() });
	}

	function handleEventClick(event: CalendarEvent) {
		onEventClick?.(event);
	}

	// Inline title editing
	function handleTitleBlur(event: CalendarEvent, el: HTMLSpanElement) {
		const trimmed = (el.textContent || '').trim();
		if (trimmed && trimmed !== event.title) {
			eventsStore.updateEvent(event.id, { title: trimmed });
		} else {
			el.textContent = event.title;
		}
	}

	function handleTitleKeydown(e: KeyboardEvent, event: CalendarEvent) {
		const target = e.target as HTMLSpanElement;
		if (e.key === 'Enter') {
			e.preventDefault();
			target.blur();
		} else if (e.key === 'Escape') {
			target.textContent = event.title;
			target.blur();
		}
	}
</script>

<div class="agenda-view">
	{#if groupedEvents.length === 0}
		<div class="empty-state">
			<CalendarBlank size={64} />
			<p>Keine Termine in diesem Zeitraum</p>
		</div>
	{:else}
		<div class="event-list">
			{#each groupedEvents as group}
				<div class="date-group">
					<h2 class="date-header" class:today={isToday(group.date)}>
						{formatDateHeader(group.date)}
					</h2>

					<div class="events-for-date">
						{#each group.events as event}
							<div class="event-item" role="listitem">
								<div class="color-bar" style="background-color: {getItemColor(event)}"></div>
								<div class="event-content">
									<div class="event-time">
										{#if event.isAllDay}
											Ganztägig
										{:else}
											{format(toDate(event.startTime), 'HH:mm')} - {format(
												toDate(event.endTime),
												'HH:mm'
											)}
										{/if}
									</div>
									<span
										class="event-title agenda-event-title"
										contenteditable="true"
										role="textbox"
										tabindex="0"
										spellcheck="true"
										onkeydown={(e) => handleTitleKeydown(e, event)}
										onblur={(e) => handleTitleBlur(event, e.target as HTMLSpanElement)}
										onclick={(e) => e.stopPropagation()}
									>
										{event.title}
									</span>
									{#if event.location}
										<div class="event-location">
											<MapPin size={14} />
											{event.location}
										</div>
									{/if}
								</div>
								<button
									class="expand-btn"
									onclick={() => handleEventClick(event)}
									title="Details öffnen"
									aria-label="Details öffnen"
								>
									<CaretRight size={16} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.agenda-view {
		padding: 1rem;
		max-width: 700px;
		margin: 0 auto;
		height: 100%;
		overflow-y: auto;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
	}

	.empty-state p {
		font-size: 1rem;
		margin-top: 1rem;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.date-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.date-header {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
		padding-left: 0.5rem;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.date-header.today {
		color: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary) / 0.3);
	}

	.events-for-date {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.event-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md, 8px);
		text-align: left;
		width: 100%;
		background: hsl(var(--color-card));
	}

	.color-bar {
		width: 4px;
		align-self: stretch;
		border-radius: 2px;
		flex-shrink: 0;
		min-height: 2.5rem;
	}

	.event-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.event-time {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-weight: 500;
	}

	.event-title {
		font-weight: 500;
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		white-space: normal;
		word-break: break-word;
		cursor: text;
		outline: none;
		border-radius: 0.25rem;
		padding: 0.0625rem 0.125rem;
		margin: -0.0625rem -0.125rem;
	}

	.event-location {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}

	.expand-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		margin-top: 0.25rem;
		border: none;
		background: transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		flex-shrink: 0;
		opacity: 0.4;
		transition: opacity 0.15s;
		color: hsl(var(--color-muted-foreground));
	}

	.expand-btn:hover {
		opacity: 1;
		background: hsl(var(--color-muted));
	}
</style>
