<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { dropTarget } from '@manacore/shared-ui/dnd';
	import type { DragPayload, TagDragData } from '@manacore/shared-ui/dnd';
	import { useAllTags } from '$lib/stores/tags.svelte';
	import { calendarViewStore } from '$lib/modules/calendar/stores/view.svelte';
	import { eventsStore } from '$lib/modules/calendar/stores/events.svelte';
	import {
		getDefaultCalendar,
		filterEventsByVisibleCalendars,
		getCalendarColor,
	} from '$lib/modules/calendar/queries';
	import type { Calendar, CalendarEvent } from '$lib/modules/calendar/types';

	import CalendarHeader from '$lib/modules/calendar/components/CalendarHeader.svelte';
	import DateStrip from '$lib/modules/calendar/components/DateStrip.svelte';
	import WeekView from '$lib/modules/calendar/components/WeekView.svelte';
	import MonthView from '$lib/modules/calendar/components/MonthView.svelte';
	import AgendaView from '$lib/modules/calendar/components/AgendaView.svelte';
	import MiniCalendar from '$lib/modules/calendar/components/MiniCalendar.svelte';
	import EventDetailModal from '$lib/modules/calendar/components/EventDetailModal.svelte';
	import EventForm from '$lib/modules/calendar/components/EventForm.svelte';

	import { ShareNetwork } from '@manacore/shared-icons';
	import { ShareModal } from '@manacore/shared-uload';

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
		const tagData = payload.data as unknown as TagDragData;
		const current = event.tagIds ?? [];
		if (!current.includes(tagData.id)) {
			eventsStore.updateTagIds(event.id, [...current, tagData.id]);
		}
	}

	const tagDropCtx = getContext<{
		set: (handler: (tagId: string, payload: DragPayload) => void) => void;
		clear: () => void;
	}>('tagDropHandler');

	onMount(() => {
		tagDropCtx?.set(async (tagId: string, payload: DragPayload) => {
			const data = payload.data as { id: string };
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

	// ── Event interactions ──────────────────────────────────
	let selectedEvent = $state<CalendarEvent | null>(null);
	let showCreateForm = $state(false);
	let createStartTime = $state<Date | null>(null);
	let createEndTime = $state<Date | null>(null);

	function handleEventClick(event: CalendarEvent) {
		selectedEvent = event;
	}

	function handleNewEvent() {
		createStartTime = null;
		createEndTime = null;
		showCreateForm = true;
	}

	function handleQuickCreate(startTime: Date, endTime: Date) {
		createStartTime = startTime;
		createEndTime = endTime;
		showCreateForm = true;
	}

	async function handleCreateSave(data: Record<string, unknown>) {
		const defaultCal = getDefaultCalendar(calendarsCtx.value);
		await eventsStore.createEvent({
			calendarId: (data.calendarId as string) || defaultCal?.id || '',
			title: data.title as string,
			description: (data.description as string) || null,
			startTime: data.startTime as string,
			endTime: data.endTime as string,
			isAllDay: data.isAllDay as boolean,
			location: (data.location as string) || null,
			recurrenceRule: (data.recurrenceRule as string) || null,
		});
		showCreateForm = false;
	}

	// Share modal
	let shareEvent = $state<CalendarEvent | null>(null);
	let shareUrl = $derived(
		shareEvent
			? `${typeof window !== 'undefined' ? window.location.origin : ''}/calendar?event=${shareEvent.id}`
			: ''
	);
</script>

<svelte:head>
	<title>Kalender - ManaCore</title>
</svelte:head>

<div class="calendar-page">
	<!-- Header -->
	<CalendarHeader onNewEvent={handleNewEvent} />

	<!-- Date Strip -->
	<DateStrip />

	<!-- Main content area -->
	<div class="calendar-content">
		<!-- Sidebar (desktop only) -->
		<aside class="calendar-sidebar">
			<MiniCalendar
				selectedDate={calendarViewStore.currentDate}
				onDateSelect={(date) => {
					calendarViewStore.setDate(date);
					if (calendarViewStore.viewType === 'month') {
						calendarViewStore.setViewType('week');
					}
				}}
			/>

			<!-- Calendar list -->
			<div class="sidebar-section">
				<h3 class="sidebar-title">Kalender</h3>
				{#each calendarsCtx.value as cal (cal.id)}
					<div class="calendar-item">
						<div class="calendar-dot" style="background-color: {cal.color}"></div>
						<span class="calendar-name" class:muted={!cal.isVisible}>{cal.name}</span>
					</div>
				{/each}
				<a href="/calendar/calendars" class="sidebar-link">Verwalten</a>
			</div>
		</aside>

		<!-- Calendar view -->
		<main class="calendar-main">
			{#if calendarViewStore.viewType === 'week'}
				<WeekView onEventClick={handleEventClick} onQuickCreate={handleQuickCreate} />
			{:else if calendarViewStore.viewType === 'month'}
				<MonthView
					onEventClick={handleEventClick}
					onDayClick={(day) => {
						calendarViewStore.setDate(day);
						calendarViewStore.setViewType('week');
					}}
				/>
			{:else}
				<AgendaView onEventClick={handleEventClick} />
			{/if}
		</main>
	</div>
</div>

<!-- Event Detail Modal -->
{#if selectedEvent}
	<EventDetailModal event={selectedEvent} onClose={() => (selectedEvent = null)} />
{/if}

<!-- Create Event Modal -->
{#if showCreateForm}
	<div class="modal-backdrop" role="presentation">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="modal-backdrop-inner"
			onclick={(e) => e.target === e.currentTarget && (showCreateForm = false)}
		>
			<div class="modal-container" role="dialog" aria-modal="true">
				<h2 class="modal-title">Neuer Termin</h2>
				<EventForm
					mode="create"
					initialStartTime={createStartTime}
					initialEndTime={createEndTime}
					onSave={handleCreateSave}
					onCancel={() => (showCreateForm = false)}
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Share Modal (uLoad integration) -->
<ShareModal
	visible={shareEvent !== null}
	onClose={() => (shareEvent = null)}
	url={shareUrl}
	title={shareEvent?.title ?? ''}
	source="calendar"
	description={shareEvent?.location ? `Ort: ${shareEvent.location}` : ''}
/>

<style>
	.calendar-page {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.calendar-content {
		flex: 1;
		display: flex;
		min-height: 0;
	}

	.calendar-sidebar {
		width: 240px;
		flex-shrink: 0;
		border-right: 1px solid hsl(var(--color-border));
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
	}

	/* Hide sidebar on small screens */
	@media (max-width: 768px) {
		.calendar-sidebar {
			display: none;
		}
	}

	.sidebar-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.sidebar-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.calendar-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}

	.calendar-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.calendar-name {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}

	.calendar-name.muted {
		opacity: 0.5;
		text-decoration: line-through;
	}

	.sidebar-link {
		font-size: 0.75rem;
		color: hsl(var(--color-primary));
		text-decoration: none;
		margin-top: 0.25rem;
	}

	.sidebar-link:hover {
		text-decoration: underline;
	}

	.calendar-main {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	/* Modal styles */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
	}

	.modal-backdrop-inner {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fade-in 150ms ease;
	}

	.modal-container {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg, 12px);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		padding: 1.5rem;
		animation: slide-up 200ms ease;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 1rem;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* DnD styles */
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
