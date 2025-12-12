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

	async function scrollToDate(date: Date) {
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

	// Get the month of the center visible day
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

	onMount(() => {
		scrollToDate(viewStore.currentDate);
	});
</script>

<div class="date-strip-wrapper">
	<div class="date-strip-container">
		<!-- Month label with today button -->
		<div class="month-header">
			<span class="month-label">{visibleMonth}</span>
			{#if !isTodayVisible}
				<button class="today-btn" onclick={goToToday} title="Zum heutigen Tag">
					<svg
						class="today-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M12 6v6l4 2" />
					</svg>
					Heute
				</button>
			{/if}
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
					<span class="day-weekday" style={dayIsToday ? 'opacity: 1; color: white;' : ''}
						>{format(day, 'EE', { locale: de })}</span
					>
					<span class="day-number" style={dayIsToday ? 'color: white;' : ''}
						>{format(day, 'd')}</span
					>
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

	.date-strip-container {
		display: flex;
		flex-direction: column;
		background: var(--color-surface, #ffffff);
		border-radius: 16px;
		margin: 0 1rem;
		padding: 0.5rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		border: 1px solid var(--color-border, #e5e7eb);
		pointer-events: auto;
		max-width: calc(100vw - 2rem);
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
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-foreground, #1f2937);
		white-space: nowrap;
	}

	.today-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.3125rem 0.625rem;
		background: var(--color-muted, #f3f4f6);
		border: 1.5px solid var(--color-border, #e5e7eb);
		border-radius: 9999px;
		cursor: pointer;
		color: var(--color-muted-foreground, #6b7280);
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.today-btn:hover {
		background: var(--color-surface-hover, #e5e7eb);
		color: var(--color-foreground, #1f2937);
		border-color: var(--color-border-strong, #d1d5db);
	}

	.today-icon {
		width: 14px;
		height: 14px;
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
		scrollbar-width: none;
		-ms-overflow-style: none;
		scroll-behavior: auto;
		padding: 0.25rem;
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

		.month-header-side {
			min-width: 60px;
		}

		.today-btn {
			padding: 0.1875rem 0.5rem;
			font-size: 0.6875rem;
			gap: 0.25rem;
		}

		.today-icon {
			width: 12px;
			height: 12px;
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

		.month-divider {
			height: 32px;
			margin: 0 0.375rem;
		}
	}
</style>
