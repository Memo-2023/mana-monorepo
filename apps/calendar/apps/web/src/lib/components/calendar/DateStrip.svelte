<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
	import { eventsStore } from '$lib/stores/events.svelte';
	import {
		format,
		isToday,
		isSameDay,
		addDays,
		subDays,
		startOfDay,
		isWithinInterval,
	} from 'date-fns';
	import { de } from 'date-fns/locale';
	import { onMount, tick } from 'svelte';
	import SunCalc from 'suncalc';

	interface Props {
		isSidebarMode?: boolean;
	}

	let { isSidebarMode = false }: Props = $props();

	// Get event count for a day (max 5 dots displayed)
	function getEventCount(date: Date): number {
		const events = eventsStore.getEventsForDay(date, false);
		return Math.min(events.length, 5); // Cap at 5 dots
	}

	// Moon phase emojis (8 phases)
	const MOON_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

	// Get moon emoji for a date
	function getMoonEmoji(date: Date): string {
		const moonData = SunCalc.getMoonIllumination(date);
		// phase: 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
		const phaseIndex = Math.floor(moonData.phase * 8) % 8;
		return MOON_EMOJIS[phaseIndex];
	}

	// Check if this is a significant moon phase (new, first quarter, full, last quarter)
	function isSignificantMoonPhase(date: Date): { significant: boolean; emoji: string } {
		const moonData = SunCalc.getMoonIllumination(date);
		const phase = moonData.phase;
		// Lunar cycle is ~29.53 days, so 1 day = ~0.0339
		// Use half a day tolerance (~0.017) to ensure only 1 day is marked
		const tolerance = 0.017;

		if (phase < tolerance || phase > 1 - tolerance) {
			return { significant: true, emoji: '🌑' }; // New moon
		}
		if (Math.abs(phase - 0.25) < tolerance) {
			return { significant: true, emoji: '🌓' }; // First quarter
		}
		if (Math.abs(phase - 0.5) < tolerance) {
			return { significant: true, emoji: '🌕' }; // Full moon
		}
		if (Math.abs(phase - 0.75) < tolerance) {
			return { significant: true, emoji: '🌗' }; // Last quarter
		}

		return { significant: false, emoji: '' };
	}

	// Reactive view range - needed to trigger re-renders
	let viewRange = $derived(viewStore.viewRange);
	let currentDate = $derived(viewStore.currentDate);

	// How many days to load in each direction
	const DAYS_BUFFER = 60;
	const LOAD_THRESHOLD = 20;

	// Generate initial days centered around current date
	let startDate = $state(subDays(startOfDay(new Date()), DAYS_BUFFER));
	let endDate = $state(addDays(startOfDay(new Date()), DAYS_BUFFER));

	// Track if today is visible in the scroll view
	let isTodayVisible = $state(true);

	// Generate array of days
	let days = $derived.by(() => {
		const result: Date[] = [];
		let current = startDate;
		while (current <= endDate) {
			result.push(current);
			current = addDays(current, 1);
		}
		return result;
	});

	// Scroll container ref
	let scrollContainer: HTMLDivElement;
	let isLoadingMore = false;

	// Scroll to selected date when it changes
	$effect(() => {
		if (scrollContainer && currentDate) {
			scrollToDate(currentDate);
		}
	});

	async function scrollToDate(date: Date, instant = false) {
		await tick();

		const targetDate = startOfDay(date);
		if (targetDate < startDate) {
			startDate = subDays(targetDate, DAYS_BUFFER);
			await tick();
		} else if (targetDate > endDate) {
			endDate = addDays(targetDate, DAYS_BUFFER);
			await tick();
		}

		const dayElement = scrollContainer?.querySelector(
			`[data-date="${format(date, 'yyyy-MM-dd')}"]`
		);
		if (dayElement) {
			dayElement.scrollIntoView({
				behavior: instant ? 'instant' : 'smooth',
				inline: 'center',
				block: 'nearest',
			});
		}
	}

	function handleDayClick(day: Date) {
		viewStore.setDate(day);
	}

	function goToToday() {
		const today = new Date();
		viewStore.setDate(today);
	}

	async function loadMoreDays(direction: 'past' | 'future') {
		if (isLoadingMore) return;
		isLoadingMore = true;

		if (direction === 'past') {
			const scrollLeftBefore = scrollContainer?.scrollLeft || 0;
			startDate = subDays(startDate, DAYS_BUFFER);
			await tick();
			if (scrollContainer) {
				scrollContainer.scrollLeft = scrollLeftBefore + DAYS_BUFFER * 54;
			}
		} else {
			endDate = addDays(endDate, DAYS_BUFFER);
		}

		isLoadingMore = false;
	}

	function checkTodayVisibility() {
		if (!scrollContainer) return;

		const todayElement = scrollContainer.querySelector('[data-is-today="true"]');
		if (!todayElement) {
			isTodayVisible = false;
			return;
		}

		const containerRect = scrollContainer.getBoundingClientRect();
		const todayRect = todayElement.getBoundingClientRect();

		isTodayVisible =
			todayRect.left >= containerRect.left - 20 && todayRect.right <= containerRect.right + 20;
	}

	function handleScroll() {
		if (!scrollContainer || isLoadingMore) return;

		checkTodayVisibility();
		updateVisibleMonth();

		const { scrollLeft, clientWidth } = scrollContainer;
		const dayWidth = 54;
		const visibleDayIndex = Math.floor(scrollLeft / dayWidth);
		const totalDays = days.length;

		if (visibleDayIndex < LOAD_THRESHOLD) {
			loadMoreDays('past');
		}

		if (totalDays - visibleDayIndex - Math.floor(clientWidth / dayWidth) < LOAD_THRESHOLD) {
			loadMoreDays('future');
		}
	}

	// Get the month of the center visible day (initial: today)
	let visibleMonth = $state(format(new Date(), 'MMMM yyyy', { locale: de }));

	function updateVisibleMonth() {
		if (!scrollContainer) return;

		const containerRect = scrollContainer.getBoundingClientRect();
		const centerX = containerRect.left + containerRect.width / 2;

		// Find the day element closest to center
		const dayElements = scrollContainer.querySelectorAll('.day-item');
		for (const el of dayElements) {
			const rect = el.getBoundingClientRect();
			if (rect.left <= centerX && rect.right >= centerX) {
				const dateStr = el.getAttribute('data-date');
				if (dateStr) {
					const date = new Date(dateStr);
					visibleMonth = format(date, 'MMMM yyyy', { locale: de });
				}
				break;
			}
		}
	}

	onMount(async () => {
		// Always scroll to today on mount, then update the visible month
		const today = new Date();
		await scrollToDate(today, true);
		updateVisibleMonth();
		checkTodayVisibility();
	});
</script>

<div class="date-strip-wrapper" class:sidebar-mode={isSidebarMode}>
	<div class="date-strip-container">
		<!-- Month label -->
		<div class="month-header">
			<span class="month-label">
				{#if !isTodayVisible}
					<button onclick={goToToday} title="Zum heutigen Tag" class="today-button">
						<span class="today-label">Heute</span>
						<span class="today-date">{format(new Date(), 'd. MMM', { locale: de })}</span>
					</button>
				{/if}
				{visibleMonth}
			</span>
		</div>

		<!-- Days row -->
		<div class="days-scroll" bind:this={scrollContainer} onscroll={handleScroll}>
			{#each days as day}
				{@const dayIsToday = isToday(day)}
				{@const dayIsSelected = isSameDay(day, currentDate)}
				{@const dayIsWeekend = day.getDay() === 0 || day.getDay() === 6}
				{@const dayInRange = isWithinInterval(day, { start: viewRange.start, end: viewRange.end })}
				{@const dayIsRangeStart = isSameDay(day, viewRange.start)}
				{@const dayIsRangeEnd = isSameDay(day, viewRange.end)}
				{@const isFirstOfMonth = day.getDate() === 1}
				{@const moonPhase = isSignificantMoonPhase(day)}
				{@const eventCount = getEventCount(day)}
				{#if isFirstOfMonth}
					<div class="month-divider"></div>
				{/if}
				<button
					class="day-item"
					class:weekend={dayIsWeekend}
					class:selected={dayIsSelected && !dayIsToday}
					class:in-range={dayInRange && !dayIsToday}
					class:range-start={dayIsRangeStart && !dayIsToday}
					class:range-end={dayIsRangeEnd && !dayIsToday}
					data-date={format(day, 'yyyy-MM-dd')}
					data-is-today={dayIsToday}
					onclick={() => handleDayClick(day)}
					style={dayIsToday
						? 'background: #3b82f6; color: white; border-radius: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);'
						: ''}
				>
					{#if moonPhase.significant}
						<span class="moon-indicator">{moonPhase.emoji}</span>
					{/if}
					<span class="day-weekday" style={dayIsToday ? 'opacity: 1; color: white;' : ''}
						>{format(day, 'EE', { locale: de })}</span
					>
					<span class="day-number" style={dayIsToday ? 'color: white;' : ''}
						>{format(day, 'd')}</span
					>
					{#if eventCount > 0}
						<div class="event-dots" style={dayIsToday ? 'opacity: 0.9;' : ''}>
							{#each Array(eventCount) as _, i}
								<span class="event-dot" style={dayIsToday ? 'background: white;' : ''}></span>
							{/each}
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.date-strip-wrapper {
		position: fixed;
		bottom: calc(200px + env(safe-area-inset-bottom, 0px)); /* Above InputBar */
		left: 0;
		right: 0;
		z-index: 48;
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: none;
		transition: bottom 0.3s ease;
	}

	/* When PillNav is in sidebar mode, no PillNav/Toolbar at bottom - just InputBar */
	.date-strip-wrapper.sidebar-mode {
		bottom: calc(70px + env(safe-area-inset-bottom, 0px));
	}

	.today-button {
		position: absolute;
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-right: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.375rem 0.875rem;
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 9999px;
		cursor: pointer;
		color: #3b82f6;
		pointer-events: auto;
		transition: all 0.2s ease;
	}

	.today-button:hover {
		background: #3b82f6;
		border-color: #3b82f6;
		color: white;
		transform: translateY(-50%) scale(1.02);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.today-button:hover .today-date {
		color: rgba(255, 255, 255, 0.85);
	}

	.today-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.today-date {
		font-size: 0.75rem;
		font-weight: 500;
		color: #60a5fa;
	}

	.date-strip-container {
		display: flex;
		flex-direction: column;
		background: var(--color-surface, #ffffff);
		border-radius: 16px;
		margin: 0 1rem;
		padding: 0.5rem 1.5rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid var(--color-border, #e5e7eb);
		pointer-events: auto;
		max-width: calc(100vw - 2rem);
		min-width: 420px;
		overflow: hidden;
	}

	.month-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem 0.5rem;
	}

	.month-label {
		position: relative;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-foreground, #1f2937);
		white-space: nowrap;
		min-width: 150px;
		text-align: center;
	}

	.month-divider {
		width: 1px;
		height: 40px;
		background: var(--color-border, #e5e7eb);
		margin: 0 0.5rem;
		flex-shrink: 0;
	}

	.days-scroll {
		display: flex;
		align-items: center;
		gap: 2px;
		overflow-x: auto;
		overflow-y: visible;
		scrollbar-width: none;
		-ms-overflow-style: none;
		scroll-behavior: auto;
		padding: 1.25rem 0.25rem 0.25rem;
		margin-top: -1rem;
	}

	.days-scroll::-webkit-scrollbar {
		display: none;
	}

	.day-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 52px;
		height: 58px;
		padding: 0.375rem;
		background: transparent;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		color: var(--color-foreground, #1f2937);
		transition: all 0.15s ease;
		flex-shrink: 0;
		position: relative;
	}

	.moon-indicator {
		position: absolute;
		top: -16px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 1.125rem;
		line-height: 1;
	}

	.event-dots {
		display: flex;
		gap: 2px;
		justify-content: center;
		margin-top: 2px;
	}

	.event-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #3b82f6;
		opacity: 0.7;
	}

	.day-item:hover {
		background: var(--color-muted, #f3f4f6);
	}

	.day-item.weekend {
		color: var(--color-muted-foreground, #6b7280);
	}

	.day-item.selected {
		background: var(--color-muted, #f3f4f6);
		color: #3b82f6;
		font-weight: 600;
	}

	/* View range highlighting */
	.day-item.in-range {
		background: rgba(59, 130, 246, 0.15);
		border-radius: 0;
	}

	.day-item.in-range.range-start {
		border-radius: 10px 0 0 10px;
	}

	.day-item.in-range.range-end {
		border-radius: 0 10px 10px 0;
	}

	.day-item.in-range.range-start.range-end {
		border-radius: 10px;
	}

	.day-item.in-range:hover {
		background: rgba(59, 130, 246, 0.25);
	}

	.day-weekday {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		opacity: 0.7;
	}

	.day-number {
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.date-strip-container {
			margin: 0 0.5rem;
			padding: 0.375rem;
		}

		.month-label {
			font-size: 1rem;
		}

		.day-item {
			min-width: 44px;
			height: 52px;
		}

		.moon-indicator {
			font-size: 1rem;
			top: -14px;
		}

		.day-number {
			font-size: 1rem;
		}

		.day-weekday {
			font-size: 0.6875rem;
		}

		.month-divider {
			height: 32px;
			margin: 0 0.375rem;
		}
	}
</style>
