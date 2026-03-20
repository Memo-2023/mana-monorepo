<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { getOffsetDate } from '$lib/utils/dateNavigation';
	import { HOUR_HEIGHT_PX } from '$lib/utils/calendarConstants';
	import { useSwipeNavigation } from '$lib/composables/useSwipeNavigation.svelte';
	import WeekView from './WeekView.svelte';
	import MonthView from './MonthView.svelte';
	import AgendaView from './AgendaView.svelte';
	import type { CalendarEvent } from '@calendar/shared';

	interface Props {
		onQuickCreate?: (date: Date, position: { x: number; y: number }, endDate?: Date) => void;
		onEventClick?: (event: CalendarEvent) => void;
		disableSwipe?: boolean;
	}

	let { onQuickCreate, onEventClick, disableSwipe = false }: Props = $props();

	// Container refs
	let viewportEl: HTMLDivElement;
	let currentPageEl: HTMLDivElement;
	let viewportWidth = $state(0);

	// Calculate dates for previous/current/next views
	let prevDate = $derived(getOffsetDate(viewStore.currentDate, viewStore.viewType, -1));
	let nextDate = $derived(getOffsetDate(viewStore.currentDate, viewStore.viewType, 1));

	// Swipe navigation composable
	const swipe = useSwipeNavigation(() => ({
		getViewportWidth: () => viewportWidth,
		onNavigatePrev: () => viewStore.goToPrevious(),
		onNavigateNext: () => viewStore.goToNext(),
		disabled: disableSwipe,
	}));

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

	// Computed styles
	let trackStyle = $derived(`transform: translateX(calc(-33.333% + ${swipe.offsetX}px))`);

	// Scroll to center of day on initial mount
	onMount(() => {
		if (!browser) return;

		setTimeout(() => {
			if (!currentPageEl) return;
			if (!['week'].includes(viewStore.viewType)) return;

			const targetScrollTop = 12 * HOUR_HEIGHT_PX - currentPageEl.clientHeight / 2;
			currentPageEl.scrollTop = Math.max(0, targetScrollTop);
		}, 150);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="carousel-viewport"
	bind:this={viewportEl}
	onwheel={swipe.handleWheel}
	ontouchstart={swipe.handleTouchStart}
	ontouchmove={swipe.handleTouchMove}
	ontouchend={swipe.handleTouchEnd}
	ontouchcancel={swipe.handleTouchCancel}
>
	<div class="carousel-track" style={trackStyle}>
		<!-- Previous View -->
		<div class="carousel-page" class:inactive={!swipe.isSwiping && swipe.offsetX <= 0}>
			{#if viewStore.viewType === 'week'}
				<WeekView date={prevDate} />
			{:else if viewStore.viewType === 'month'}
				<MonthView date={prevDate} />
			{:else if viewStore.viewType === 'agenda'}
				<AgendaView date={prevDate} />
			{/if}
		</div>

		<!-- Current View (main interactive view) -->
		<div class="carousel-page current" bind:this={currentPageEl}>
			{#if viewStore.viewType === 'week'}
				<WeekView {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === 'month'}
				<MonthView {onQuickCreate} {onEventClick} />
			{:else if viewStore.viewType === 'agenda'}
				<AgendaView {onEventClick} />
			{:else}
				<WeekView {onQuickCreate} {onEventClick} />
			{/if}
		</div>

		<!-- Next View -->
		<div class="carousel-page" class:inactive={!swipe.isSwiping && swipe.offsetX >= 0}>
			{#if viewStore.viewType === 'week'}
				<WeekView date={nextDate} />
			{:else if viewStore.viewType === 'month'}
				<MonthView date={nextDate} />
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

	/* Mobile: Allow vertical scrolling within calendar page */
	@media (max-width: 768px) {
		.carousel-page {
			overflow-y: auto;
			overflow-x: hidden;
			-webkit-overflow-scrolling: touch;
		}
	}

	/* Inactive pages have reduced interactivity for performance */
	.carousel-page.inactive {
		pointer-events: none;
	}

	.carousel-page.current {
		/* Always interactive */
		pointer-events: auto;
		/* Enable vertical scrolling for keyboard navigation */
		overflow-y: auto;
		overflow-x: hidden;
	}
</style>
