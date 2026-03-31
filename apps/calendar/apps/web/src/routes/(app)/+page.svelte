<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { birthdaysStore } from '$lib/stores/birthdays.svelte';
	import { getDefaultCalendar } from '$lib/data/queries';
	import ViewCarousel from '$lib/components/calendar/ViewCarousel.svelte';
	import QuickEventOverlay from '$lib/components/event/QuickEventOverlay.svelte';
	import ServiceStatusBanner from '$lib/components/ServiceStatusBanner.svelte';
	import type { CalendarEvent, Calendar } from '@calendar/shared';
	import { addMinutes } from 'date-fns';
	import { browser } from '$app/environment';

	// Get calendars from layout context (live query)
	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	let showQuickOverlay = $state(false);
	let quickCreateDate = $state<Date>(new Date());
	let editingEvent = $state<CalendarEvent | null>(null);
	let overlayKey = $state(0);

	function handleQuickCreate(date: Date, position: { x: number; y: number }, endDate?: Date) {
		editingEvent = null;
		quickCreateDate = date;
		const defaultCalendar = getDefaultCalendar(calendarsCtx.value);
		const endTime = endDate ?? addMinutes(date, settingsStore.defaultEventDuration);
		eventsStore.createDraftEvent({
			calendarId: defaultCalendar?.id || '',
			title: '',
			startTime: date.toISOString(),
			endTime: endTime.toISOString(),
			isAllDay: false,
		});
		overlayKey++;
		showQuickOverlay = true;
	}

	function handleEventClick(event: CalendarEvent) {
		eventsStore.clearDraftEvent();
		editingEvent = event;
		overlayKey++;
		showQuickOverlay = true;
	}

	function handleQuickOverlayClose() {
		showQuickOverlay = false;
		editingEvent = null;
		eventsStore.clearDraftEvent();
	}

	function handleEventCreated() {
		eventsStore.clearDraftEvent();
	}

	function handleEventUpdated() {}
	function handleEventDeleted() {}

	interface VoiceEventData {
		title: string;
		startTime?: Date;
		endTime?: Date;
		location?: string;
		isAllDay: boolean;
		tagNames: string[];
		calendarName?: string;
		description: string;
	}

	function handleVoiceEventCreate(event: CustomEvent<VoiceEventData>) {
		const data = event.detail;
		editingEvent = null;
		eventsStore.clearDraftEvent();
		const startTime = data.startTime || new Date();
		quickCreateDate = startTime;
		let endTime: Date;
		if (data.endTime) {
			endTime = data.endTime;
		} else if (data.isAllDay) {
			endTime = new Date(startTime);
			endTime.setHours(23, 59, 59, 999);
		} else {
			endTime = addMinutes(startTime, settingsStore.defaultEventDuration);
		}
		const defaultCalendar = getDefaultCalendar(calendarsCtx.value);
		eventsStore.createDraftEvent({
			calendarId: defaultCalendar?.id || '',
			title: data.title,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			isAllDay: data.isAllDay,
			location: data.location,
			description: data.description ? `Sprachnotiz: ${data.description}` : undefined,
		});
		overlayKey++;
		showQuickOverlay = true;
	}

	$effect(() => {
		if (browser) {
			const handler = (e: Event) => handleVoiceEventCreate(e as CustomEvent<VoiceEventData>);
			window.addEventListener('voice-event-create', handler);
			return () => window.removeEventListener('voice-event-create', handler);
		}
	});
</script>

<svelte:head>
	<title>{$_('app.name')}</title>
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (viewStore.viewType !== 'agenda') return;
		const target = e.target as HTMLElement;
		const isInQuickInput = target.closest('.quick-input-bar');
		if (isInQuickInput && (e.key === 'ArrowUp' || (e.key === 'Tab' && !e.shiftKey))) {
			const firstTitle = document.querySelector<HTMLElement>(
				'.agenda-event-title[contenteditable]'
			);
			if (firstTitle) {
				e.preventDefault();
				firstTitle.focus();
			}
		}
	}}
/>

<div class="service-banners">
	{#if settingsStore.showBirthdays}
		<ServiceStatusBanner
			serviceName="Geburtstage (Kontakte)"
			available={birthdaysStore.serviceAvailable}
			error={birthdaysStore.error}
			onRetry={() => birthdaysStore.fetchBirthdays(true)}
		/>
	{/if}
</div>

<div class="calendar-layout">
	<div class="calendar-main">
		<div class="calendar-content">
			<ViewCarousel onQuickCreate={handleQuickCreate} onEventClick={handleEventClick} />
		</div>
	</div>

	{#if showQuickOverlay}
		{#key overlayKey}
			<QuickEventOverlay
				startTime={editingEvent ? undefined : quickCreateDate}
				event={editingEvent ?? undefined}
				onClose={handleQuickOverlayClose}
				onCreated={handleEventCreated}
				onUpdated={handleEventUpdated}
				onDeleted={handleEventDeleted}
			/>
		{/key}
	{/if}
</div>

<style>
	.calendar-layout {
		display: flex;
		width: 100%;
		flex: 1;
		min-height: 0;
		position: relative;
	}

	.calendar-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}

	.calendar-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.calendar-layout {
			flex-direction: column;
			gap: 0;
			flex: 1;
			height: 100%;
			min-height: 0;
			overflow: hidden;
		}

		.calendar-main {
			flex: 1;
			height: 100%;
		}

		.calendar-content {
			height: 100%;
			overflow-y: auto;
		}
	}

	.service-banners {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0 0.5rem;
	}

	.service-banners:empty {
		display: none;
	}
</style>
