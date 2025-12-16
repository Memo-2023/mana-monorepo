<script lang="ts">
	/**
	 * ResizeHandle Component
	 * Draggable divider for resizing split panels.
	 */

	import { DIVIDER_CONSTRAINTS } from '../types.js';

	interface Props {
		position: number;
		onResize: (position: number) => void;
		onReset: () => void;
		onDragStateChange?: (isDragging: boolean) => void;
	}

	let { position, onResize, onReset, onDragStateChange }: Props = $props();

	let isDragging = $state(false);

	function setDragging(value: boolean) {
		isDragging = value;
		onDragStateChange?.(value);
	}
	let containerRef: HTMLElement | null = null;

	function handleMouseDown(event: MouseEvent) {
		event.preventDefault();
		setDragging(true);

		const handleMouseMove = (e: MouseEvent) => {
			if (!containerRef) return;

			const container = containerRef.closest('.split-pane-container');
			if (!container) return;

			const rect = container.getBoundingClientRect();
			const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

			const clamped = Math.max(
				DIVIDER_CONSTRAINTS.MIN,
				Math.min(DIVIDER_CONSTRAINTS.MAX, newPosition)
			);

			onResize(clamped);
		};

		const handleMouseUp = () => {
			setDragging(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function handleTouchStart(event: TouchEvent) {
		event.preventDefault();
		setDragging(true);

		const handleTouchMove = (e: TouchEvent) => {
			if (!containerRef || !e.touches[0]) return;

			const container = containerRef.closest('.split-pane-container');
			if (!container) return;

			const rect = container.getBoundingClientRect();
			const newPosition = ((e.touches[0].clientX - rect.left) / rect.width) * 100;

			const clamped = Math.max(
				DIVIDER_CONSTRAINTS.MIN,
				Math.min(DIVIDER_CONSTRAINTS.MAX, newPosition)
			);

			onResize(clamped);
		};

		const handleTouchEnd = () => {
			setDragging(false);
			document.removeEventListener('touchmove', handleTouchMove);
			document.removeEventListener('touchend', handleTouchEnd);
		};

		document.addEventListener('touchmove', handleTouchMove, { passive: false });
		document.addEventListener('touchend', handleTouchEnd);
	}

	function handleDoubleClick() {
		onReset();
	}

	function handleKeyDown(event: KeyboardEvent) {
		const step = event.shiftKey ? 10 : 2;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				onResize(Math.max(DIVIDER_CONSTRAINTS.MIN, position - step));
				break;
			case 'ArrowRight':
				event.preventDefault();
				onResize(Math.min(DIVIDER_CONSTRAINTS.MAX, position + step));
				break;
			case 'Home':
				event.preventDefault();
				onResize(DIVIDER_CONSTRAINTS.DEFAULT);
				break;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
<div
	bind:this={containerRef}
	class="resize-handle"
	class:dragging={isDragging}
	role="slider"
	aria-orientation="horizontal"
	aria-valuenow={position}
	aria-valuemin={DIVIDER_CONSTRAINTS.MIN}
	aria-valuemax={DIVIDER_CONSTRAINTS.MAX}
	tabindex="0"
	onmousedown={handleMouseDown}
	ontouchstart={handleTouchStart}
	ondblclick={handleDoubleClick}
	onkeydown={handleKeyDown}
>
	<div class="handle-line"></div>
	<div class="handle-grip">
		<span></span>
		<span></span>
		<span></span>
	</div>
</div>

<style>
	.resize-handle {
		position: relative;
		width: 6px;
		cursor: col-resize;
		background: transparent;
		transition: background 0.15s ease;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.resize-handle:hover,
	.resize-handle.dragging {
		background: var(--color-primary, #3b82f6);
		background: linear-gradient(
			to bottom,
			transparent 0%,
			var(--color-primary, #3b82f6) 20%,
			var(--color-primary, #3b82f6) 80%,
			transparent 100%
		);
	}

	.resize-handle:focus {
		outline: none;
	}

	.resize-handle:focus-visible {
		background: var(--color-primary, #3b82f6);
	}

	.handle-line {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 1px;
		background: var(--color-border, rgba(255, 255, 255, 0.1));
		transform: translateX(-50%);
	}

	.resize-handle:hover .handle-line,
	.resize-handle.dragging .handle-line {
		background: transparent;
	}

	.handle-grip {
		display: flex;
		flex-direction: column;
		gap: 3px;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.resize-handle:hover .handle-grip,
	.resize-handle.dragging .handle-grip {
		opacity: 1;
	}

	.handle-grip span {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: white;
	}
</style>
