<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { dropTarget } from '@manacore/shared-ui/dnd';
	import type { DragPayload, TagDragData } from '@manacore/shared-ui/dnd';
	import { useAllTags } from '$lib/stores/tags.svelte';
	import { calendarViewStore } from '$lib/modules/calendar/stores/view.svelte';
	import { eventsStore } from '$lib/modules/calendar/stores/events.svelte';
	import {
		getDefaultCalendar,
		getEventsForDay,
		getEventsInRange,
		filterEventsByVisibleCalendars,
		sortEventsByTime,
		getCalendarColor,
	} from '$lib/modules/calendar/queries';
	import type { Calendar, CalendarEvent } from '$lib/modules/calendar/types';
	import {
		format,
		addMinutes,
		eachDayOfInterval,
		startOfWeek,
		endOfWeek,
		isSameDay,
		isToday,
	} from 'date-fns';
	import { de } from 'date-fns/locale';
	import { CaretLeft, CaretRight, Plus } from '@manacore/shared-icons';

	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');
	const eventsCtx: { readonly value: CalendarEvent[] } = getContext('calendarEvents');

	// ── DnD: tag support ────────────────────────────────────
	const globalTags = useAllTags();
	const tagMap = $derived(new Map((globalTags.value ?? []).map((t) => [t.id, t])));

	function getEventTags(event: CalendarEvent) {
		return (event.tagIds ?? [])
			.map((id) => tagMap.get(id))
			.filter((t): t is NonNullable<typeof t> => t != null);
	}

	function handleTagDrop(event: CalendarEvent, payload: DragPayload) {
		const tagData = payload.data as TagDragData;
		const current = event.tagIds ?? [];
		if (!current.includes(tagData.id)) {
			eventsStore.updateTagIds(event.id, [...current, tagData.id]);
		}
	}

	function tagNotAlreadyOnEvent(event: CalendarEvent) {
		return (payload: DragPayload) => {
			const tagData = payload.data as TagDragData;
			return !(event.tagIds ?? []).includes(tagData.id);
		};
	}

	// Register passive handler for task→tag direction
	const tagDropCtx = getContext<{
		set: (handler: (tagId: string, payload: DragPayload) => void) => void;
		clear: () => void;
	}>('tagDropHandler');

	onMount(() => {
		tagDropCtx?.set(async (tagId: string, payload: DragPayload) => {
			const data = payload.data as { id: string };
			// Check if dropped item is an event
			if (payload.type === 'event') {
				const event = eventsCtx.value.find((e) => e.id === data.id);
				if (!event) return;
				const current = event.tagIds ?? [];
				if (!current.includes(tagId)) {
					eventsStore.updateTagIds(data.id, [...current, tagId]);
				}
			}
		});
		return () => tagDropCtx?.clear();
	});

	// Filtered events based on visible calendars
	let visibleEvents = $derived(filterEventsByVisibleCalendars(eventsCtx.value, calendarsCtx.value));

	// Current view range events
	let rangeEvents = $derived(
		sortEventsByTime(
			getEventsInRange(
				visibleEvents,
				calendarViewStore.viewRange.start,
				calendarViewStore.viewRange.end
			)
		)
	);

	// Week days for the week view
	let weekDays = $derived(
		eachDayOfInterval({
			start: startOfWeek(calendarViewStore.currentDate, { weekStartsOn: 1 }),
			end: endOfWeek(calendarViewStore.currentDate, { weekStartsOn: 1 }),
		})
	);

	// Event form state
	let showEventForm = $state(false);
	let editingEvent = $state<CalendarEvent | null>(null);
	let newTitle = $state('');
	let newDate = $state('');
	let newStartTime = $state('10:00');
	let newEndTime = $state('11:00');
	let newAllDay = $state(false);
	let newLocation = $state('');

	function openNewEvent(date?: Date) {
		const d = date ?? new Date();
		editingEvent = null;
		newTitle = '';
		newDate = format(d, 'yyyy-MM-dd');
		newStartTime = '10:00';
		newEndTime = '11:00';
		newAllDay = false;
		newLocation = '';
		showEventForm = true;
	}

	function openEditEvent(event: CalendarEvent) {
		editingEvent = event;
		newTitle = event.title;
		newDate = format(new Date(event.startTime), 'yyyy-MM-dd');
		newStartTime = format(new Date(event.startTime), 'HH:mm');
		newEndTime = format(new Date(event.endTime), 'HH:mm');
		newAllDay = event.isAllDay;
		newLocation = event.location ?? '';
		showEventForm = true;
	}

	async function handleSaveEvent() {
		const defaultCal = getDefaultCalendar(calendarsCtx.value);
		const startTime = newAllDay ? `${newDate}T00:00:00` : `${newDate}T${newStartTime}:00`;
		const endTime = newAllDay ? `${newDate}T23:59:59` : `${newDate}T${newEndTime}:00`;

		if (editingEvent) {
			await eventsStore.updateEvent(editingEvent.id, {
				title: newTitle,
				startTime: new Date(startTime).toISOString(),
				endTime: new Date(endTime).toISOString(),
				isAllDay: newAllDay,
				location: newLocation || null,
			});
		} else {
			await eventsStore.createEvent({
				calendarId: defaultCal?.id || '',
				title: newTitle,
				startTime: new Date(startTime).toISOString(),
				endTime: new Date(endTime).toISOString(),
				isAllDay: newAllDay,
				location: newLocation || null,
			});
		}

		showEventForm = false;
	}

	async function handleDeleteEvent() {
		if (!editingEvent) return;
		await eventsStore.deleteEvent(editingEvent.id);
		showEventForm = false;
	}

	// Hours for the week grid
	const hours = Array.from({ length: 24 }, (_, i) => i);

	let headerLabel = $derived.by(() => {
		if (calendarViewStore.viewType === 'month') {
			return format(calendarViewStore.currentDate, 'MMMM yyyy', { locale: de });
		}
		return format(calendarViewStore.currentDate, "'KW' w — MMMM yyyy", { locale: de });
	});
</script>

<svelte:head>
	<title>Kalender - ManaCore</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Header -->
	<header class="flex items-center justify-between border-b border-border px-4 py-3">
		<div class="flex items-center gap-3">
			<h1 class="text-lg font-semibold text-foreground">{headerLabel}</h1>
			<div class="flex items-center gap-1">
				<button
					onclick={() => calendarViewStore.goToPrevious()}
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
				>
					<CaretLeft size={18} />
				</button>
				<button
					onclick={() => calendarViewStore.goToToday()}
					class="rounded-lg px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
				>
					Heute
				</button>
				<button
					onclick={() => calendarViewStore.goToNext()}
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
				>
					<CaretRight size={18} />
				</button>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<!-- View Type Switcher -->
			<div class="flex rounded-lg border border-border bg-card">
				{#each ['week', 'month', 'agenda'] as view}
					<button
						onclick={() => calendarViewStore.setViewType(view as 'week' | 'month' | 'agenda')}
						class="px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg {calendarViewStore.viewType ===
						view
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						{view === 'week' ? 'Woche' : view === 'month' ? 'Monat' : 'Agenda'}
					</button>
				{/each}
			</div>

			<!-- New Event Button -->
			<button
				onclick={() => openNewEvent()}
				class="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
			>
				<Plus size={16} />
				Termin
			</button>
		</div>
	</header>

	<!-- View Content -->
	<div class="flex-1 overflow-auto">
		{#if calendarViewStore.viewType === 'week'}
			<!-- Week View -->
			<div class="week-grid">
				<!-- Day Headers -->
				<div
					class="sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-card"
				>
					<div class="p-2"></div>
					{#each weekDays as day}
						<button
							onclick={() => {
								calendarViewStore.setDate(day);
							}}
							class="border-l border-border p-2 text-center {isToday(day) ? 'bg-primary/10' : ''}"
						>
							<div class="text-xs text-muted-foreground">
								{format(day, 'EEE', { locale: de })}
							</div>
							<div
								class="text-lg font-semibold {isToday(day) ? 'text-primary' : 'text-foreground'}"
							>
								{format(day, 'd')}
							</div>
						</button>
					{/each}
				</div>

				<!-- Time Grid -->
				<div class="relative">
					{#each hours as hour}
						<div class="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50">
							<div class="p-1 pr-2 text-right text-xs text-muted-foreground">
								{hour.toString().padStart(2, '0')}:00
							</div>
							{#each weekDays as day}
								<button
									onclick={() => {
										const d = new Date(day);
										d.setHours(hour, 0, 0, 0);
										openNewEvent(d);
									}}
									class="h-12 border-l border-border/50 hover:bg-muted/50 transition-colors relative"
								>
									<!-- Render events at this slot -->
									{#each getEventsForDay(visibleEvents, day).filter((e) => {
										const h = new Date(e.startTime).getHours();
										return h === hour && !e.isAllDay;
									}) as event}
										<div
											class="absolute inset-x-0.5 top-0 z-10 rounded px-1 py-0.5 text-xs text-white truncate cursor-pointer"
											style="background-color: {getCalendarColor(
												calendarsCtx.value,
												event.calendarId
											)}"
											role="button"
											tabindex="0"
											onclick={(e) => {
												e.stopPropagation();
												openEditEvent(event);
											}}
											onkeydown={(e) => e.key === 'Enter' && openEditEvent(event)}
										>
											{event.title}
										</div>
									{/each}
								</button>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{:else if calendarViewStore.viewType === 'month'}
			<!-- Month View -->
			<div class="p-4">
				<div
					class="grid grid-cols-7 gap-px rounded-lg border border-border bg-border overflow-hidden"
				>
					<!-- Day name headers -->
					{#each ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as dayName}
						<div class="bg-card p-2 text-center text-xs font-medium text-muted-foreground">
							{dayName}
						</div>
					{/each}

					<!-- Calendar days -->
					{#each eachDayOfInterval( { start: startOfWeek( calendarViewStore.viewRange.start, { weekStartsOn: 1 } ), end: endOfWeek( calendarViewStore.viewRange.end, { weekStartsOn: 1 } ) } ) as day}
						<button
							onclick={() => {
								calendarViewStore.setDate(day);
								calendarViewStore.setViewType('week');
							}}
							class="min-h-[80px] bg-card p-1 text-left hover:bg-muted/50 transition-colors {day.getMonth() !==
							calendarViewStore.currentDate.getMonth()
								? 'opacity-40'
								: ''}"
						>
							<div
								class="mb-1 text-xs font-medium {isToday(day)
									? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'
									: 'text-foreground'}"
							>
								{format(day, 'd')}
							</div>
							{#each getEventsForDay(visibleEvents, day).slice(0, 3) as event}
								<div
									class="mb-0.5 truncate rounded px-1 text-[10px] text-white"
									style="background-color: {getCalendarColor(calendarsCtx.value, event.calendarId)}"
								>
									{event.title}
								</div>
							{/each}
							{#if getEventsForDay(visibleEvents, day).length > 3}
								<div class="text-[10px] text-muted-foreground">
									+{getEventsForDay(visibleEvents, day).length - 3} weitere
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Agenda View -->
			<div class="mx-auto max-w-2xl p-4">
				{#if rangeEvents.length === 0}
					<div class="py-16 text-center">
						<p class="text-lg text-muted-foreground">Keine Termine in den nächsten 30 Tagen</p>
						<button
							onclick={() => openNewEvent()}
							class="mt-4 text-sm text-primary hover:underline"
						>
							Termin erstellen
						</button>
					</div>
				{:else}
					{@const groupedByDate = rangeEvents.reduce(
						(acc, event) => {
							const key = format(new Date(event.startTime), 'yyyy-MM-dd');
							if (!acc[key]) acc[key] = [];
							acc[key].push(event);
							return acc;
						},
						{} as Record<string, CalendarEvent[]>
					)}

					{#each Object.entries(groupedByDate) as [dateKey, dayEvents]}
						<div class="mb-6">
							<h3 class="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
								{format(new Date(dateKey), 'EEEE, d. MMMM', { locale: de })}
								{#if isToday(new Date(dateKey))}
									<span class="ml-2 text-primary">Heute</span>
								{/if}
							</h3>
							<div class="space-y-2">
								{#each dayEvents as event (event.id)}
									<button
										onclick={() => openEditEvent(event)}
										class="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/50 transition-colors"
										use:dropTarget={{
											accepts: ['tag'],
											onDrop: (payload) => handleTagDrop(event, payload),
											canDrop: tagNotAlreadyOnEvent(event),
										}}
									>
										<div
											class="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
											style="background-color: {getCalendarColor(
												calendarsCtx.value,
												event.calendarId
											)}"
										></div>
										<div class="flex-1 min-w-0">
											<div class="font-medium text-foreground">{event.title}</div>
											<div class="flex items-center gap-2 text-sm text-muted-foreground">
												{#if event.isAllDay}
													Ganztägig
												{:else}
													{format(new Date(event.startTime), 'HH:mm')} – {format(
														new Date(event.endTime),
														'HH:mm'
													)}
												{/if}
												{#if event.location}
													<span class="ml-2">📍 {event.location}</span>
												{/if}
											</div>
											{#if getEventTags(event).length > 0}
												<div class="mt-1 flex gap-1">
													{#each getEventTags(event).slice(0, 3) as tag (tag.id)}
														<span
															class="inline-flex rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium"
															style="background: color-mix(in srgb, {tag.color} 15%, transparent); color: {tag.color}"
														>
															{tag.name}
														</span>
													{/each}
												</div>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Event Form Modal -->
{#if showEventForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
			<h2 class="mb-4 text-xl font-semibold text-foreground">
				{editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'}
			</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSaveEvent();
				}}
				class="space-y-4"
			>
				<div>
					<label for="event-title" class="mb-1 block text-sm font-medium text-foreground">
						Titel
					</label>
					<input
						id="event-title"
						type="text"
						bind:value={newTitle}
						placeholder="Termin-Titel"
						required
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div>
					<label for="event-date" class="mb-1 block text-sm font-medium text-foreground">
						Datum
					</label>
					<input
						id="event-date"
						type="date"
						bind:value={newDate}
						required
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<label class="flex items-center gap-2 text-sm text-foreground">
					<input type="checkbox" bind:checked={newAllDay} class="rounded" />
					Ganztägig
				</label>

				{#if !newAllDay}
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="event-start" class="mb-1 block text-sm font-medium text-foreground"
								>Von</label
							>
							<input
								id="event-start"
								type="time"
								bind:value={newStartTime}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
							/>
						</div>
						<div>
							<label for="event-end" class="mb-1 block text-sm font-medium text-foreground"
								>Bis</label
							>
							<input
								id="event-end"
								type="time"
								bind:value={newEndTime}
								class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
							/>
						</div>
					</div>
				{/if}

				<div>
					<label for="event-location" class="mb-1 block text-sm font-medium text-foreground">
						Ort (optional)
					</label>
					<input
						id="event-location"
						type="text"
						bind:value={newLocation}
						placeholder="Ort eingeben..."
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div class="flex gap-3 pt-2">
					{#if editingEvent}
						<button
							type="button"
							onclick={handleDeleteEvent}
							class="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
						>
							Löschen
						</button>
					{/if}
					<div class="flex-1"></div>
					<button
						type="button"
						onclick={() => (showEventForm = false)}
						class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						disabled={!newTitle.trim()}
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
					>
						Speichern
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.week-grid {
		min-height: 100%;
	}

	:global(.mana-drop-target-hover) {
		outline: 2px solid var(--color-primary, #6366f1);
		outline-offset: -2px;
		border-radius: 0.5rem;
		background: rgba(99, 102, 241, 0.06) !important;
	}

	:global(.mana-drop-target-success) {
		animation: drop-success 400ms ease-out;
	}

	@keyframes drop-success {
		0% {
			outline-color: #10b981;
			background: rgba(16, 185, 129, 0.1);
		}
		100% {
			outline-color: transparent;
			background: transparent;
		}
	}
</style>
