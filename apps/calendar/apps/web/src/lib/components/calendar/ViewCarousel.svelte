<script lang="ts">
	import { browser } from '$app/environment';
	import { viewStore } from '$lib/stores/view.svelte';
	import { getOffsetDate } from '$lib/utils/dateNavigation';
	import WeekView from './WeekView.svelte';
	import DayView from './DayView.svelte';
	import MonthView from './MonthView.svelte';
	import MultiDayView from './MultiDayView.svelte';
	import YearView from './YearView.svelte';
	import AgendaView from './AgendaView.svelte';
	import type { CalendarEvent } from '@calendar/shared';

	interface Props {
		onQuickCreate?: (date: Date, position: { x: number; y: number }) => void;
		onEventClick?: (event: CalendarEvent) => void;
		disableSwipe?: boolean;
	}

	let { onQuickCreate, onEventClick, disableSwipe = false }: Props = $props();

	// Swipe tracking
	let offsetX = $state(0);
	let startX = 0;
	let isSwiping = $state(false);
	let isLocked = false; // Prevent rapid double-navigation

	// Container ref
	let viewportEl: HTMLDivElement;
	let viewportWidth = $state(0);

	// Threshold: 15% of viewport width triggers navigation
	const SNAP_THRESHOLD = 0.15;
	const LOCK_DURATION = 150; // ms to wait after navigation

	// Calculate dates for previous/current/next views
	let prevDate = $derived(getOffsetDate(viewStore.currentDate, viewStore.viewType, -1));
	let nextDate = $derived(getOffsetDate(viewStore.currentDate, viewStore.viewType, 1));

	// Update viewport width on mount and resize
	$effect(() => {
		if (!browser || !viewportEl) return;

		const updateWidth = () => {
			viewportWidth = viewportEl.offsetWidth;
		};

		updateWidth();

		const resizeObserver = new ResizeObserver(updateWidth);
		resizeObserver.observe(viewportEl);

		return () => resizeObserver.disconnect();
	});

	// Wheel handler (trackpad horizontal scroll)
	function handleWheel(e: WheelEvent) {
		if (disableSwipe || isLocked) return;

		// Only handle horizontal scrolling
		if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

		// Don't interfere with event dragging
		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		e.preventDefault();

		// Update offset while scrolling
		offsetX -= e.deltaX;
		offsetX = Math.max(-viewportWidth, Math.min(viewportWidth, offsetX));

		// Check if threshold reached - instant switch
		const threshold = viewportWidth * SNAP_THRESHOLD;

		if (offsetX > threshold) {
			navigateTo('prev');
		} else if (offsetX < -threshold) {
			navigateTo('next');
		}
	}

	function navigateTo(direction: 'prev' | 'next') {
		// Lock to prevent double navigation
		isLocked = true;
		offsetX = 0;

		if (direction === 'prev') {
			viewStore.goToPrevious();
		} else {
			viewStore.goToNext();
		}

		// Unlock after short delay
		setTimeout(() => {
			isLocked = false;
		}, LOCK_DURATION);
	}

	// Touch handlers
	function handleTouchStart(e: TouchEvent) {
		if (disableSwipe || isLocked) return;

		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		startX = e.touches[0].clientX;
		isSwiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping || disableSwipe || isLocked) return;

		const currentX = e.touches[0].clientX;
		offsetX = currentX - startX;
		offsetX = Math.max(-viewportWidth, Math.min(viewportWidth, offsetX));
	}

	function handleTouchEnd() {
		if (!isSwiping) return;
		isSwiping = false;

		const threshold = viewportWidth * SNAP_THRESHOLD;

		if (offsetX > threshold) {
			navigateTo('prev');
		} else if (offsetX < -threshold) {
			navigateTo('next');
		} else {
			offsetX = 0;
		}
	}

	function handleTouchCancel() {
		isSwiping = false;
		offsetX = 0;
	}

	// Computed style
	let trackStyle = $derived(`transform: translateX(calc(-33.333% + ${offsetX}px))`);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="carousel-viewport"
	bind:this={viewportEl}
	onwheel={handleWheel}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchCancel}
>
	<div class="carousel-track" style={trackStyle}>
		<!-- Previous View -->
		<div class="carousel-page" class:inactive={!isSwiping && offsetX <= 0}>
			{#if viewStore.viewType === 'day'}
				<DayView date={prevDate} />
			{:else if viewStore.viewType === '5day'}
				<MultiDayView dayCount={5} date={prevDate} />
			{:else if viewStore.viewType === 'week'}
				<WeekView date={prevDate} />
			{:else if viewStore.viewType === '10day'}
				<MultiDayView dayCount={10} date={prevDate} />
			{:else if viewStore.viewType === '14day'}
				<MultiDayView dayCount={14} date={prevDate} />
			{:else if viewStore.viewType === 'month'}
				<MonthView date={prevDate} />
			{:else if viewStore.viewType === 'year'}
				<YearView date={prevDate} />
			{:else if viewStore.viewType === 'agenda'}
				<AgendaView date={prevDate} />
			{/if}
		</div>

		<!-- Current View -->
		<div class="carousel-page current">
			{#if viewStore.viewType === 'day'}
				<DayView {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === '5day'}
				<MultiDayView dayCount={5} {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === 'week'}
				<WeekView {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === '10day'}
				<MultiDayView dayCount={10} {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === '14day'}
				<MultiDayView dayCount={14} {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === 'month'}
				<MonthView {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === 'year'}
				<YearView {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === 'agenda'}
				<AgendaView {onEventClick} />
			{:else}
				<WeekView {onQuickCreate} {onEventClick} />
			{/if}
		</div>

		<!-- Next View -->
		<div class="carousel-page" class:inactive={!isSwiping && offsetX >= 0}>
			{#if viewStore.viewType === 'day'}
				<DayView date={nextDate} />
			{:else if viewStore.viewType === '5day'}
				<MultiDayView dayCount={5} date={nextDate} />
			{:else if viewStore.viewType === 'week'}
				<WeekView date={nextDate} />
			{:else if viewStore.viewType === '10day'}
				<MultiDayView dayCount={10} date={nextDate} />
			{:else if viewStore.viewType === '14day'}
				<MultiDayView dayCount={14} date={nextDate} />
			{:else if viewStore.viewType === 'month'}
				<MonthView date={nextDate} />
			{:else if viewStore.viewType === 'year'}
				<YearView date={nextDate} />
			{:else if viewStore.viewType === 'agenda'}
				<AgendaView date={nextDate} />
			{/if}
		</div>
	</div>
</div>

<style>
	.carousel-viewport {
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
		touch-action: pan-y;
	}

	.carousel-track {
		display: flex;
		width: 300%;
		height: 100%;
		will-change: transform;
	}

	.carousel-page {
		width: 33.333%;
		height: 100%;
		flex-shrink: 0;
		overflow: hidden;
	}

	.carousel-page.inactive {
		pointer-events: none;
	}

	.carousel-page.current {
		pointer-events: auto;
	}
</style>
