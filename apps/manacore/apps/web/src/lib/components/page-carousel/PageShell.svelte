<!--
  PageShell — Shared card wrapper for pages in a carousel.
  Provides: drag handle, header, resize handle, maximized mode.
  Used by workbench (AppPage) and todo (TodoPage).
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import {
		X,
		Minus,
		DotsSixVertical,
		CornersOut,
		CornersIn,
		CaretLeft,
		CaretRight,
	} from '@manacore/shared-icons';
	import type { Snippet, Component } from 'svelte';

	interface Props {
		widthPx: number;
		heightPx?: number;
		maximized?: boolean;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onResize?: (widthPx: number, heightPx?: number) => void;
		onMoveLeft?: () => void;
		onMoveRight?: () => void;
		// Default header
		title?: string;
		color?: string;
		icon?: Component;
		// Snippet overrides
		header_left?: Snippet;
		badge?: Snippet;
		toolbar?: Snippet;
		children: Snippet;
	}

	let {
		widthPx,
		heightPx,
		maximized = false,
		onClose,
		onMinimize,
		onMaximize,
		onResize,
		onMoveLeft,
		onMoveRight,
		title = '',
		color = '#6B7280',
		icon: IconComponent,
		header_left,
		badge,
		toolbar,
		children,
	}: Props = $props();

	const MIN_WIDTH = 280;
	const MAX_WIDTH = 1200;
	const MIN_HEIGHT = 200;
	const MAX_HEIGHT = 2000;

	let resizing = $state(false);
	let shellEl = $state<HTMLDivElement | null>(null);

	function handleResizeStart(startX: number, startY: number) {
		if (!onResize) return;
		const startWidth = widthPx;
		const startHeight = heightPx ?? shellEl?.offsetHeight ?? MIN_HEIGHT;
		resizing = true;
		document.body.style.userSelect = 'none';
		document.body.style.cursor = 'nwse-resize';

		function onMove(clientX: number, clientY: number) {
			const deltaX = clientX - startX;
			const deltaY = clientY - startY;
			const newWidth = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + deltaX)));
			const newHeight = Math.round(
				Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + deltaY))
			);
			onResize!(newWidth, newHeight);
		}

		function onEnd() {
			resizing = false;
			document.body.style.userSelect = '';
			document.body.style.cursor = '';
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onEnd);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', onEnd);
		}

		function onMouseMove(e: MouseEvent) {
			onMove(e.clientX, e.clientY);
		}
		function onTouchMove(e: TouchEvent) {
			onMove(e.touches[0].clientX, e.touches[0].clientY);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onEnd);
		window.addEventListener('touchmove', onTouchMove);
		window.addEventListener('touchend', onEnd);
	}

	function onMouseDown(e: MouseEvent) {
		e.preventDefault();
		handleResizeStart(e.clientX, e.clientY);
	}

	function onTouchStartHandle(e: TouchEvent) {
		e.preventDefault();
		handleResizeStart(e.touches[0].clientX, e.touches[0].clientY);
	}
</script>

<div
	bind:this={shellEl}
	class="page-shell"
	class:maximized
	class:resizing
	style="width: {maximized ? '100%' : `${widthPx}px`}; {heightPx && !maximized
		? `height: ${heightPx}px; min-height: 0;`
		: ''}"
>
	<div class="drag-handle-bar" draggable="true">
		{#if onMoveLeft}
			<button
				class="move-btn move-left"
				onclick={(e) => {
					e.stopPropagation();
					onMoveLeft();
				}}
				draggable="false"
				title="Nach links"
			>
				<CaretLeft size={12} />
			</button>
		{/if}
		<span class="drag-handle-icon"><DotsSixVertical size={14} /></span>
		<div class="window-actions">
			{#if onMinimize}
				<button
					class="window-btn"
					onclick={(e) => {
						e.stopPropagation();
						onMinimize();
					}}
					draggable="false"
					title="Minimieren"
				>
					<Minus size={12} />
				</button>
			{/if}
			{#if onMaximize}
				<button
					class="window-btn"
					onclick={(e) => {
						e.stopPropagation();
						onMaximize();
					}}
					draggable="false"
					title={maximized ? 'Verkleinern' : 'Maximieren'}
				>
					{#if maximized}<CornersIn size={12} />{:else}<CornersOut size={12} />{/if}
				</button>
			{/if}
			<button
				class="window-btn window-btn-close"
				onclick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				draggable="false"
				title={$_('common.close')}
			>
				<X size={12} />
			</button>
		</div>
		{#if onMoveRight}
			<button
				class="move-btn move-right"
				onclick={(e) => {
					e.stopPropagation();
					onMoveRight();
				}}
				draggable="false"
				title="Nach rechts"
			>
				<CaretRight size={12} />
			</button>
		{/if}
	</div>

	<!-- Header -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="page-header" ondragstart={(e) => e.preventDefault()}>
		<div class="header-left">
			{#if header_left}
				{@render header_left()}
			{:else}
				{#if IconComponent}
					<span class="header-icon" style="color: {color}">
						<IconComponent size={16} weight="fill" />
					</span>
				{:else}
					<span class="color-dot" style="background-color: {color}"></span>
				{/if}
				<span class="page-title">{title}</span>
			{/if}
			{#if badge}
				{@render badge()}
			{/if}
		</div>
	</div>

	<!-- Optional toolbar (e.g. PageEditBar) -->
	{#if toolbar}
		{@render toolbar()}
	{/if}

	<!-- Body -->
	<div class="page-body">
		{@render children()}
	</div>

	<!-- Resize handle -->
	{#if onResize && !maximized}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="resize-handle" onmousedown={onMouseDown} ontouchstart={onTouchStartHandle}>
			<svg width="10" height="10" viewBox="0 0 10 10">
				<line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.2" />
				<line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" stroke-width="1.2" />
			</svg>
		</div>
	{/if}
</div>

<style>
	.page-shell {
		flex: 0 0 auto;
		min-height: 60vh;
		max-width: calc(100vw - 2rem);
		background: #fffef5;
		border-radius: 0.375rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		animation: fadeIn 0.25s ease-out;
		overflow: hidden;
		position: relative;
	}
	:global(.dark) .page-shell {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}
	.page-shell.resizing {
		box-shadow:
			0 2px 12px rgba(139, 92, 246, 0.12),
			0 0 0 2px rgba(139, 92, 246, 0.3);
	}
	:global(.dark) .page-shell.resizing {
		box-shadow:
			0 2px 12px rgba(139, 92, 246, 0.2),
			0 0 0 2px rgba(139, 92, 246, 0.4);
	}
	.page-shell.maximized {
		position: fixed;
		inset: 0;
		z-index: 50;
		width: 100% !important;
		min-height: 100vh;
		border-radius: 0;
		box-shadow: none;
		animation: fadeInScale 0.2s ease-out;
	}
	@keyframes fadeInScale {
		from {
			opacity: 0.8;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.drag-handle-bar {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.2rem 0;
		cursor: grab;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
		transition: background 0.15s;
	}
	.drag-handle-bar:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	.drag-handle-bar:active {
		cursor: grabbing;
		background: rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .drag-handle-bar {
		background: rgba(255, 255, 255, 0.02);
		border-bottom-color: rgba(255, 255, 255, 0.04);
	}
	:global(.dark) .drag-handle-bar:hover {
		background: rgba(255, 255, 255, 0.05);
	}
	:global(.dark) .drag-handle-bar:active {
		background: rgba(255, 255, 255, 0.08);
	}
	.move-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #d1d5db;
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.move-btn:hover {
		color: #6b7280;
		background: rgba(0, 0, 0, 0.06);
	}
	.move-left {
		left: 0.5rem;
	}
	.move-right {
		right: 0.5rem;
	}
	:global(.dark) .move-btn {
		color: #3f3b38;
	}
	:global(.dark) .move-btn:hover {
		color: #9ca3af;
		background: rgba(255, 255, 255, 0.08);
	}
	.drag-handle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #d1d5db;
		transform: rotate(90deg);
		transition: color 0.15s;
	}
	.drag-handle-bar:hover .drag-handle-icon {
		color: #9ca3af;
	}
	:global(.dark) .drag-handle-icon {
		color: #3f3b38;
	}
	:global(.dark) .drag-handle-bar:hover .drag-handle-icon {
		color: #6b7280;
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		padding: 0.375rem 1rem;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.header-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}
	.color-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.page-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}
	:global(.dark) .page-title {
		color: #f3f4f6;
	}

	.window-actions {
		position: absolute;
		right: 2rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}
	.window-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: #d1d5db;
		cursor: pointer;
		transition: all 0.15s;
	}
	.window-btn:hover {
		background: rgba(0, 0, 0, 0.08);
		color: #6b7280;
	}
	.window-btn-close:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}
	:global(.dark) .window-btn {
		color: #3f3b38;
	}
	:global(.dark) .window-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .window-btn-close:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	/* Body */
	.page-body {
		flex: 1;
		overflow-y: auto;
		min-height: 200px;
	}

	/* Resize handle */
	.resize-handle {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: nwse-resize;
		color: #d1d5db;
		transition: color 0.15s;
		border-radius: 0.25rem 0 0.375rem 0;
		touch-action: none;
	}
	.resize-handle:hover {
		color: #9ca3af;
	}
	:global(.dark) .resize-handle {
		color: #3f3b38;
	}
	:global(.dark) .resize-handle:hover {
		color: #6b7280;
	}
</style>
