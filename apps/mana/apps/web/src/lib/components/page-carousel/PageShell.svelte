<!--
  PageShell — Shared card wrapper for pages in a carousel.
  Provides: drag handle, header, resize handle, maximized mode.
  Used by workbench (AppPage) and todo (TodoPage).
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import {
		X,
		DotsSixVertical,
		CornersOut,
		CornersIn,
		CaretLeft,
		CaretRight,
	} from '@mana/shared-icons';
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
		titleHref?: string;
		color?: string;
		icon?: Component;
		onContextMenu?: (e: MouseEvent) => void;
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
		onMaximize,
		onResize,
		onMoveLeft,
		onMoveRight,
		onContextMenu,
		title = '',
		titleHref,
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
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div class="drag-handle-bar" draggable="true" oncontextmenu={onContextMenu} role="toolbar">
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
	<div class="page-header" ondragstart={(e) => e.preventDefault()} role="banner">
		<div class="header-left">
			{#if header_left}
				{@render header_left()}
			{:else}
				{#if IconComponent}
					<span class="header-icon" style="color: {color}">
						<IconComponent size={24} weight="fill" />
					</span>
				{:else}
					<span class="color-dot" style="background-color: {color}"></span>
				{/if}
				{#if titleHref}
					<a
						class="page-title page-title-link"
						href={titleHref}
						target="_blank"
						rel="noopener noreferrer"
						onclick={(e) => e.stopPropagation()}
						ondragstart={(e) => e.preventDefault()}
						draggable="false"
						title={`${title} in neuem Tab öffnen`}
					>
						{title}
					</a>
				{:else}
					<span class="page-title">{title}</span>
				{/if}
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
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="resize-handle"
			onmousedown={onMouseDown}
			ontouchstart={onTouchStartHandle}
			role="separator"
			aria-orientation="horizontal"
		>
			<svg width="10" height="10" viewBox="0 0 10 10">
				<line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.2" />
				<line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" stroke-width="1.2" />
			</svg>
		</div>
	{/if}
</div>

<style>
	/* P5: theme-token migration. The workbench paper card now follows the
	   active theme variant. */
	.page-shell {
		flex: 0 0 auto;
		min-height: 60vh;
		max-width: calc(100vw - 2rem);
		background: hsl(var(--color-card));
		border-radius: 1.25rem;
		box-shadow:
			0 2px 8px hsl(0 0% 0% / 0.08),
			0 0 0 1px hsl(var(--color-border));
		display: flex;
		flex-direction: column;
		animation: fadeIn 0.25s ease-out;
		overflow: hidden;
		position: relative;
	}
	.page-shell.resizing {
		box-shadow:
			0 2px 12px hsl(var(--color-primary) / 0.15),
			0 0 0 2px hsl(var(--color-primary) / 0.3);
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
		background: transparent;
		border-bottom: none;
		transition: background 0.15s;
	}
	.drag-handle-bar:hover {
		background: transparent;
	}
	.drag-handle-bar:active {
		cursor: grabbing;
		background: transparent;
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
		color: hsl(var(--color-muted-foreground) / 0.5);
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}
	.move-btn:hover {
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-surface-hover));
	}
	.move-left {
		left: 0.5rem;
	}
	.move-right {
		right: 0.5rem;
	}
	.drag-handle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--color-muted-foreground) / 0.5);
		transform: rotate(90deg);
		transition: color 0.15s;
	}
	.drag-handle-bar:hover .drag-handle-icon {
		color: hsl(var(--color-muted-foreground));
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
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	a.page-title-link {
		text-decoration: none;
		cursor: pointer;
		transition: color 0.15s;
	}
	a.page-title-link:hover {
		color: hsl(var(--color-primary));
		text-decoration: underline;
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
		color: hsl(var(--color-muted-foreground) / 0.5);
		cursor: pointer;
		transition: all 0.15s;
	}
	.window-btn:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.window-btn-close:hover {
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
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
		color: hsl(var(--color-muted-foreground) / 0.5);
		transition: color 0.15s;
		border-radius: 0.25rem 0 0.375rem 0;
		touch-action: none;
	}
	.resize-handle:hover {
		color: hsl(var(--color-muted-foreground));
	}
</style>
