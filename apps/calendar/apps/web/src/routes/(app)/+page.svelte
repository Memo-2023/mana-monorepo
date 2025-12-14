<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { isSidebarMode as sidebarModeStore } from '$lib/stores/navigation';
	import ViewCarousel from '$lib/components/calendar/ViewCarousel.svelte';
	import TodoSidebarSection from '$lib/components/calendar/TodoSidebarSection.svelte';
	import QuickEventOverlay from '$lib/components/event/QuickEventOverlay.svelte';
	import { CalendarViewSkeleton } from '$lib/components/skeletons';
	import type { CalendarEvent } from '@calendar/shared';
	import { addMinutes } from 'date-fns';

	let initialized = $state(false);

	// Quick event overlay state - for both create and edit
	let showQuickOverlay = $state(false);
	let quickCreateDate = $state<Date>(new Date());
	let editingEvent = $state<CalendarEvent | null>(null);

	// Generate a unique key for the overlay to force remount
	let overlayKey = $state(0);

	function handleQuickCreate(date: Date, position: { x: number; y: number }) {
		// Close any existing overlay first
		editingEvent = null;

		quickCreateDate = date;

		// Create draft event immediately so it appears in the grid
		const defaultCalendar = calendarsStore.defaultCalendar;
		const endTime = addMinutes(date, settingsStore.defaultEventDuration);

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

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Fetch events for current view range
		await eventsStore.fetchEvents(viewStore.viewRange.start, viewStore.viewRange.end);
		initialized = true;
	});

	// Refetch events when view changes
	$effect(() => {
		if (initialized && authStore.isAuthenticated) {
			eventsStore.fetchEvents(viewStore.viewRange.start, viewStore.viewRange.end);
		}
	});
</script>

<svelte:head>
	<title>{$_('app.name')}</title>
</svelte:head>

<div class="calendar-layout">
	<!-- Left Sidebar -->
	<aside class="calendar-sidebar" class:collapsed={settingsStore.sidebarCollapsed}>
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

	<!-- FAB when sidebar is collapsed -->
	{#if settingsStore.sidebarCollapsed}
		<div class="sidebar-fab" class:pill-sidebar={$sidebarModeStore}>
			<button
				class="fab-expand"
				onclick={() => settingsStore.toggleSidebar()}
				title={$_('calendar.showSidebar')}
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
			</button>
		</div>
	{/if}

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
		position: relative;
	}

	.calendar-sidebar {
		width: 260px;
		flex-shrink: 0;
		display: flex;
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
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 10;
		transition: all 150ms ease;
		color: hsl(var(--color-muted-foreground));
	}

	.sidebar-collapse-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	/* FAB container */
	.sidebar-fab {
		position: fixed;
		left: 1rem;
		bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 50;
		animation: fab-slide-in 300ms cubic-bezier(0.4, 0, 0.2, 1);
		transition: left 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.sidebar-fab.pill-sidebar {
		left: 195px;
	}

	@keyframes fab-slide-in {
		from {
			opacity: 0;
			transform: translateX(-20px) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}

	.fab-expand {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 150ms ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
	}

	.fab-expand:hover {
		background: hsl(var(--color-muted));
		transform: scale(1.05);
	}

	.calendar-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		background: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border));
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.calendar-main.expanded {
		border-radius: 0;
		border: none;
	}

	.calendar-content {
		flex: 1;
	}

	@media (max-width: 1024px) {
		.calendar-sidebar {
			display: none;
		}

		.sidebar-fab {
			display: flex;
		}
	}
</style>
