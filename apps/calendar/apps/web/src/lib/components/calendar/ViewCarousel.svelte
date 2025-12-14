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

	// Swipe tracking state
	let offsetX = $state(0);
	let startX = $state(0);
	let isSwiping = $state(false);
	let isAnimating = $state(false);

	// Container refs
	let viewportEl: HTMLDivElement;
	let viewportWidth = $state(0);

	// Threshold: 15% of viewport width triggers navigation
	const SNAP_THRESHOLD = 0.15;
	// Debounce time for wheel events
	const WHEEL_DEBOUNCE_MS = 150;
	let wheelDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Calculate dates for previous/current/next views
	let prevDate = $derived(getOffsetDate(viewStore.currentDate, viewStore.viewType, -1));
	let currentDate = $derived(viewStore.currentDate);
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
		if (disableSwipe || isAnimating) return;

		// Only handle horizontal scrolling (deltaX dominant)
		if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

		// Don't interfere with event dragging
		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		e.preventDefault();

		// Update offset (invert for natural scrolling direction)
		offsetX += e.deltaX * -1;

		// Clamp to max 1 page in each direction
		offsetX = Math.max(-viewportWidth, Math.min(viewportWidth, offsetX));

		// Debounced snap check
		if (wheelDebounceTimer) clearTimeout(wheelDebounceTimer);
		wheelDebounceTimer = setTimeout(() => {
			snapToPage();
		}, WHEEL_DEBOUNCE_MS);
	}

	// Touch handlers
	function handleTouchStart(e: TouchEvent) {
		if (disableSwipe || isAnimating) return;

		// Don't interfere with event dragging
		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		startX = e.touches[0].clientX;
		isSwiping = true;

		// Cancel any pending wheel snap
		if (wheelDebounceTimer) {
			clearTimeout(wheelDebounceTimer);
			wheelDebounceTimer = null;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping || disableSwipe) return;

		const currentX = e.touches[0].clientX;
		offsetX = currentX - startX;

		// Clamp to max 1 page in each direction
		offsetX = Math.max(-viewportWidth, Math.min(viewportWidth, offsetX));
	}

	function handleTouchEnd() {
		if (!isSwiping) return;
		isSwiping = false;
		snapToPage();
	}

	function handleTouchCancel() {
		if (!isSwiping) return;
		isSwiping = false;
		// Snap back to current on cancel
		animateToOffset(0, () => {});
	}

	// Snap to page based on current offset
	function snapToPage() {
		if (isAnimating || viewportWidth === 0) return;

		isAnimating = true;
		const threshold = viewportWidth * SNAP_THRESHOLD;

		if (offsetX > threshold) {
			// Snap to previous
			animateToOffset(viewportWidth, () => {
				viewStore.goToPrevious();
				offsetX = 0;
				isAnimating = false;
			});
		} else if (offsetX < -threshold) {
			// Snap to next
			animateToOffset(-viewportWidth, () => {
				viewStore.goToNext();
				offsetX = 0;
				isAnimating = false;
			});
		} else {
			// Snap back to current
			animateToOffset(0, () => {
				isAnimating = false;
			});
		}
	}

	function animateToOffset(targetX: number, onComplete: () => void) {
		offsetX = targetX;
		// Wait for CSS transition to complete
		setTimeout(onComplete, 300);
	}

	// Computed transform style
	let transformStyle = $derived(`transform: translateX(calc(-33.333% + ${offsetX}px))`);
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
	<div class="carousel-track" class:animating={isAnimating} style={transformStyle}>
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

		<!-- Current View (main interactive view) -->
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

	.carousel-track.animating {
		transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.carousel-page {
		width: 33.333%;
		height: 100%;
		flex-shrink: 0;
		overflow: hidden;
	}

	/* Inactive pages have reduced interactivity for performance */
	.carousel-page.inactive {
		pointer-events: none;
	}

	.carousel-page.current {
		/* Always interactive */
		pointer-events: auto;
	}
</style>
