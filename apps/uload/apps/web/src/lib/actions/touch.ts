// Touch-optimierte Aktionen für mobile Geräte
import type { Action } from 'svelte/action';

// Touch-optimierte Ripple-Effekte
export const ripple: Action<HTMLElement, { color?: string; duration?: number }> = (
	node,
	options = {}
) => {
	const { color = 'rgba(255, 255, 255, 0.3)', duration = 600 } = options;

	let rippleElement: HTMLDivElement | null = null;

	function createRipple(event: PointerEvent | TouchEvent) {
		// Entferne vorherigen Ripple
		if (rippleElement) {
			rippleElement.remove();
		}

		// Erstelle neuen Ripple
		rippleElement = document.createElement('div');
		const rect = node.getBoundingClientRect();
		
		// Berechne Position des Touches/Clicks
		let clientX: number, clientY: number;
		if (event instanceof TouchEvent && event.touches.length > 0) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else if (event instanceof PointerEvent) {
			clientX = event.clientX;
			clientY = event.clientY;
		} else {
			// Fallback zur Mitte des Elements
			clientX = rect.left + rect.width / 2;
			clientY = rect.top + rect.height / 2;
		}

		const x = clientX - rect.left;
		const y = clientY - rect.top;
		const size = Math.max(rect.width, rect.height) * 2;

		// Style des Ripple-Elements
		Object.assign(rippleElement.style, {
			position: 'absolute',
			top: `${y - size / 2}px`,
			left: `${x - size / 2}px`,
			width: `${size}px`,
			height: `${size}px`,
			backgroundColor: color,
			borderRadius: '50%',
			pointerEvents: 'none',
			transform: 'scale(0)',
			transition: `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`,
			zIndex: '1000'
		});

		// Stelle sicher, dass das Parent-Element relative Position hat
		const computedStyle = getComputedStyle(node);
		if (computedStyle.position === 'static') {
			node.style.position = 'relative';
		}

		// Stelle sicher, dass overflow hidden ist für Ripple-Effekt
		const originalOverflow = node.style.overflow;
		node.style.overflow = 'hidden';

		node.appendChild(rippleElement);

		// Starte Animation
		requestAnimationFrame(() => {
			if (rippleElement) {
				rippleElement.style.transform = 'scale(1)';
				rippleElement.style.opacity = '0';
			}
		});

		// Entferne Element nach Animation
		setTimeout(() => {
			if (rippleElement && rippleElement.parentNode) {
				rippleElement.remove();
				rippleElement = null;
				// Stelle ursprünglichen overflow wieder her
				node.style.overflow = originalOverflow;
			}
		}, duration);
	}

	// Event Listeners für verschiedene Eingabemethoden
	node.addEventListener('pointerdown', createRipple);
	node.addEventListener('touchstart', createRipple, { passive: true });

	return {
		destroy() {
			node.removeEventListener('pointerdown', createRipple);
			node.removeEventListener('touchstart', createRipple);
			if (rippleElement) {
				rippleElement.remove();
			}
		}
	};
};

// Swipe-Gesten erkennen
interface SwipeOptions {
	threshold?: number;
	timeout?: number;
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
}

export const swipe: Action<HTMLElement, SwipeOptions> = (node, options = {}) => {
	const {
		threshold = 50,
		timeout = 300,
		onSwipeLeft,
		onSwipeRight,
		onSwipeUp,
		onSwipeDown
	} = options;

	let startX: number;
	let startY: number;
	let startTime: number;

	function handleTouchStart(event: TouchEvent) {
		if (event.touches.length !== 1) return;

		const touch = event.touches[0];
		startX = touch.clientX;
		startY = touch.clientY;
		startTime = Date.now();
	}

	function handleTouchEnd(event: TouchEvent) {
		if (event.changedTouches.length !== 1) return;

		const touch = event.changedTouches[0];
		const endX = touch.clientX;
		const endY = touch.clientY;
		const endTime = Date.now();

		// Prüfe Timeout
		if (endTime - startTime > timeout) return;

		const deltaX = endX - startX;
		const deltaY = endY - startY;
		const absDeltaX = Math.abs(deltaX);
		const absDeltaY = Math.abs(deltaY);

		// Prüfe ob Schwellenwert erreicht wurde
		if (Math.max(absDeltaX, absDeltaY) < threshold) return;

		// Bestimme Swipe-Richtung
		if (absDeltaX > absDeltaY) {
			// Horizontaler Swipe
			if (deltaX > 0) {
				onSwipeRight?.();
			} else {
				onSwipeLeft?.();
			}
		} else {
			// Vertikaler Swipe
			if (deltaY > 0) {
				onSwipeDown?.();
			} else {
				onSwipeUp?.();
			}
		}
	}

	node.addEventListener('touchstart', handleTouchStart, { passive: true });
	node.addEventListener('touchend', handleTouchEnd, { passive: true });

	return {
		destroy() {
			node.removeEventListener('touchstart', handleTouchStart);
			node.removeEventListener('touchend', handleTouchEnd);
		}
	};
};

// Long Press für mobile Geräte
interface LongPressOptions {
	duration?: number;
	onLongPress?: (event: PointerEvent | TouchEvent) => void;
}

export const longPress: Action<HTMLElement, LongPressOptions> = (node, options = {}) => {
	const { duration = 500, onLongPress } = options;

	let timer: ReturnType<typeof setTimeout>;
	let startEvent: PointerEvent | TouchEvent;

	function startLongPress(event: PointerEvent | TouchEvent) {
		startEvent = event;
		timer = setTimeout(() => {
			onLongPress?.(startEvent);
		}, duration);
	}

	function cancelLongPress() {
		clearTimeout(timer);
	}

	// Touch Events
	node.addEventListener('touchstart', startLongPress, { passive: true });
	node.addEventListener('touchend', cancelLongPress, { passive: true });
	node.addEventListener('touchcancel', cancelLongPress, { passive: true });
	node.addEventListener('touchmove', cancelLongPress, { passive: true });

	// Pointer Events (für bessere Unterstützung)
	node.addEventListener('pointerdown', startLongPress);
	node.addEventListener('pointerup', cancelLongPress);
	node.addEventListener('pointercancel', cancelLongPress);
	node.addEventListener('pointermove', cancelLongPress);

	return {
		destroy() {
			clearTimeout(timer);
			node.removeEventListener('touchstart', startLongPress);
			node.removeEventListener('touchend', cancelLongPress);
			node.removeEventListener('touchcancel', cancelLongPress);
			node.removeEventListener('touchmove', cancelLongPress);
			node.removeEventListener('pointerdown', startLongPress);
			node.removeEventListener('pointerup', cancelLongPress);
			node.removeEventListener('pointercancel', cancelLongPress);
			node.removeEventListener('pointermove', cancelLongPress);
		}
	};
};

// Touch-freundliche Drag & Drop
interface TouchDragOptions {
	onDragStart?: (event: PointerEvent | TouchEvent) => void;
	onDragMove?: (event: PointerEvent | TouchEvent, deltaX: number, deltaY: number) => void;
	onDragEnd?: (event: PointerEvent | TouchEvent) => void;
	threshold?: number;
}

export const touchDrag: Action<HTMLElement, TouchDragOptions> = (node, options = {}) => {
	const { onDragStart, onDragMove, onDragEnd, threshold = 5 } = options;

	let isDragging = false;
	let startX: number;
	let startY: number;
	let lastX: number;
	let lastY: number;

	function handleStart(event: PointerEvent | TouchEvent) {
		let clientX: number, clientY: number;

		if (event instanceof TouchEvent && event.touches.length > 0) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else if (event instanceof PointerEvent) {
			clientX = event.clientX;
			clientY = event.clientY;
		} else {
			return;
		}

		startX = lastX = clientX;
		startY = lastY = clientY;
		isDragging = false;
	}

	function handleMove(event: PointerEvent | TouchEvent) {
		let clientX: number, clientY: number;

		if (event instanceof TouchEvent && event.touches.length > 0) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else if (event instanceof PointerEvent) {
			clientX = event.clientX;
			clientY = event.clientY;
		} else {
			return;
		}

		const deltaX = clientX - lastX;
		const deltaY = clientY - lastY;
		const totalDeltaX = clientX - startX;
		const totalDeltaY = clientY - startY;

		// Prüfe ob Drag-Threshold erreicht wurde
		if (!isDragging && (Math.abs(totalDeltaX) > threshold || Math.abs(totalDeltaY) > threshold)) {
			isDragging = true;
			onDragStart?.(event);
		}

		if (isDragging) {
			onDragMove?.(event, deltaX, deltaY);
		}

		lastX = clientX;
		lastY = clientY;
	}

	function handleEnd(event: PointerEvent | TouchEvent) {
		if (isDragging) {
			onDragEnd?.(event);
		}
		isDragging = false;
	}

	// Touch Events
	node.addEventListener('touchstart', handleStart, { passive: true });
	node.addEventListener('touchmove', handleMove, { passive: false });
	node.addEventListener('touchend', handleEnd, { passive: true });
	node.addEventListener('touchcancel', handleEnd, { passive: true });

	// Pointer Events
	node.addEventListener('pointerdown', handleStart);
	node.addEventListener('pointermove', handleMove);
	node.addEventListener('pointerup', handleEnd);
	node.addEventListener('pointercancel', handleEnd);

	return {
		destroy() {
			node.removeEventListener('touchstart', handleStart);
			node.removeEventListener('touchmove', handleMove);
			node.removeEventListener('touchend', handleEnd);
			node.removeEventListener('touchcancel', handleEnd);
			node.removeEventListener('pointerdown', handleStart);
			node.removeEventListener('pointermove', handleMove);
			node.removeEventListener('pointerup', handleEnd);
			node.removeEventListener('pointercancel', handleEnd);
		}
	};
};

// Utility: Touch-Gerät erkennen
export function isTouchDevice(): boolean {
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Utility: Optimale Touch-Target-Größe prüfen
export function isOptimalTouchTarget(element: HTMLElement): boolean {
	const rect = element.getBoundingClientRect();
	const minSize = 44; // 44px ist die empfohlene Mindestgröße für Touch-Targets
	return rect.width >= minSize && rect.height >= minSize;
}