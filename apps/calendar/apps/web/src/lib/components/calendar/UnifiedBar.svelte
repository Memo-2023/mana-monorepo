<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import { QuickInputBar, TagStrip } from '@manacore/shared-ui';
	import type { QuickInputItem, CreatePreview } from '@manacore/shared-ui';
	import { unifiedBarStore } from '$lib/stores/unified-bar.svelte';
	import type { Tag } from '@manacore/shared-tags';

	// Live tags from layout context
	const tagsCtx: { readonly value: Tag[] } = getContext('tags');
	import { settingsStore } from '$lib/stores/settings.svelte';
	import DateStrip from './DateStrip.svelte';
	import CalendarToolbarContent from './CalendarToolbarContent.svelte';
	import { viewStore } from '$lib/stores/view.svelte';
	import type { CalendarViewType } from '@calendar/shared';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	interface Props {
		onSearch: (query: string) => Promise<QuickInputItem[]>;
		onSelect: (item: QuickInputItem) => void;
		onParseCreate?: (query: string) => CreatePreview | null;
		onCreate?: (query: string) => Promise<void>;
		onSearchChange?: (query: string, results: QuickInputItem[]) => void;
		placeholder?: string;
		emptyText?: string;
		searchingText?: string;
		createText?: string;
		appIcon?: string;
		defaultOptions?: { id: string; label: string }[];
		selectedDefaultId?: string;
		defaultOptionLabel?: string;
		onDefaultChange?: (id: string) => void;
		onShowShortcuts?: () => void;
		onShowSyntaxHelp?: () => void;
		leftAction?: Snippet;
		/** Show calendar-specific layers (DateStrip, TagStrip, Toolbar) */
		showCalendarLayers?: boolean;
		isMobile?: boolean;
		/** Hide the entire bar (e.g. immersive mode) */
		hidden?: boolean;
		/** Locale for syntax highlighting (e.g., 'de', 'en') */
		locale?: string;
	}

	let {
		onSearch,
		onSelect,
		onParseCreate,
		onCreate,
		onSearchChange,
		placeholder = 'Neuer Termin oder suchen...',
		emptyText = 'Keine Termine gefunden',
		searchingText = 'Suche...',
		createText = 'Erstellen',
		appIcon = 'calendar',
		defaultOptions,
		selectedDefaultId,
		defaultOptionLabel,
		onDefaultChange,
		onShowShortcuts,
		onShowSyntaxHelp,
		leftAction,
		showCalendarLayers = false,
		isMobile = false,
		hidden = false,
		locale = 'de',
	}: Props = $props();

	const flyConfig = { duration: 250, easing: quintOut, y: 40 };

	// View switcher
	const views: { id: CalendarViewType; label: string; title: string }[] = [
		{ id: 'week', label: '7', title: 'Wochenansicht' },
		{ id: 'month', label: 'M', title: 'Monatsansicht' },
		{ id: 'agenda', label: 'L', title: 'Agenda' },
	];

	function toggleOverlay() {
		unifiedBarStore.toggleOverlay();
	}

	function handleOverlayAction(action: string) {
		switch (action) {
			case 'toggle-date-strip':
				unifiedBarStore.toggleDateStrip();
				break;
			case 'toggle-tag-strip':
				unifiedBarStore.toggleTagStrip();
				break;
			case 'toggle-toolbar':
				unifiedBarStore.toggleCalendarToolbar();
				break;
			case 'collapse-all':
				unifiedBarStore.collapseAll();
				break;
		}
		unifiedBarStore.set('overlayMenuOpen', false);
	}
</script>

<!-- UnifiedBar Container -->
<div class="unified-bar" class:hidden>
	<!-- Layer 3: Toolbar (view switcher + calendar options) -->
	{#if showCalendarLayers && unifiedBarStore.showCalendarToolbar}
		<div
			class="unified-bar-layer toolbar-layer"
			transition:fly={flyConfig}
			role="toolbar"
			aria-label="Kalender-Toolbar"
		>
			<div class="toolbar-inner">
				<div class="view-switcher">
					{#each views as view}
						<button
							class="view-btn"
							class:active={viewStore.viewType === view.id}
							onclick={() => viewStore.setViewType(view.id)}
							title={view.title}
						>
							{view.label}
						</button>
					{/each}
				</div>
				<span class="toolbar-sep"></span>
				<CalendarToolbarContent />
			</div>
		</div>
	{/if}

	<!-- Layer 2: Tag Filter Strip -->
	{#if showCalendarLayers && unifiedBarStore.showTagStrip}
		<div class="unified-bar-layer tag-layer" transition:fly={flyConfig}>
			<TagStrip
				tags={tagsCtx.value.map((t) => ({
					id: t.id,
					name: t.name,
					color: t.color || '#3b82f6',
				}))}
				selectedIds={settingsStore.selectedTagIds}
				onToggle={(tagId) => settingsStore.toggleTagSelection(tagId)}
				onClear={() => settingsStore.clearTagSelection()}
				managementHref="/tags"
			/>
		</div>
	{/if}

	<!-- Layer 1: Date Strip -->
	{#if showCalendarLayers && unifiedBarStore.showDateStrip}
		<div class="unified-bar-layer date-layer" transition:fly={flyConfig}>
			<DateStrip />
		</div>
	{/if}

	<!-- Layer 0: Input Bar (always visible) -->
	<div class="unified-bar-layer input-layer">
		<QuickInputBar
			{onSearch}
			{onSelect}
			{onParseCreate}
			{onCreate}
			{onSearchChange}
			{placeholder}
			{emptyText}
			{searchingText}
			{createText}
			{appIcon}
			{locale}
			deferSearch={true}
			bottomOffset="0px"
			hasFabRight={showCalendarLayers}
			{defaultOptions}
			{selectedDefaultId}
			{defaultOptionLabel}
			{onDefaultChange}
			{onShowShortcuts}
			{onShowSyntaxHelp}
			{leftAction}
		/>

		<!-- Layers Menu FAB (only on calendar main page) -->
		{#if showCalendarLayers}
			<button class="layers-fab" onclick={toggleOverlay} title="Leisten anpassen">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
			</button>
		{/if}
	</div>
</div>

<!-- Overlay Menu (outside container for proper z-index stacking) -->
{#if unifiedBarStore.isOverlayOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="unified-overlay" transition:fly={{ duration: 250, easing: quintOut, y: 100 }}>
		<div class="overlay-backdrop" onclick={toggleOverlay} role="presentation"></div>
		<div class="overlay-sheet" role="dialog" aria-label="Leisten-Menü">
			<div class="overlay-header">
				<h3>Leisten</h3>
				<button class="overlay-close-btn" onclick={toggleOverlay} aria-label="Schließen">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<div class="overlay-items">
				<button
					class="overlay-item"
					class:active={unifiedBarStore.showDateStrip}
					onclick={() => handleOverlayAction('toggle-date-strip')}
				>
					<span class="item-icon">📅</span>
					<span class="item-label">Datum-Leiste</span>
					{#if unifiedBarStore.showDateStrip}<span class="item-check">✓</span>{/if}
				</button>

				<button
					class="overlay-item"
					class:active={unifiedBarStore.showTagStrip}
					onclick={() => handleOverlayAction('toggle-tag-strip')}
				>
					<span class="item-icon">🏷️</span>
					<span class="item-label">Tag-Filter</span>
					{#if unifiedBarStore.showTagStrip}<span class="item-check">✓</span>{/if}
				</button>

				<button
					class="overlay-item"
					class:active={unifiedBarStore.showCalendarToolbar}
					onclick={() => handleOverlayAction('toggle-toolbar')}
				>
					<span class="item-icon">⚙️</span>
					<span class="item-label">Kalender-Toolbar</span>
					{#if unifiedBarStore.showCalendarToolbar}<span class="item-check">✓</span>{/if}
				</button>

				<div class="overlay-sep"></div>

				<button class="overlay-item" onclick={() => handleOverlayAction('collapse-all')}>
					<span class="item-icon">↓</span>
					<span class="item-label">Alle einklappen</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ===== Container ===== */
	.unified-bar {
		position: fixed;
		bottom: calc(70px + env(safe-area-inset-bottom, 0px));
		left: 0;
		right: 0;
		z-index: 80;
		display: flex;
		flex-direction: column;
		pointer-events: none;
	}

	.unified-bar.hidden {
		opacity: 0;
		pointer-events: none !important;
		transform: translateY(100%);
		transition:
			opacity 0.3s ease,
			transform 0.3s ease;
	}

	/* ===== Layers ===== */
	.unified-bar-layer {
		pointer-events: auto;
		overflow: visible;
		position: relative;
	}

	/* ===== Position overrides for embedded components ===== */
	.input-layer :global(.quick-input-bar) {
		position: relative !important;
		bottom: auto !important;
		left: auto !important;
		right: auto !important;
		z-index: auto !important;
	}

	.date-layer :global(.date-strip-wrapper) {
		position: relative !important;
		bottom: auto !important;
		left: auto !important;
		right: auto !important;
		z-index: auto !important;
	}

	/* Remove toolbar-expanded offset since UnifiedBar handles stacking */
	.date-layer :global(.date-strip-wrapper.toolbar-expanded) {
		bottom: auto !important;
	}

	.tag-layer :global(.tag-strip-wrapper) {
		position: relative !important;
		bottom: auto !important;
		left: auto !important;
		right: auto !important;
		z-index: auto !important;
	}

	/* ===== Input layer: FAB width constraints ===== */
	.input-layer :global(.quick-input-bar.has-fab-right .input-container),
	.input-layer :global(.quick-input-bar.has-fab-left .input-container) {
		max-width: 450px;
	}

	@media (max-width: 900px) {
		.input-layer :global(.quick-input-bar.has-fab-right .input-container) {
			max-width: calc(100% - 140px);
			margin-left: auto;
			margin-right: 0;
		}
	}

	@media (max-width: 640px) {
		.input-layer :global(.quick-input-bar.has-fab-right .input-container) {
			max-width: none;
			width: 100%;
			margin: 0;
		}

		.input-layer :global(.quick-input-bar.has-fab-right) {
			padding-left: 1rem;
			padding-right: calc(54px + 1rem + 8px);
		}
	}

	/* ===== Layers FAB ===== */
	.input-layer {
		position: relative;
	}

	.layers-fab {
		position: absolute;
		/* Right of centered InputBar (450px max-width centered) */
		left: calc(50% + 225px + 8px);
		top: 50%;
		transform: translateY(-50%);
		width: 54px;
		height: 54px;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: auto;
		z-index: 91;
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.08);
		color: hsl(var(--color-foreground));
		transition: all 0.2s ease;
	}

	.layers-fab:hover {
		transform: translateY(-50%) scale(1.05);
		box-shadow: 0 4px 12px hsl(var(--color-foreground) / 0.15);
	}

	@media (max-width: 900px) {
		.layers-fab {
			left: auto;
			right: 1rem;
		}
	}

	/* ===== Toolbar Layer ===== */
	.toolbar-layer {
		display: flex;
		justify-content: center;
		padding: 0.5rem 1rem;
	}

	.toolbar-inner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		box-shadow:
			0 4px 6px -1px hsl(var(--color-foreground) / 0.1),
			0 2px 4px -1px hsl(var(--color-foreground) / 0.06);
		pointer-events: auto;
	}

	.view-switcher {
		display: flex;
		gap: 0.25rem;
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.5rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s ease;
	}

	.view-btn:hover {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}

	.view-btn.active {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	.toolbar-sep {
		width: 1px;
		height: 24px;
		background: hsl(var(--color-border));
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.toolbar-inner {
			border-radius: 1rem;
			flex-wrap: wrap;
			justify-content: center;
		}
	}

	/* ===== Overlay ===== */
	.unified-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		pointer-events: auto;
	}

	.overlay-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
	}

	.overlay-sheet {
		position: relative;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-bottom: none;
		border-radius: 1rem 1rem 0 0;
		padding: 1.5rem;
		width: 100%;
		max-width: 400px;
		max-height: 70vh;
		overflow-y: auto;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
	}

	.overlay-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border, #e5e7eb);
	}

	.overlay-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-foreground, #1f2937);
	}

	.overlay-close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.375rem;
		border-radius: 0.5rem;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.overlay-close-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.overlay-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.overlay-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--color-background, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 0.875rem;
		color: var(--color-foreground, #1f2937);
		text-align: left;
		width: 100%;
	}

	.overlay-item:hover {
		background: hsl(var(--color-muted));
		border-color: hsl(var(--color-primary));
	}

	.overlay-item.active {
		background: hsl(var(--color-primary) / 0.1);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.item-icon {
		font-size: 1.125rem;
		width: 1.5rem;
		text-align: center;
		flex-shrink: 0;
	}

	.item-label {
		flex: 1;
	}

	.item-check {
		font-weight: 600;
		color: hsl(var(--color-success, 142 76% 36%));
	}

	.overlay-sep {
		height: 1px;
		background: var(--color-border, #e5e7eb);
		margin: 0.25rem 0;
	}

	@media (max-width: 640px) {
		.overlay-sheet {
			max-width: 100%;
		}
	}
</style>
