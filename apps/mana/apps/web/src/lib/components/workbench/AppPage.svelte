<!--
  AppPage — Workbench app card with overlay detail views.
  The list view is always rendered. Detail/edit views open as an overlay
  that floats slightly larger than the panel underneath.
-->
<script lang="ts">
	import { X, CaretUp, CaretDown, ArrowLeft, SpinnerGap } from '@mana/shared-icons';
	import { _ } from 'svelte-i18n';
	import { PageShell } from '$lib/components/page-carousel';
	import { getApp, getAppByDragType, canDrop, executeDrop } from '$lib/app-registry';
	import type { Component } from 'svelte';
	import { dropTarget } from '@mana/shared-ui/dnd';
	import type { DragPayload } from '@mana/shared-ui/dnd';

	interface Props {
		appId: string;
		widthPx: number;
		heightPx?: number;
		maximized?: boolean;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onResize?: (widthPx: number, heightPx?: number) => void;
		onMoveLeft?: () => void;
		onMoveRight?: () => void;
		onContextMenu?: (e: MouseEvent) => void;
	}

	let {
		appId,
		widthPx,
		heightPx,
		maximized = false,
		onClose,
		onMinimize,
		onMaximize,
		onResize,
		onMoveLeft,
		onMoveRight,
		onContextMenu,
	}: Props = $props();

	let app = $derived(getApp(appId));
	let appIcon = $derived(app?.icon);
	let appName = $derived.by(() => {
		const key = `apps.${appId}`;
		const translated = $_(key);
		return translated !== key ? translated : (app?.name ?? appId);
	});
	let appColor = $derived(app?.color ?? '#6B7280');

	// ── Cross-module drop target ────────────────────────────
	let acceptedDropTypes = $derived(app?.acceptsDropFrom ?? []);

	function handleCrossModuleDrop(payload: DragPayload) {
		const sourceApp = getAppByDragType(payload.type);
		if (!sourceApp) return;
		executeDrop(payload.data as Record<string, unknown>, sourceApp.id, appId);
	}

	// ── List View (always loaded) ───────────────────────────
	let ListComponent = $state<Component | null>(null);
	let loadError = $state(false);

	// Track the last appId we loaded for so we only reload when it actually
	// changes — not on every reactive churn from the data layer below us.
	// Without this guard, any liveQuery update inside a child ListView (e.g.
	// creating a task) can re-run this effect, which clears ListComponent and
	// makes the whole carousel flash like a page reload.
	let lastLoadedAppId: string | undefined = undefined;

	$effect(() => {
		if (appId === lastLoadedAppId) return;
		lastLoadedAppId = appId;

		ListComponent = null;
		loadError = false;
		const currentApp = app;
		if (currentApp) {
			currentApp.views.list.load().then(
				(mod) => {
					// Guard against an out-of-order load if appId changed again
					// while we were awaiting.
					if (lastLoadedAppId === appId) ListComponent = mod.default;
				},
				() => {
					if (lastLoadedAppId === appId) loadError = true;
				}
			);
		}
	});

	// ── Overlay Stack ───────────────────────────────────────
	interface OverlayFrame {
		viewName: string;
		params: Record<string, unknown>;
		component: Component | null;
		/** App color for the overlay header (for cross-detail). */
		overlayColor?: string;
		/** App name for the overlay header (for cross-detail). */
		overlayTitle?: string;
	}

	let overlayStack = $state<OverlayFrame[]>([]);
	let overlay = $derived(overlayStack.length > 0 ? overlayStack[overlayStack.length - 1] : null);
	let hasOverlay = $derived(overlayStack.length > 0);

	// Close animation
	let closing = $state(false);

	function closeAllOverlays() {
		closing = true;
		setTimeout(() => {
			overlayStack = [];
			siblingIds = [];
			siblingKey = '';
			closing = false;
		}, 150);
	}

	// Escape key closes overlay
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && hasOverlay) {
			e.stopPropagation();
			if (overlayStack.length > 1) {
				goBack();
			} else {
				closeAllOverlays();
			}
		}
	}

	// Sibling item IDs for prev/next navigation (only for first overlay level)
	let siblingIds = $state<string[]>([]);
	let siblingKey = $state<string>('');
	let cachedOverlayComponent = $state<Component | null>(null);

	let currentSiblingIndex = $derived(() => {
		if (!overlay || !siblingKey || siblingIds.length === 0 || overlayStack.length > 1) return -1;
		const currentId = overlay.params[siblingKey] as string;
		return siblingIds.indexOf(currentId);
	});
	let hasPrev = $derived(currentSiblingIndex() > 0);
	let hasNext = $derived(
		currentSiblingIndex() >= 0 && currentSiblingIndex() < siblingIds.length - 1
	);

	function navigate(viewName: string, params: Record<string, unknown> = {}) {
		if (viewName === 'list') {
			overlayStack = [];
			siblingIds = [];
			siblingKey = '';
			return;
		}

		// Cross-detail: open a detail view from another app
		if (viewName === 'cross-detail') {
			const targetApp = params._targetApp as string;
			const targetId = params._targetId as string;
			if (!targetApp || !targetId) return;

			const targetAppDesc = getApp(targetApp);
			const targetViewEntry = targetAppDesc?.views?.detail;
			if (!targetViewEntry || !targetAppDesc?.paramKey) {
				console.warn(`No detail view registered for app "${targetApp}"`);
				return;
			}

			targetViewEntry.load().then((mod) => {
				overlayStack = [
					...overlayStack,
					{
						viewName: 'cross-detail',
						params: { [targetAppDesc.paramKey!]: targetId },
						component: mod.default,
						overlayColor: targetAppDesc.color,
						overlayTitle: (() => {
							const k = `apps.${targetApp}`;
							const t = $_(k);
							return t !== k ? t : targetAppDesc.name;
						})(),
					},
				];
			});
			return;
		}

		// Normal detail view within the same app
		const viewEntry = viewName === 'detail' ? app?.views?.detail : undefined;
		if (!viewEntry) {
			console.warn(`View "${viewName}" not registered for app "${appId}"`);
			return;
		}

		const ids = params._siblingIds as string[] | undefined;
		const key = params._siblingKey as string | undefined;
		if (ids && key) {
			siblingIds = ids;
			siblingKey = key;
		} else if (overlayStack.length === 0) {
			siblingIds = [];
			siblingKey = '';
		}

		const viewParams = { ...params };
		delete viewParams._siblingIds;
		delete viewParams._siblingKey;

		viewEntry.load().then((mod) => {
			cachedOverlayComponent = mod.default;
			// Replace the stack (not push) for same-app detail navigation
			overlayStack = [{ viewName, params: viewParams, component: mod.default }];
		});
	}

	function goBack() {
		if (overlayStack.length > 1) {
			// Pop the top overlay (cross-detail)
			overlayStack = overlayStack.slice(0, -1);
		} else {
			overlayStack = [];
			siblingIds = [];
			siblingKey = '';
		}
	}

	function goToPrev() {
		const idx = currentSiblingIndex();
		if (idx > 0 && overlay && siblingKey && cachedOverlayComponent && overlayStack.length === 1) {
			overlayStack = [
				{
					viewName: overlay.viewName,
					params: { ...overlay.params, [siblingKey]: siblingIds[idx - 1] },
					component: cachedOverlayComponent,
				},
			];
		}
	}

	function goToNext() {
		const idx = currentSiblingIndex();
		if (
			idx >= 0 &&
			idx < siblingIds.length - 1 &&
			overlay &&
			siblingKey &&
			cachedOverlayComponent &&
			overlayStack.length === 1
		) {
			overlayStack = [
				{
					viewName: overlay.viewName,
					params: { ...overlay.params, [siblingKey]: siblingIds[idx + 1] },
					component: cachedOverlayComponent,
				},
			];
		}
	}

	let overlayCardEl = $state<HTMLDivElement | null>(null);
	let appPageEl = $state<HTMLDivElement | null>(null);

	// Close overlay on click outside or Escape key
	$effect(() => {
		if (!overlay) return;
		function handleGlobalClick(e: MouseEvent) {
			const target = e.target as Node;
			if (
				overlayCardEl &&
				appPageEl &&
				appPageEl.contains(target) &&
				!overlayCardEl.contains(target)
			) {
				closeAllOverlays();
			}
		}
		const timer = setTimeout(() => {
			window.addEventListener('click', handleGlobalClick, true);
		}, 0);
		window.addEventListener('keydown', handleKeydown);
		return () => {
			clearTimeout(timer);
			window.removeEventListener('click', handleGlobalClick, true);
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div
	bind:this={appPageEl}
	class="app-page-wrapper"
	use:dropTarget={{
		accepts: acceptedDropTypes,
		onDrop: handleCrossModuleDrop,
		canDrop: (p) => canDrop(p.type, appId),
	}}
>
	<!-- Base: PageShell with list view (always visible) -->
	<PageShell
		{widthPx}
		{heightPx}
		{maximized}
		title={appName}
		titleHref={`/${appId}`}
		color={appColor}
		icon={appIcon}
		{onClose}
		{onMinimize}
		{onMaximize}
		{onResize}
		{onMoveLeft}
		{onMoveRight}
		{onContextMenu}
	>
		{#if loadError}
			<div class="load-state">
				<p>App konnte nicht geladen werden</p>
			</div>
		{:else if ListComponent}
			<div class="list-container" class:dimmed={hasOverlay}>
				<ListComponent {navigate} {goBack} params={{}} />
			</div>
		{:else}
			<div class="load-state">
				<SpinnerGap size={24} class="spinner" />
			</div>
		{/if}
	</PageShell>

	<!-- Overlay: Detail view floating above -->
	{#if overlay?.component || closing}
		{@const OverlayComponent = overlay?.component}
		<div class="overlay-backdrop" class:closing>
			<div class="overlay-card" bind:this={overlayCardEl}>
				<!-- Nav: prev arrow -->
				{#if hasPrev}
					<button class="nav-arrow" onclick={goToPrev} title="Vorheriger">
						<CaretUp size={14} weight="bold" />
					</button>
				{/if}

				<!-- Header -->
				<div class="overlay-header">
					{#if overlayStack.length > 1}
						<button class="back-btn" onclick={goBack} title="Zurück">
							<ArrowLeft size={12} />
						</button>
					{/if}
					<span class="color-dot" style="background-color: {overlay?.overlayColor ?? appColor}"
					></span>
					<span class="overlay-title">{overlay?.overlayTitle ?? appName}</span>
					{#if siblingIds.length > 1 && overlayStack.length === 1}
						<span class="nav-counter">
							{currentSiblingIndex() + 1}/{siblingIds.length}
						</span>
					{/if}
					<button class="close-btn" onclick={closeAllOverlays} title="Schließen">
						<X size={14} />
					</button>
				</div>

				<!-- Body -->
				<div class="overlay-body">
					{#if OverlayComponent && overlay}
						{#key overlay.params[siblingKey] ?? ''}
							<OverlayComponent {navigate} {goBack} params={overlay.params} />
						{/key}
					{/if}
				</div>

				<!-- Nav: next arrow -->
				{#if hasNext}
					<button class="nav-arrow" onclick={goToNext} title="Nächster">
						<CaretDown size={14} weight="bold" />
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.app-page-wrapper {
		position: relative;
	}
	:global(.app-page-wrapper.mana-drop-target-hover) :global(.page-shell) {
		outline: 2px solid hsl(var(--color-primary) / 0.5);
		outline-offset: -2px;
		box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
	}
	:global(.app-page-wrapper.mana-drop-target-success) :global(.page-shell) {
		outline: 2px solid hsl(var(--color-success) / 0.5);
		outline-offset: -2px;
	}

	.load-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 200px;
		color: hsl(var(--color-muted-foreground));
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

	.list-container {
		height: 100%;
		transition: filter 0.2s ease;
	}
	.list-container.dimmed {
		filter: brightness(0.7) blur(1px);
		pointer-events: none;
	}

	/* ── Overlay ──────────────────────────────────────────── */
	.overlay-backdrop {
		position: absolute;
		inset: -12px;
		z-index: 10;
		display: flex;
		align-items: stretch;
		justify-content: center;
		animation: fadeIn 0.15s ease-out;
	}
	.overlay-backdrop.closing {
		animation: fadeOut 0.15s ease-in forwards;
		pointer-events: none;
	}

	.overlay-card {
		width: 100%;
		display: flex;
		flex-direction: column;
		background: hsl(var(--color-card));
		border-radius: 0.5rem;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(0, 0, 0, 0.06);
		overflow: hidden;
		animation: scaleIn 0.2s ease-out;
	}
	.closing .overlay-card {
		animation: scaleOut 0.15s ease-in forwards;
	}

	/* Nav arrows — inside the card, flush with edges */
	.nav-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 28px;
		flex-shrink: 0;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.nav-arrow:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}

	.nav-counter {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.overlay-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.color-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.overlay-title {
		flex: 1;
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.back-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.close-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.overlay-body {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
	@keyframes scaleOut {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.96);
		}
	}
</style>
