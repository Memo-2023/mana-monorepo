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
		ArrowLeft,
		ArrowRight,
		SpinnerGap,
	} from '@manacore/shared-icons';
	import { getAppEntry } from './app-registry';
	import type { Component } from 'svelte';

	interface Props {
		appId: string;
		pageWidth: string;
		maximized?: boolean;
		editMode?: boolean;
		isFirst?: boolean;
		isLast?: boolean;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onMoveLeft?: () => void;
		onMoveRight?: () => void;
	}

	let {
		appId,
		pageWidth,
		maximized = false,
		editMode = false,
		isFirst = false,
		isLast = false,
		onClose,
		onMinimize,
		onMaximize,
		onMoveLeft,
		onMoveRight,
	}: Props = $props();

	let appEntry = $derived(getAppEntry(appId));
	let appName = $derived(appEntry?.name ?? appId);
	let appColor = $derived(appEntry?.color ?? '#6B7280');

	// Lazy-load app component
	let AppComponent = $state<Component | null>(null);
	let loadError = $state(false);

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
</script>

<div
	class="app-page"
	class:maximized
	class:editing={editMode}
	style="width: {maximized ? '100%' : pageWidth}"
>
	<div class="drag-handle-bar">
		<span class="drag-handle"><DotsSixVertical size={14} /></span>
	</div>

	<!-- Edit controls -->
	{#if editMode}
		<div class="edit-controls">
			<div class="move-btns">
				{#if !isFirst && onMoveLeft}
					<button class="edit-btn" onclick={onMoveLeft} title="Nach links">
						<ArrowLeft size={14} />
					</button>
				{/if}
				{#if !isLast && onMoveRight}
					<button class="edit-btn" onclick={onMoveRight} title="Nach rechts">
						<ArrowRight size={14} />
					</button>
				{/if}
			</div>
			<button class="edit-btn delete-btn" onclick={onClose} title="App entfernen">
				<X size={14} />
			</button>
		</div>
	{/if}

	<!-- Header -->
	<div class="page-header">
		<div class="header-left">
			<span class="app-dot" style="background-color: {appColor}"></span>
			<span class="app-name">{appName}</span>
		</div>
		{#if !editMode}
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
		{/if}
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
	}
	:global(.dark) .app-page {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}
	.app-page.editing {
		box-shadow:
			0 2px 12px rgba(139, 92, 246, 0.12),
			0 0 0 2px rgba(139, 92, 246, 0.3);
	}
	:global(.dark) .app-page.editing {
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

	/* Edit controls */
	.edit-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.75rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .edit-controls {
		border-bottom-color: rgba(255, 255, 255, 0.08);
	}
	.move-btns {
		display: flex;
		gap: 0.25rem;
	}
	.edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.edit-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #374151;
	}
	:global(.dark) .edit-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
	}
	.delete-btn:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
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
</style>
