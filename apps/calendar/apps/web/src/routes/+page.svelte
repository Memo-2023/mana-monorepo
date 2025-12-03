<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import CalendarHeader from '$lib/components/calendar/CalendarHeader.svelte';
	import WeekView from '$lib/components/calendar/WeekView.svelte';
	import DayView from '$lib/components/calendar/DayView.svelte';
	import MonthView from '$lib/components/calendar/MonthView.svelte';
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
	<aside class="calendar-sidebar">
		<button
			class="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
			onclick={handleNewEvent}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Neuer Termin
		</button>

		<MiniCalendar selectedDate={viewStore.currentDate} onDateSelect={handleDateSelect} />

		<CalendarSidebar />
	</aside>

	<!-- Main Calendar Area -->
	<div class="calendar-main">
		<CalendarHeader />

		<div class="calendar-content">
			{#if viewStore.viewType === 'day'}
				<DayView />
			{:else if viewStore.viewType === 'week'}
				<WeekView />
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
		height: 100%;
		max-height: calc(100vh - 160px);
	}

	.calendar-sidebar {
		width: 260px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.calendar-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		background: hsl(var(--card));
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--border));
		overflow: hidden;
	}

	.calendar-content {
		flex: 1;
		overflow: auto;
	}

	@media (max-width: 1024px) {
		.calendar-sidebar {
			display: none;
		}
	}
</style>
