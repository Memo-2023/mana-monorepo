<script lang="ts">
	import { viewStore } from '$lib/stores/view.svelte';
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

	// Reactive view range - needed to trigger re-renders
	let viewRange = $derived(viewStore.viewRange);
	let currentDate = $derived(viewStore.currentDate);

	// Check if a day is within the current view range
	function isInViewRange(day: Date): boolean {
		return isWithinInterval(day, { start: viewRange.start, end: viewRange.end });
	}

	// Check if day is the first in the view range
	function isFirstInRange(day: Date): boolean {
		return isSameDay(day, viewRange.start);
	}

	// Check if day is the last in the view range
	function isLastInRange(day: Date): boolean {
		return isSameDay(day, viewRange.end);
	}

	// How many days to load in each direction
	const DAYS_BUFFER = 60;
	const LOAD_THRESHOLD = 20; // Load more when within this many days of edge

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

	async function scrollToDate(date: Date) {
		await tick();

		// First ensure the date is in our range
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
				behavior: 'smooth',
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
			// Save scroll position relative to a reference element
			const firstVisibleDay = scrollContainer?.querySelector('.day-item');
			const scrollLeftBefore = scrollContainer?.scrollLeft || 0;

			startDate = subDays(startDate, DAYS_BUFFER);
			await tick();

			// Restore scroll position
			if (firstVisibleDay && scrollContainer) {
				const newScrollLeft = scrollLeftBefore + DAYS_BUFFER * 54; // 54px is approximate day width (52px + gap)
				scrollContainer.scrollLeft = newScrollLeft;
			}
		} else {
			endDate = addDays(endDate, DAYS_BUFFER);
		}

		isLoadingMore = false;
	}

	function checkTodayVisibility() {
		if (!scrollContainer) return;

		const todayElement = scrollContainer.querySelector('.day-item.today');
		if (!todayElement) {
			isTodayVisible = false;
			return;
		}

		const containerRect = scrollContainer.getBoundingClientRect();
		const todayRect = todayElement.getBoundingClientRect();

		// Check if today element is within the visible scroll area
		isTodayVisible =
			todayRect.left >= containerRect.left - 20 && todayRect.right <= containerRect.right + 20;
	}

	function handleScroll() {
		if (!scrollContainer || isLoadingMore) return;

		// Check if today is visible
		checkTodayVisibility();

		const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
		const scrollRight = scrollWidth - scrollLeft - clientWidth;

		// Calculate approximate day index from scroll position
		const dayWidth = 54; // approximate (52px + gap)
		const visibleDayIndex = Math.floor(scrollLeft / dayWidth);
		const totalDays = days.length;

		// Load more past days
		if (visibleDayIndex < LOAD_THRESHOLD) {
			loadMoreDays('past');
		}

		// Load more future days
		if (totalDays - visibleDayIndex - Math.floor(clientWidth / dayWidth) < LOAD_THRESHOLD) {
			loadMoreDays('future');
		}
	}

	// Get month label for a date (shown at month boundaries)
	function getMonthLabel(day: Date, index: number): string | null {
		// Show month label on first day of month or first day in view
		if (day.getDate() === 1 || index === 0) {
			if (day.getMonth() === 0 && day.getDate() === 1) {
				// Show year for January 1st
				return format(day, 'MMM yyyy', { locale: de });
			}
			return format(day, 'MMM', { locale: de });
		}
		return null;
	}

	onMount(() => {
		// Initial scroll to current date
		scrollToDate(viewStore.currentDate);
	});
</script>

<div class="date-strip-wrapper">
	<!-- Floating Today button (only visible when today is scrolled out of view) -->
	{#if !isTodayVisible}
		<button class="today-btn-floating" onclick={goToToday} title="Zum heutigen Tag"> Heute </button>
	{/if}

	<div class="date-strip-container">
		<!-- Scrollable days container -->
		<div class="days-scroll" bind:this={scrollContainer} onscroll={handleScroll}>
			{#each days as day, index}
				{@const monthLabel = getMonthLabel(day, index)}
				{@const dayIsToday = isToday(day)}
				{@const dayIsSelected = isSameDay(day, currentDate)}
				{@const dayIsWeekend = day.getDay() === 0 || day.getDay() === 6}
				{@const dayIsFirstOfMonth = day.getDate() === 1}
				{@const dayInRange = isWithinInterval(day, { start: viewRange.start, end: viewRange.end })}
				{@const dayIsRangeStart = isSameDay(day, viewRange.start)}
				{@const dayIsRangeEnd = isSameDay(day, viewRange.end)}
				{#if monthLabel}
					<div class="month-marker">
						<span class="month-label">{monthLabel}</span>
					</div>
				{/if}
				<button
					class="day-item"
					class:today={dayIsToday}
					class:selected={dayIsSelected}
					class:weekend={dayIsWeekend}
					class:first-of-month={dayIsFirstOfMonth}
					class:in-range={dayInRange}
					class:range-start={dayIsRangeStart}
					class:range-end={dayIsRangeEnd}
					data-date={format(day, 'yyyy-MM-dd')}
					onclick={() => handleDayClick(day)}
				>
					<span class="day-weekday">{format(day, 'EE', { locale: de })}</span>
					<span class="day-number">{format(day, 'd')}</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.date-strip-wrapper {
		position: fixed;
		bottom: calc(130px + env(safe-area-inset-bottom, 0px));
		left: 0;
		right: 0;
		z-index: 998;
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: none;
	}

	.today-btn-floating {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: var(--color-primary-foreground);
		font-size: 0.8125rem;
		font-weight: 600;
		white-space: nowrap;
		transition: all 0.2s ease;
		pointer-events: auto;
		margin-bottom: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		animation: fade-in 0.2s ease;
	}

	.today-btn-floating:hover {
		background: color-mix(in srgb, var(--color-primary) 90%, transparent);
		transform: scale(1.05);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.date-strip-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		width: 100%;
		pointer-events: auto;
	}

	.days-scroll {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		scroll-behavior: auto;
		flex: 1;
		padding: 0.25rem 0;
	}

	.days-scroll::-webkit-scrollbar {
		display: none;
	}

	.month-marker {
		display: flex;
		align-items: center;
		padding: 0 0.5rem;
		flex-shrink: 0;
	}

	.month-label {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-primary);
		white-space: nowrap;
		padding: 0.25rem 0.5rem;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		border-radius: 4px;
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
		color: var(--color-foreground);
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.day-item:hover {
		background: var(--color-muted);
		opacity: 0.7;
	}

	.day-item.weekend {
		color: var(--color-muted-foreground);
	}

	/* Today - always highlighted with primary color */
	.day-item.today {
		background: var(--color-primary) !important;
		color: var(--color-primary-foreground) !important;
		border-radius: 10px !important;
		font-weight: 700;
	}

	.day-item.today:hover {
		opacity: 0.9;
	}

	.day-item.selected:not(.today) {
		background: var(--color-muted);
		color: var(--color-primary);
		font-weight: 600;
	}

	/* View range highlighting */
	.day-item.in-range:not(.today) {
		background: var(--color-muted);
		border-radius: 0;
	}

	.day-item.in-range.range-start:not(.today) {
		border-radius: 10px 0 0 10px;
	}

	.day-item.in-range.range-end:not(.today) {
		border-radius: 0 10px 10px 0;
	}

	.day-item.in-range.range-start.range-end:not(.today) {
		border-radius: 10px;
	}

	.day-item.in-range:not(.today):not(.selected):hover {
		background: var(--color-border);
	}

	.day-item.first-of-month:not(.today):not(.selected):not(.in-range) {
		border-left: 2px solid var(--color-border);
		border-radius: 0 8px 8px 0;
		margin-left: 0.25rem;
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
			padding: 0.5rem 0.5rem;
		}

		.today-btn-floating {
			padding: 0.375rem 0.75rem;
			font-size: 0.75rem;
		}

		.day-item {
			min-width: 44px;
			height: 52px;
		}

		.day-number {
			font-size: 1rem;
		}

		.day-weekday {
			font-size: 0.6875rem;
		}

		.month-label {
			font-size: 0.625rem;
			padding: 0.125rem 0.375rem;
		}
	}
</style>
