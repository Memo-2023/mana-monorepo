<!--
  AppPage — Paper-sheet wrapper for any app in the workbench carousel.
  Lazy-loads the app's AppView component and renders it inside the page shell.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import {
		X,
		Minus,
		DotsSixVertical,
		CornersOut,
		CornersIn,
		SpinnerGap,
	} from '@manacore/shared-icons';
	import { getAppEntry } from './app-registry';
	import type { Component } from 'svelte';

	interface Props {
		appId: string;
		widthPx: number;
		maximized?: boolean;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onResize?: (widthPx: number) => void;
	}

	let {
		appId,
		widthPx,
		maximized = false,
		onClose,
		onMinimize,
		onMaximize,
		onResize,
	}: Props = $props();

	const MIN_WIDTH = 280;
	const MAX_WIDTH = 1200;

	let appEntry = $derived(getAppEntry(appId));
	let appName = $derived(appEntry?.name ?? appId);
	let appColor = $derived(appEntry?.color ?? '#6B7280');

	// Lazy-load app component
	let AppComponent = $state<Component | null>(null);
	let loadError = $state(false);
	let resizing = $state(false);

	$effect(() => {
		AppComponent = null;
		loadError = false;
		if (appEntry) {
			appEntry.load().then(
				(mod) => (AppComponent = mod.default),
				() => (loadError = true)
			);
		}
	});

	function handleResizeStart(startX: number) {
		if (!onResize) return;
		const startWidth = widthPx;
		resizing = true;
		document.body.style.userSelect = 'none';
		document.body.style.cursor = 'ew-resize';

		function onMove(clientX: number) {
			const delta = clientX - startX;
			const newWidth = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta)));
			onResize!(newWidth);
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
			onMove(e.clientX);
		}
		function onTouchMove(e: TouchEvent) {
			onMove(e.touches[0].clientX);
		}

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onEnd);
		window.addEventListener('touchmove', onTouchMove);
		window.addEventListener('touchend', onEnd);
	}

	function onMouseDown(e: MouseEvent) {
		e.preventDefault();
		handleResizeStart(e.clientX);
	}

	function onTouchStart(e: TouchEvent) {
		e.preventDefault();
		handleResizeStart(e.touches[0].clientX);
	}
</script>

<div
	class="app-page"
	class:maximized
	class:resizing
	style="width: {maximized ? '100%' : `${widthPx}px`}"
>
	<div class="drag-handle-bar">
		<span class="drag-handle"><DotsSixVertical size={14} /></span>
	</div>

	<!-- Header -->
	<div class="page-header">
		<div class="header-left">
			<span class="app-dot" style="background-color: {appColor}"></span>
			<span class="app-name">{appName}</span>
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

	<!-- App content -->
	<div class="page-body">
		{#if loadError}
			<div class="load-state">
				<p>App konnte nicht geladen werden</p>
			</div>
		{:else if AppComponent}
			<AppComponent />
		{:else}
			<div class="load-state">
				<SpinnerGap size={24} class="spinner" />
			</div>
		{/if}
	</div>

	<!-- Resize handle -->
	{#if onResize && !maximized}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="resize-handle"
			onmousedown={onMouseDown}
			ontouchstart={onTouchStart}
		>
			<svg width="10" height="10" viewBox="0 0 10 10">
				<line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.2" />
				<line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" stroke-width="1.2" />
			</svg>
		</div>
	{/if}
</div>

<style>
	.app-page {
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
	:global(.dark) .app-page {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}
	.app-page.resizing {
		box-shadow:
			0 2px 12px rgba(139, 92, 246, 0.12),
			0 0 0 2px rgba(139, 92, 246, 0.3);
	}
	:global(.dark) .app-page.resizing {
		box-shadow:
			0 2px 12px rgba(139, 92, 246, 0.2),
			0 0 0 2px rgba(139, 92, 246, 0.4);
	}
	.app-page.maximized {
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
	.app-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.app-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}
	:global(.dark) .app-name {
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

	.load-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 200px;
		color: #9ca3af;
		font-size: 0.8125rem;
	}

	.load-state :global(.spinner) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
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
		cursor: ew-resize;
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
