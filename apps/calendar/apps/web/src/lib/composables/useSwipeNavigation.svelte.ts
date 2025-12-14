/**
 * Swipe Navigation Composable
 * Enables horizontal swipe/scroll navigation for calendar views
 *
 * Supports:
 * - Trackpad horizontal scroll (Mac/Windows)
 * - Touch swipe (Mobile/Tablet)
 * - Mouse horizontal scroll wheel
 */

import { browser } from '$app/environment';

export interface SwipeNavigationOptions {
	/** Minimum pixels to trigger navigation (default: 80) */
	threshold?: number;
	/** Debounce time in ms for wheel events (default: 150) */
	debounceMs?: number;
	/** Disable swipe navigation temporarily */
	disabled?: boolean;
}

const DEFAULT_THRESHOLD = 80;
const DEFAULT_DEBOUNCE_MS = 150;

/**
 * Creates swipe/scroll navigation for a container element
 *
 * @param getElement - Function returning the target element
 * @param onNext - Callback when swiping left (go to next period)
 * @param onPrevious - Callback when swiping right (go to previous period)
 * @param options - Configuration options
 *
 * @example
 * ```svelte
 * <script>
 *   import { useSwipeNavigation } from '$lib/composables';
 *   import { viewStore } from '$lib/stores/view.svelte';
 *
 *   let containerRef: HTMLElement;
 *
 *   useSwipeNavigation(
 *     () => containerRef,
 *     () => viewStore.goToNext(),
 *     () => viewStore.goToPrevious()
 *   );
 * </script>
 *
 * <div bind:this={containerRef}>...</div>
 * ```
 */
export function useSwipeNavigation(
	getElement: () => HTMLElement | null,
	onNext: () => void,
	onPrevious: () => void,
	options: SwipeNavigationOptions = {}
) {
	if (!browser) return;

	const threshold = options.threshold ?? DEFAULT_THRESHOLD;
	const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;

	// Track accumulated wheel delta for trackpad detection
	let accumulatedDelta = 0;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Touch tracking
	let touchStartX = 0;
	let touchStartY = 0;
	let isTouching = false;

	/**
	 * Handle wheel events (trackpad horizontal scroll)
	 */
	function handleWheel(e: WheelEvent) {
		// Skip if disabled
		if (options.disabled) return;

		// Only handle horizontal scrolling (deltaX dominant)
		// This distinguishes trackpad gestures from vertical scrolling
		if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

		// Don't interfere with event dragging
		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		// Prevent default scroll behavior for horizontal gestures
		e.preventDefault();

		// Accumulate horizontal delta
		accumulatedDelta += e.deltaX;

		// Reset accumulator after debounce period
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			accumulatedDelta = 0;
		}, debounceMs);

		// Check if threshold reached
		if (accumulatedDelta > threshold) {
			onNext();
			accumulatedDelta = 0;
			if (debounceTimer) clearTimeout(debounceTimer);
		} else if (accumulatedDelta < -threshold) {
			onPrevious();
			accumulatedDelta = 0;
			if (debounceTimer) clearTimeout(debounceTimer);
		}
	}

	/**
	 * Handle touch start
	 */
	function handleTouchStart(e: TouchEvent) {
		// Skip if disabled
		if (options.disabled) return;

		// Don't interfere with event dragging
		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		isTouching = true;
	}

	/**
	 * Handle touch end
	 */
	function handleTouchEnd(e: TouchEvent) {
		// Skip if disabled or wasn't tracking
		if (options.disabled || !isTouching) return;
		isTouching = false;

		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;

		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;

		// Only trigger if horizontal movement is dominant and exceeds threshold
		if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
			if (deltaX > 0) {
				// Swiped right → go to previous
				onPrevious();
			} else {
				// Swiped left → go to next
				onNext();
			}
		}
	}

	/**
	 * Handle touch cancel
	 */
	function handleTouchCancel() {
		isTouching = false;
	}

	// Setup and cleanup with $effect
	$effect(() => {
		const el = getElement();
		if (!el) return;

		// Add event listeners
		el.addEventListener('wheel', handleWheel, { passive: false });
		el.addEventListener('touchstart', handleTouchStart, { passive: true });
		el.addEventListener('touchend', handleTouchEnd, { passive: true });
		el.addEventListener('touchcancel', handleTouchCancel, { passive: true });

		// Cleanup
		return () => {
			el.removeEventListener('wheel', handleWheel);
			el.removeEventListener('touchstart', handleTouchStart);
			el.removeEventListener('touchend', handleTouchEnd);
			el.removeEventListener('touchcancel', handleTouchCancel);

			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	});
}
