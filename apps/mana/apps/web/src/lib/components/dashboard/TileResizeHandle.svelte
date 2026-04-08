<script lang="ts">
	/**
	 * TileResizeHandle — Draggable divider for tiling layout.
	 * Supports horizontal (col-resize) and vertical (row-resize) directions.
	 * Keyboard accessible: arrow keys (2%), shift+arrow (10%), Home to reset.
	 */

	interface Props {
		direction: 'horizontal' | 'vertical';
		ratio: number;
		onResize: (ratio: number) => void;
		onReset: () => void;
		onDragStateChange?: (isDragging: boolean) => void;
	}

	let { direction, ratio, onResize, onReset, onDragStateChange }: Props = $props();

	let isDragging = $state(false);
	let handleRef: HTMLElement | undefined;

	const MIN = 0.1;
	const MAX = 0.9;

	function clamp(v: number): number {
		return Math.max(MIN, Math.min(MAX, v));
	}

	function setDragging(value: boolean) {
		isDragging = value;
		onDragStateChange?.(value);
	}

	function handleMouseDown(event: MouseEvent) {
		event.preventDefault();
		setDragging(true);

		const container = handleRef?.parentElement;
		if (!container) return;

		const handleMouseMove = (e: MouseEvent) => {
			const rect = container.getBoundingClientRect();
			let newRatio: number;
			if (direction === 'horizontal') {
				newRatio = (e.clientX - rect.left) / rect.width;
			} else {
				newRatio = (e.clientY - rect.top) / rect.height;
			}
			onResize(clamp(newRatio));
		};

		const handleMouseUp = () => {
			setDragging(false);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleTouchStart(event: TouchEvent) {
		event.preventDefault();
		setDragging(true);

		const container = handleRef?.parentElement;
		if (!container) return;

		const handleTouchMove = (e: TouchEvent) => {
			const touch = e.touches[0];
			const rect = container.getBoundingClientRect();
			let newRatio: number;
			if (direction === 'horizontal') {
				newRatio = (touch.clientX - rect.left) / rect.width;
			} else {
				newRatio = (touch.clientY - rect.top) / rect.height;
			}
			onResize(clamp(newRatio));
		};

		const handleTouchEnd = () => {
			setDragging(false);
			window.removeEventListener('touchmove', handleTouchMove);
			window.removeEventListener('touchend', handleTouchEnd);
		};

		window.addEventListener('touchmove', handleTouchMove, { passive: false });
		window.addEventListener('touchend', handleTouchEnd);
	}

	function handleKeyDown(event: KeyboardEvent) {
		const step = event.shiftKey ? 0.1 : 0.02;
		const increase = direction === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
		const decrease = direction === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

		if (event.key === increase) {
			event.preventDefault();
			onResize(clamp(ratio + step));
		} else if (event.key === decrease) {
			event.preventDefault();
			onResize(clamp(ratio - step));
		} else if (event.key === 'Home') {
			event.preventDefault();
			onReset();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_interactions -->
<div
	bind:this={handleRef}
	class="tile-resize-handle"
	class:horizontal={direction === 'horizontal'}
	class:vertical={direction === 'vertical'}
	class:dragging={isDragging}
	onmousedown={handleMouseDown}
	ontouchstart={handleTouchStart}
	onkeydown={handleKeyDown}
	ondblclick={onReset}
	role="separator"
	tabindex="0"
	aria-orientation={direction}
	aria-valuenow={Math.round(ratio * 100)}
	aria-valuemin={Math.round(MIN * 100)}
	aria-valuemax={Math.round(MAX * 100)}
	aria-label="Panel-Teiler"
>
	<div class="tile-resize-handle-bar"></div>
</div>

{#if isDragging}
	<div class="tile-resize-overlay"></div>
{/if}

<style>
	.tile-resize-handle {
		flex: 0 0 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 5;
		user-select: none;
		touch-action: none;
	}

	.tile-resize-handle.horizontal {
		cursor: col-resize;
	}

	.tile-resize-handle.vertical {
		cursor: row-resize;
	}

	.tile-resize-handle-bar {
		border-radius: 3px;
		background: hsl(var(--color-border));
		transition: background 0.15s ease;
	}

	.tile-resize-handle.horizontal .tile-resize-handle-bar {
		width: 4px;
		height: 32px;
	}

	.tile-resize-handle.vertical .tile-resize-handle-bar {
		width: 32px;
		height: 4px;
	}

	.tile-resize-handle:hover .tile-resize-handle-bar,
	.tile-resize-handle.dragging .tile-resize-handle-bar {
		background: hsl(var(--color-primary));
	}

	.tile-resize-handle:focus-visible {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: -1px;
		border-radius: 3px;
	}

	.tile-resize-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		cursor: inherit;
	}
</style>
