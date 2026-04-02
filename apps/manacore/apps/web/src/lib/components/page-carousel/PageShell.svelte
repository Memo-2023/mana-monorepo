<!--
  PageShell — Shared card wrapper for pages in a carousel.
  Provides: drag handle, header, resize handle, maximized mode.
  Used by workbench (AppPage) and todo (TodoPage).
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { X, Minus, DotsSixVertical, CornersOut, CornersIn } from '@manacore/shared-icons';
	import type { Snippet, Component } from 'svelte';

	interface Props {
		widthPx: number;
		heightPx?: number;
		maximized?: boolean;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onResize?: (widthPx: number, heightPx?: number) => void;
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

	function handleResizeStart(startX: number, startY: number) {
		if (!onResize) return;
		const startWidth = widthPx;
		const startHeight = heightPx ?? 0;
		resizing = true;
		document.body.style.userSelect = 'none';
		document.body.style.cursor = 'nwse-resize';

		function onMove(clientX: number, clientY: number) {
			const deltaX = clientX - startX;
			const newWidth = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + deltaX)));
			if (startHeight > 0) {
				const deltaY = clientY - startY;
				const newHeight = Math.round(
					Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + deltaY))
				);
				onResize!(newWidth, newHeight);
			} else {
				onResize!(newWidth);
			}
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
	class="page-shell"
	class:maximized
	class:resizing
	style="width: {maximized ? '100%' : `${widthPx}px`}; {heightPx && !maximized
		? `height: ${heightPx}px; min-height: 0;`
		: ''}"
>
	<div class="drag-handle-bar">
		<span class="drag-handle"><DotsSixVertical size={14} /></span>
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
		<div class="header-actions">
			{#if onMinimize}
				<button class="header-btn" onclick={onMinimize} title="Minimieren">
					<Minus size={14} />
				</button>
			{/if}
			{#if onMaximize}
				<button
					class="header-btn"
					onclick={onMaximize}
					title={maximized ? 'Verkleinern' : 'Maximieren'}
				>
					{#if maximized}<CornersIn size={14} />{:else}<CornersOut size={14} />{/if}
				</button>
			{/if}
			<button class="header-btn" onclick={onClose} title={$_('common.close')}>
				<X size={14} />
			</button>
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
		display: flex;
		justify-content: center;
		padding: 0.25rem 0 0;
	}
	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 14px;
		color: #d1d5db;
		cursor: grab;
		border-radius: 0.25rem;
		transition: color 0.15s;
	}
	.drag-handle:hover {
		color: #9ca3af;
	}
	.drag-handle:active {
		cursor: grabbing;
	}
	:global(.dark) .drag-handle {
		color: #3f3b38;
	}
	:global(.dark) .drag-handle:hover {
		color: #6b7280;
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
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

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}
	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.header-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}
	:global(.dark) .header-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
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
