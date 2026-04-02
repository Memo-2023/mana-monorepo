/**
 * Swipe Navigation Composable
 * Extracts touch/wheel/velocity/snap/animation logic from ViewCarousel
 */

export interface SwipeNavigationConfig {
	/** Get current viewport width */
	getViewportWidth: () => number;
	/** Navigate to previous page */
	onNavigatePrev: () => void;
	/** Navigate to next page */
	onNavigateNext: () => void;
	/** Whether swipe is disabled */
	disabled?: boolean;
	/** Snap threshold as fraction of viewport width (default: 0.15) */
	snapThreshold?: number;
	/** Velocity threshold in px/ms (default: 0.5) */
	velocityThreshold?: number;
	/** Animation speed in px/ms (default: 3.0) */
	animationSpeed?: number;
	/** Wheel debounce in ms (default: 50) */
	wheelDebounceMs?: number;
}

export function useSwipeNavigation(getConfig: () => SwipeNavigationConfig) {
	// Swipe tracking state
	let offsetX = $state(0);
	let startX = $state(0);
	let isSwiping = $state(false);
	let isAnimating = $state(false);
	let animatingDirection: 'prev' | 'next' | null = null;

	// Velocity tracking
	let lastX = 0;
	let lastTime = 0;
	let velocity = 0;

	// Animation frame tracking
	let animationFrameId: number | null = null;
	let pendingCallback: (() => void) | null = null;

	// Wheel debounce
	let wheelDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	function getDefaults() {
		const config = getConfig();
		return {
			snapThreshold: config.snapThreshold ?? 0.15,
			velocityThreshold: config.velocityThreshold ?? 0.5,
			animationSpeed: config.animationSpeed ?? 3.0,
			wheelDebounceMs: config.wheelDebounceMs ?? 50,
		};
	}

	function handleWheel(e: WheelEvent) {
		const config = getConfig();
		if (config.disabled) return;
		if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

		const target = e.target as HTMLElement;
		if (target.closest('[data-event-id]') || target.closest('[data-dragging]')) return;

		e.preventDefault();
		const viewportWidth = config.getViewportWidth();

		if (isAnimating) {
			const scrollDirection = e.deltaX < 0 ? 'next' : 'prev';
			if (scrollDirection === animatingDirection && Math.abs(e.deltaX) > 10) {
				chainNavigation(scrollDirection);
			}
			return;
		}

		offsetX += e.deltaX * -1;
		offsetX = Math.max(-viewportWidth, Math.min(viewportWidth, offsetX));

		const { wheelDebounceMs } = getDefaults();
		if (wheelDebounceTimer) clearTimeout(wheelDebounceTimer);
		wheelDebounceTimer = setTimeout(snapToPage, wheelDebounceMs);
	}

	function handleTouchStart(e: TouchEvent) {
		const config = getConfig();
		if (config.disabled || isAnimating) return;

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
		const config = getConfig();
		if (!isSwiping || config.disabled) return;

		const currentX = e.touches[0].clientX;
		const currentTime = performance.now();
		const dt = currentTime - lastTime;
		if (dt > 0) velocity = (currentX - lastX) / dt;

		lastX = currentX;
		lastTime = currentTime;

		const viewportWidth = config.getViewportWidth();
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

	function chainNavigation(direction: 'prev' | 'next') {
		const config = getConfig();
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		if (animatingDirection === 'prev') config.onNavigatePrev();
		else if (animatingDirection === 'next') config.onNavigateNext();

		const viewportWidth = config.getViewportWidth();
		offsetX = direction === 'prev' ? viewportWidth * 0.4 : -viewportWidth * 0.4;
		animatingDirection = direction;

		const targetOffset = direction === 'prev' ? viewportWidth : -viewportWidth;
		pendingCallback = () => {
			if (direction === 'prev') config.onNavigatePrev();
			else config.onNavigateNext();
			offsetX = 0;
			isAnimating = false;
			animatingDirection = null;
			pendingCallback = null;
		};

		animateToOffset(targetOffset, pendingCallback);
	}

	function snapToPage() {
		const config = getConfig();
		const viewportWidth = config.getViewportWidth();
		if (isAnimating || viewportWidth === 0) return;

		const { snapThreshold, velocityThreshold } = getDefaults();
		const threshold = viewportWidth * snapThreshold;
		const hasHighVelocity = Math.abs(velocity) > velocityThreshold;

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
				config.onNavigatePrev();
				offsetX = 0;
				isAnimating = false;
				animatingDirection = null;
				pendingCallback = null;
			};
			animateToOffset(viewportWidth, pendingCallback);
		} else if (targetPage === 'next') {
			pendingCallback = () => {
				config.onNavigateNext();
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
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
		}

		const { animationSpeed } = getDefaults();
		const sX = offsetX;
		const distance = targetX - sX;
		const direction = Math.sign(distance);

		if (Math.abs(distance) < 1) {
			offsetX = targetX;
			onComplete();
			return;
		}

		let lastFrameTime = performance.now();

		function tick() {
			const now = performance.now();
			const dt = now - lastFrameTime;
			lastFrameTime = now;

			offsetX += animationSpeed * dt * direction;

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

	return {
		get offsetX() {
			return offsetX;
		},
		get isSwiping() {
			return isSwiping;
		},
		get isAnimating() {
			return isAnimating;
		},

		handleWheel,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleTouchCancel,
	};
}
