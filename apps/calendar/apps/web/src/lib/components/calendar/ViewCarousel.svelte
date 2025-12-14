<script lang="ts">
	import { browser } from '$app/environment';
	import { viewStore } from '$lib/stores/view.svelte';
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
	let startX = 0;
	let isSwiping = false;

	// Container ref
	let viewportEl: HTMLDivElement;
	let viewportWidth = $state(0);

	// Threshold: 15% of viewport width triggers navigation
	const SNAP_THRESHOLD = 0.15;

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
	let accumulatedDelta = 0;

	function handleWheel(e: WheelEvent) {
		if (disableSwipe) return;

		// Only handle horizontal scrolling
		if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

		// Don't interfere with event dragging
		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		e.preventDefault();

		accumulatedDelta += e.deltaX;

		const threshold = viewportWidth * SNAP_THRESHOLD;

		if (accumulatedDelta > threshold) {
			viewStore.goToNext();
			accumulatedDelta = 0;
		} else if (accumulatedDelta < -threshold) {
			viewStore.goToPrevious();
			accumulatedDelta = 0;
		}
	}

	// Touch handlers
	function handleTouchStart(e: TouchEvent) {
		if (disableSwipe) return;

		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		startX = e.touches[0].clientX;
		isSwiping = true;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!isSwiping) return;
		isSwiping = false;

		const endX = e.changedTouches[0].clientX;
		const deltaX = endX - startX;
		const threshold = viewportWidth * SNAP_THRESHOLD;

		if (deltaX > threshold) {
			viewStore.goToPrevious();
		} else if (deltaX < -threshold) {
			viewStore.goToNext();
		}
	}

	function handleTouchCancel() {
		isSwiping = false;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="carousel-viewport"
	bind:this={viewportEl}
	onwheel={handleWheel}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchCancel}
>
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

<style>
	.carousel-viewport {
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
		touch-action: pan-y;
	}
</style>
