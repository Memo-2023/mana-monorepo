<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { birthdaysStore } from '$lib/stores/birthdays.svelte';
	import ViewCarousel from '$lib/components/calendar/ViewCarousel.svelte';
	import TodoSidebarSection from '$lib/components/calendar/TodoSidebarSection.svelte';
	import QuickEventOverlay from '$lib/components/event/QuickEventOverlay.svelte';
	import ServiceStatusBanner from '$lib/components/ServiceStatusBanner.svelte';
	import { CalendarViewSkeleton } from '$lib/components/skeletons';
	import type { CalendarEvent } from '@calendar/shared';
	import { addMinutes } from 'date-fns';
	import { browser } from '$app/environment';

	let initialized = $state(false);

	// Quick event overlay state - for both create and edit
	let showQuickOverlay = $state(false);
	let quickCreateDate = $state<Date>(new Date());
	let editingEvent = $state<CalendarEvent | null>(null);

	// Generate a unique key for the overlay to force remount
	let overlayKey = $state(0);

	function handleQuickCreate(date: Date, position: { x: number; y: number }, endDate?: Date) {
		// Close any existing overlay first
		editingEvent = null;

		quickCreateDate = date;

		// Create draft event immediately so it appears in the grid
		const defaultCalendar = calendarsStore.defaultCalendar;
		// Use provided endDate or calculate from default duration
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
		// Close any existing overlay/draft first
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
		// Event is automatically added to store, draft is cleared
		eventsStore.clearDraftEvent();
	}

	function handleEventUpdated() {
		// Event is automatically updated in store
	}

	function handleEventDeleted() {
		// Event is automatically removed from store
	}

	// Voice event creation handler
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

		// Close any existing overlay first
		editingEvent = null;
		eventsStore.clearDraftEvent();

		// Determine start time - use parsed time or default to now
		const startTime = data.startTime || new Date();
		quickCreateDate = startTime;

		// Calculate end time
		let endTime: Date;
		if (data.endTime) {
			endTime = data.endTime;
		} else if (data.isAllDay) {
			endTime = new Date(startTime);
			endTime.setHours(23, 59, 59, 999);
		} else {
			endTime = addMinutes(startTime, settingsStore.defaultEventDuration);
		}

		// Get default calendar
		const defaultCalendar = calendarsStore.defaultCalendar;

		// Create draft event with voice transcription data
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

	// Listen for voice event creation from layout
	$effect(() => {
		if (browser) {
			const handler = (e: Event) => handleVoiceEventCreate(e as CustomEvent<VoiceEventData>);
			window.addEventListener('voice-event-create', handler);
			return () => window.removeEventListener('voice-event-create', handler);
		}
	});

	// Track view changes to refetch events
	let lastViewType = $state(viewStore.viewType);
	let lastDateKey = $state(viewStore.currentDate.toDateString());

	onMount(async () => {
		// Fetch events for current view range (works in both guest and authenticated mode)
		await eventsStore.fetchEvents(viewStore.viewRange.start, viewStore.viewRange.end);
		initialized = true;
	});

	// Refetch events when view type or date changes
	$effect(() => {
		const currentViewType = viewStore.viewType;
		const currentDateKey = viewStore.currentDate.toDateString();

		// Only refetch if view actually changed
		if (initialized && (currentViewType !== lastViewType || currentDateKey !== lastDateKey)) {
			lastViewType = currentViewType;
			lastDateKey = currentDateKey;
			eventsStore.fetchEvents(viewStore.viewRange.start, viewStore.viewRange.end);
		}
	});
</script>

<svelte:head>
	<title>{$_('app.name')}</title>
</svelte:head>

<div class="service-banners">
	<ServiceStatusBanner
		serviceName="Todo-Service"
		available={todosStore.serviceAvailable}
		error={todosStore.error}
		onRetry={() => todosStore.fetchTodos()}
	/>
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
	<!-- Desktop: Left Sidebar -->
	<aside class="calendar-sidebar desktop-only" class:collapsed={settingsStore.sidebarCollapsed}>
		<!-- Collapse button at top -->
		<button
			class="sidebar-collapse-btn"
			onclick={() => settingsStore.toggleSidebar()}
			title={$_('calendar.hideSidebar')}
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
				/>
			</svg>
		</button>

		<TodoSidebarSection maxItems={5} />
	</aside>

	<!-- Main Calendar Area -->
	<div class="calendar-main" class:expanded={settingsStore.sidebarCollapsed}>
		<div class="calendar-content">
			{#if !initialized}
				<CalendarViewSkeleton />
			{:else}
				<ViewCarousel onQuickCreate={handleQuickCreate} onEventClick={handleEventClick} />
			{/if}
		</div>
	</div>

	<!-- Mobile: Bottom Todo Section -->
	<aside
		class="calendar-sidebar-mobile mobile-only"
		class:collapsed={settingsStore.sidebarCollapsed}
	>
		<TodoSidebarSection maxItems={3} />
	</aside>

	<!-- Quick Event Overlay (for both create and edit) -->
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
		gap: 1.5rem;
		width: 100%;
		flex: 1;
		min-height: 0;
		position: relative;
	}

	/* Desktop only elements */
	.desktop-only {
		display: flex;
	}

	/* Mobile only elements - hidden by default */
	.mobile-only {
		display: none;
	}

	.calendar-sidebar {
		width: 260px;
		flex-shrink: 0;
		flex-direction: column;
		gap: 1rem;
		position: relative;
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: left top;
	}

	.calendar-sidebar.collapsed {
		width: 0;
		opacity: 0;
		overflow: hidden;
		pointer-events: none;
		padding: 0;
		margin: 0;
	}

	.calendar-layout:has(.calendar-sidebar.collapsed) {
		gap: 0;
	}

	.sidebar-collapse-btn {
		position: absolute;
		top: 0;
		right: -12px;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-full);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 10;
		transition: all 150ms ease;
		color: var(--color-muted-foreground);
	}

	.sidebar-collapse-btn:hover {
		background: var(--color-muted);
		color: var(--color-foreground);
	}

	.calendar-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.calendar-main.expanded {
		border-radius: 0;
		border: none;
	}

	.calendar-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	/* Mobile: Bottom Todo Section */
	.calendar-sidebar-mobile {
		width: 100%;
		flex-direction: column;
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
		padding: 0.75rem;
		overflow-y: auto;
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.calendar-sidebar-mobile.collapsed {
		height: 0;
		flex: 0;
		padding: 0;
		opacity: 0;
		overflow: hidden;
		border: none;
	}

	/* Mobile Layout - 50/50 Splitscreen */
	@media (max-width: 768px) {
		.calendar-layout {
			flex-direction: column;
			gap: 0;
			flex: 1;
			height: 100%;
			min-height: 0;
			overflow: hidden;
		}

		.desktop-only {
			display: none !important;
		}

		.mobile-only {
			display: flex;
		}

		.calendar-main {
			border-radius: 0;
			border: none;
			min-height: 0;
			overflow: hidden;
		}

		.calendar-layout:has(.calendar-sidebar-mobile:not(.collapsed)) .calendar-main {
			flex: 0 0 50%;
			height: 50%;
		}

		.calendar-layout:has(.calendar-sidebar-mobile.collapsed) .calendar-main {
			flex: 1;
			height: 100%;
		}

		.calendar-content {
			height: 100%;
			overflow-y: auto;
		}

		.calendar-sidebar-mobile {
			display: flex;
			flex-direction: column;
			flex: 0 0 50%;
			height: 50%;
			max-height: none;
			border-radius: 0;
			margin-bottom: 0;
			padding: 0;
			border-top: none;
			overflow: hidden;
		}

		.calendar-sidebar-mobile > :global(*) {
			flex: 1;
			min-height: 0;
		}

		.calendar-sidebar-mobile.collapsed {
			flex: 0;
			height: 0;
			padding: 0;
			border: none;
		}
	}

	@media (min-width: 769px) and (max-width: 1024px) {
		.calendar-sidebar {
			width: 220px;
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
