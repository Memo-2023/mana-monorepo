<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import CalendarHeader from '$lib/components/calendar/CalendarHeader.svelte';
	import WeekView from '$lib/components/calendar/WeekView.svelte';
	import DayView from '$lib/components/calendar/DayView.svelte';
	import MonthView from '$lib/components/calendar/MonthView.svelte';
	import MultiDayView from '$lib/components/calendar/MultiDayView.svelte';
	import MiniCalendar from '$lib/components/calendar/MiniCalendar.svelte';
	import CalendarSidebar from '$lib/components/calendar/CalendarSidebar.svelte';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';

	let initialized = $state(false);

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

	function handleDateSelect(date: Date) {
		viewStore.setDate(date);
	}

	function handleNewEvent() {
		goto('/event/new');
	}
</script>

<svelte:head>
	<title>Kalender</title>
</svelte:head>

<div class="calendar-layout">
	<!-- Left Sidebar -->
	<aside class="calendar-sidebar" class:collapsed={settingsStore.sidebarCollapsed}>
		<!-- Collapse button at top -->
		<button
			class="sidebar-collapse-btn"
			onclick={() => settingsStore.toggleSidebar()}
			title="Sidebar ausblenden"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
			</svg>
		</button>

		<button
			class="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
			onclick={handleNewEvent}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Neuer Termin
		</button>

		<MiniCalendar
			selectedDate={viewStore.currentDate}
			onDateSelect={handleDateSelect}
		/>

		<CalendarSidebar />
	</aside>

	<!-- FAB when sidebar is collapsed -->
	{#if settingsStore.sidebarCollapsed}
		<div class="sidebar-fab">
			<button
				class="fab-expand"
				onclick={() => settingsStore.toggleSidebar()}
				title="Sidebar einblenden"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</button>
			<button
				class="fab-new-event"
				onclick={handleNewEvent}
				title="Neuer Termin"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- Main Calendar Area -->
	<div class="calendar-main">
		<CalendarHeader />

		<div class="calendar-content">
			{#if viewStore.viewType === 'day'}
				<DayView />
			{:else if viewStore.viewType === '5day'}
				<MultiDayView dayCount={5} />
			{:else if viewStore.viewType === 'week'}
				<WeekView />
			{:else if viewStore.viewType === '10day'}
				<MultiDayView dayCount={10} />
			{:else if viewStore.viewType === '14day'}
				<MultiDayView dayCount={14} />
			{:else if viewStore.viewType === 'month'}
				<MonthView />
			{:else}
				<WeekView />
			{/if}
		</div>
	</div>
</div>

<style>
	.calendar-layout {
		display: flex;
		gap: 1.5rem;
		flex: 1;
		min-height: 0;
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
		margin-right: -1.5rem;
		pointer-events: none;
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

	.fab-expand,
	.fab-new-event {
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
	}

	.fab-expand {
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
	}

	.fab-expand:hover {
		background: hsl(var(--color-muted));
		transform: scale(1.05);
	}

	.fab-new-event {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.fab-new-event:hover {
		background: hsl(var(--color-primary) / 0.9);
		transform: scale(1.05);
	}

	.calendar-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		background: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border));
		overflow: hidden;
	}

	.calendar-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
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
