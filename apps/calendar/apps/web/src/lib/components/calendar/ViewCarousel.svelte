<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getOffsetDate } from '$lib/utils/dateNavigation';
	import { HOUR_HEIGHT_PX } from '$lib/utils/calendarConstants';
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

	// Swipe tracking state
	let offsetX = $state(0);
	let startX = $state(0);
	let isSwiping = $state(false);
	let isAnimating = $state(false);
	let animatingDirection: 'prev' | 'next' | null = null;

	// Velocity tracking for momentum
	let lastX = 0;
	let lastTime = 0;
	let velocity = 0;

	// Animation frame tracking
	let animationFrameId: number | null = null;
	let pendingCallback: (() => void) | null = null;

	// Container refs
	let viewportEl: HTMLDivElement;
	let currentPageEl: HTMLDivElement;
	let viewportWidth = $state(0);

	// Threshold: 15% of viewport width or high velocity triggers navigation
	const SNAP_THRESHOLD = 0.15;
	const VELOCITY_THRESHOLD = 0.5; // px/ms - increased for faster swipes
	// Animation speed (px/ms) - constant speed for linear feel
	const ANIMATION_SPEED = 3.0; // increased for snappier feel
	// Debounce for wheel events
	const WHEEL_DEBOUNCE_MS = 50; // reduced for faster response
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
		if (disableSwipe) return;

		// Only handle horizontal scrolling (deltaX dominant)
		if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

		// Don't interfere with event dragging
		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		e.preventDefault();

		// If animating, check if we should chain navigation
		if (isAnimating) {
			const scrollDirection = e.deltaX < 0 ? 'next' : 'prev';
			if (scrollDirection === animatingDirection && Math.abs(e.deltaX) > 10) {
				// Chain navigation - immediately go to next page in same direction
				chainNavigation(scrollDirection);
			}
			return;
		}

		// Simple direct offset update
		offsetX += e.deltaX * -1;
		offsetX = Math.max(-viewportWidth, Math.min(viewportWidth, offsetX));

		// Debounced snap
		if (wheelDebounceTimer) clearTimeout(wheelDebounceTimer);
		wheelDebounceTimer = setTimeout(snapToPage, WHEEL_DEBOUNCE_MS);
	}

	// Touch handlers
	function handleTouchStart(e: TouchEvent) {
		if (disableSwipe || isAnimating) return;

		// Don't interfere with event dragging
		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		startX = e.touches[0].clientX;
		lastX = startX;
		lastTime = performance.now();
		velocity = 0;
		isSwiping = true;

		if (wheelDebounceTimer) {
			clearTimeout(wheelDebounceTimer);
			wheelDebounceTimer = null;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping || disableSwipe) return;

		const currentX = e.touches[0].clientX;
		const currentTime = performance.now();

		// Calculate velocity (px/ms)
		const dt = currentTime - lastTime;
		if (dt > 0) {
			velocity = (currentX - lastX) / dt;
		}

		lastX = currentX;
		lastTime = currentTime;

		offsetX = currentX - startX;
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
		isAnimating = true;
		animateToOffset(0, () => {
			isAnimating = false;
		});
	}

	// Chain navigation - immediately complete current and start next
	function chainNavigation(direction: 'prev' | 'next') {
		// Cancel current animation
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		// Complete current navigation immediately (without resetting state flags)
		if (animatingDirection === 'prev') {
			viewStore.goToPrevious();
		} else if (animatingDirection === 'next') {
			viewStore.goToNext();
		}

		// Reset and start new animation for another page in same direction
		offsetX = direction === 'prev' ? viewportWidth * 0.4 : -viewportWidth * 0.4;
		animatingDirection = direction;

		const targetOffset = direction === 'prev' ? viewportWidth : -viewportWidth;
		pendingCallback = () => {
			if (direction === 'prev') {
				viewStore.goToPrevious();
			} else {
				viewStore.goToNext();
			}
			offsetX = 0;
			isAnimating = false;
			animatingDirection = null;
			pendingCallback = null;
		};

		animateToOffset(targetOffset, pendingCallback);
	}

	// Snap to page based on current offset and velocity
	function snapToPage() {
		if (isAnimating || viewportWidth === 0) return;

		const threshold = viewportWidth * SNAP_THRESHOLD;
		const hasHighVelocity = Math.abs(velocity) > VELOCITY_THRESHOLD;

		// Determine direction based on position and velocity
		let targetPage: 'prev' | 'next' | 'current' = 'current';

		if (offsetX > threshold || (hasHighVelocity && velocity > 0 && offsetX > 0)) {
			targetPage = 'prev';
		} else if (offsetX < -threshold || (hasHighVelocity && velocity < 0 && offsetX < 0)) {
			targetPage = 'next';
		}

		isAnimating = true;
		animatingDirection = targetPage === 'current' ? null : targetPage;

		if (targetPage === 'prev') {
			pendingCallback = () => {
				viewStore.goToPrevious();
				offsetX = 0;
				isAnimating = false;
				animatingDirection = null;
				pendingCallback = null;
			};
			animateToOffset(viewportWidth, pendingCallback);
		} else if (targetPage === 'next') {
			pendingCallback = () => {
				viewStore.goToNext();
				offsetX = 0;
				isAnimating = false;
				animatingDirection = null;
				pendingCallback = null;
			};
			animateToOffset(-viewportWidth, pendingCallback);
		} else {
			pendingCallback = () => {
				isAnimating = false;
				animatingDirection = null;
				pendingCallback = null;
			};
			animateToOffset(0, pendingCallback);
		}
	}

	function animateToOffset(targetX: number, onComplete: () => void) {
		// Cancel any existing animation
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}

		const startX = offsetX;
		const distance = targetX - startX;
		const direction = Math.sign(distance);
		const absDistance = Math.abs(distance);

		// If already at target, complete immediately
		if (absDistance < 1) {
			offsetX = targetX;
			onComplete();
			return;
		}

		let lastFrameTime = performance.now();

		function tick() {
			const now = performance.now();
			const dt = now - lastFrameTime;
			lastFrameTime = now;

			// Move at constant speed
			const step = ANIMATION_SPEED * dt * direction;
			offsetX += step;

			// Check if we've reached or passed the target
			const reachedTarget =
				(direction > 0 && offsetX >= targetX) || (direction < 0 && offsetX <= targetX);

			if (reachedTarget) {
				offsetX = targetX;
				animationFrameId = null;
				onComplete();
			} else {
				animationFrameId = requestAnimationFrame(tick);
			}
		}

		animationFrameId = requestAnimationFrame(tick);
	}

	// Computed styles
	let trackStyle = $derived(`transform: translateX(calc(-33.333% + ${offsetX}px))`);

	// Scroll to center of day (around 12:00) on initial mount
	// Only for time-grid views (day, week, multi-day)
	onMount(() => {
		if (!browser) return;

		// Small delay to ensure views are rendered
		setTimeout(() => {
			if (!currentPageEl) return;

			// Only scroll for time-grid views (not month, agenda)
			const timeGridViews = ['week'];
			if (!timeGridViews.includes(viewStore.viewType)) return;

			// Calculate scroll position to center around 12:00 (noon)
			const targetHour = 12;
			const targetScrollTop = targetHour * HOUR_HEIGHT_PX - currentPageEl.clientHeight / 2;

			currentPageEl.scrollTop = Math.max(0, targetScrollTop);
		}, 150);
	});
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
		<div class="carousel-page" class:inactive={!isSwiping && offsetX >= 0}>
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
