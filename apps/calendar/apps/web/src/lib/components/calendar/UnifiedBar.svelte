<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import { unifiedBarStore } from '$lib/stores/unified-bar.svelte';
	import { quintOut } from 'svelte/easing';
	import { fly, slide } from 'svelte/transition';

	// Components (not yet integrated — using placeholders)
	// import DateStrip from './DateStrip.svelte';
	// import TagStrip from './TagStrip.svelte';
	// import CalendarToolbar from './CalendarToolbar.svelte';

	// Props
	interface Props {
		// QuickInputBar props
		onSearch?: (query: string) => void;
		onSelect?: (result: any) => void;
		onSearchChange?: (query: string) => void;
		onCreate?: (data: any) => void;
		placeholder?: string;
		emptyText?: string;
		searchingText?: string;
		createText?: string;
		appIcon?: string;
		bottomOffset?: string;
		hasFabRight?: boolean;
		hasFabLeft?: boolean;
		defaultOptions?: any[];

		// DateStrip props
		selectedDate?: Date;
		onDateSelect?: (date: Date) => void;

		// Responsive
		isMobile?: boolean;

		// Calendar toolbar visibility
		showCalendarToolbar?: boolean;
		onToolbarCollapsedChange?: (collapsed: boolean) => void;
	}

	let {
		// QuickInputBar props
		onSearch = () => {},
		onSelect = () => {},
		onSearchChange = () => {},
		onCreate = () => {},
		placeholder = 'Neuer Termin oder suchen...',
		emptyText = 'Keine Termine gefunden',
		searchingText = 'Suche...',
		createText = 'Erstellen',
		appIcon = 'calendar',
		bottomOffset = '70px',
		hasFabRight = false,
		hasFabLeft = false,
		defaultOptions = [],

		// DateStrip props
		onDateSelect = () => {},

		// Responsive
		isMobile = false,

		// Calendar toolbar
		showCalendarToolbar = false,
		onToolbarCollapsedChange = () => {},
	}: Props = $props();

	// Local state for transitions
	let isTransitioning = $state(false);
	let previousMode = $state(unifiedBarStore.mode);

	// Computed values
	let layerZIndices = $derived({
		input: 80,
		date: 85,
		tag: 90,
		toolbar: 95,
		overlay: 110,
	});

	let activeLayers = $derived(() => {
		const layers = [];
		if (unifiedBarStore.showQuickInput) layers.push('input');
		if (unifiedBarStore.showDateStrip) layers.push('date');
		if (unifiedBarStore.showTagStrip) layers.push('tag');
		if (unifiedBarStore.showCalendarToolbar) layers.push('toolbar');
		return layers;
	});

	// Simplified bottom offsets (using fixed values for now)
	let layerBottomOffsets = $derived({
		input: '0px',
		date: '70px',
		tag: '140px',
		toolbar: '280px',
	});

	// Handle mode transitions
	$effect(() => {
		const currentMode = unifiedBarStore.mode;
		if (currentMode !== previousMode) {
			isTransitioning = true;
			setTimeout(() => {
				isTransitioning = false;
			}, unifiedBarStore.settings.barAnimationDuration);
			previousMode = currentMode;
		}
	});

	// Overlay menu handlers
	function handleOverlayToggle() {
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

		// Close overlay after action
		unifiedBarStore.set('overlayMenuOpen', false);
	}

	// Layer activation
	function handleLayerClick(layer: string) {
		unifiedBarStore.setActiveLayer(layer as any);
		if (unifiedBarStore.mode === 'collapsed') {
			unifiedBarStore.setMode('expanded');
		}
	}

	// Context for child components
	onMount(() => {
		setContext('unifiedBarStore', unifiedBarStore);
		setContext('isMobile', isMobile);
	});

	// Transition configurations
	const slideConfig = {
		duration: unifiedBarStore.settings.barAnimationDuration,
		easing: quintOut,
		y: 20,
	};

	const flyConfig = {
		duration: unifiedBarStore.settings.barAnimationDuration,
		easing: quintOut,
		opacity: 0.8,
	};
</script>

<!-- UnifiedBar Container -->
<div
	class="unified-bar-container"
	class:transitioning={isTransitioning}
	style="--animation-duration: {unifiedBarStore.settings.barAnimationDuration}ms;"
>
	<!-- Layer 3: CalendarToolbar -->
	{#if unifiedBarStore.showCalendarToolbar}
		<div
			class="unified-bar-layer toolbar-layer"
			style="z-index: {layerZIndices.toolbar}; bottom: {layerBottomOffsets.toolbar};"
			class:active={unifiedBarStore.activeLayer === 'toolbar'}
			transition:fly={{ ...flyConfig, y: 100 }}
			role="toolbar"
			aria-label="Calendar toolbar"
			onclick={() => handleLayerClick('toolbar')}
		>
			<!-- CalendarToolbar placeholder -->
			<div class="toolbar-placeholder">CalendarToolbar Component</div>
		</div>
	{/if}

	<!-- Layer 2: TagStrip -->
	{#if unifiedBarStore.showTagStrip}
		<div
			class="unified-bar-layer tag-strip-layer"
			style="z-index: {layerZIndices.tag}; bottom: {layerBottomOffsets.tag};"
			class:active={unifiedBarStore.activeLayer === 'tag'}
			transition:fly={{ ...flyConfig, y: 50 }}
			role="toolbar"
			aria-label="Tag filter bar"
			onclick={() => handleLayerClick('tag')}
		>
			<!-- TagStrip placeholder -->
			<div class="tag-strip-placeholder">TagStrip Component</div>
		</div>
	{/if}

	<!-- Layer 1: DateStrip -->
	{#if unifiedBarStore.showDateStrip}
		<div
			class="unified-bar-layer date-strip-layer"
			style="z-index: {layerZIndices.date}; bottom: {layerBottomOffsets.date};"
			class:active={unifiedBarStore.activeLayer === 'date'}
			transition:fly={{ ...flyConfig, y: 30 }}
			role="toolbar"
			aria-label="Date strip"
			onclick={() => handleLayerClick('date')}
		>
			<div class="date-strip-placeholder">DateStrip Component</div>
		</div>
	{/if}

	<!-- Layer 0: QuickInputBar -->
	{#if unifiedBarStore.showQuickInput}
		<div
			class="unified-bar-layer input-layer"
			style="z-index: {layerZIndices.input}; bottom: {layerBottomOffsets.input};"
			class:active={unifiedBarStore.activeLayer === 'input'}
			transition:slide={slideConfig}
			role="toolbar"
			aria-label="Quick input"
			onclick={() => handleLayerClick('input')}
		>
			<div class="input-bar-wrapper">
				<div class="input-bar-row">
					<!-- QuickInputBar placeholder - will be implemented with actual component -->
					<div class="quick-input-placeholder">
						QuickInputBar Component
						<button onmousedown={handleOverlayToggle}>
							{unifiedBarStore.isOverlayOpen ? 'X' : 'Menu'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Overlay Menu -->
	{#if unifiedBarStore.isOverlayOpen}
		<div
			class="unified-bar-overlay"
			style="z-index: {layerZIndices.overlay};"
			transition:fly={{ ...flyConfig, y: 100 }}
			role="dialog"
			aria-modal="true"
			aria-label="Menu"
		>
			<div class="overlay-backdrop" onclick={handleOverlayToggle} />
			<div class="overlay-content">
				<div class="overlay-header">
					<h3>Menü</h3>
					<button class="close-btn" onmousedown={handleOverlayToggle}>
						<span class="icon-x"></span>
					</button>
				</div>

				<div class="overlay-actions">
					<!-- Layer Toggles -->
					<div class="action-group">
						<h4>Ansichten</h4>
						<button
							class="action-btn"
							class:active={unifiedBarStore.showDateStrip}
							onmousedown={() => handleOverlayAction('toggle-date-strip')}
						>
							<span class="icon-calendar"></span>
							Datum-Leiste
							<span class="status">{unifiedBarStore.showDateStrip ? '✓' : ''}</span>
						</button>

						<button
							class="action-btn"
							class:active={unifiedBarStore.showTagStrip}
							onmousedown={() => handleOverlayAction('toggle-tag-strip')}
						>
							<span class="icon-tag"></span>
							Tag-Filter
							<span class="status">{unifiedBarStore.showTagStrip ? '✓' : ''}</span>
						</button>

						<button
							class="action-btn"
							class:active={unifiedBarStore.showCalendarToolbar}
							onmousedown={() => handleOverlayAction('toggle-toolbar')}
						>
							<span class="icon-toolbox"></span>
							Kalender-Toolbar
							<span class="status">{unifiedBarStore.showCalendarToolbar ? '✓' : ''}</span>
						</button>
					</div>

					<!-- Quick Actions -->
					<div class="action-group">
						<h4>Schnellaktionen</h4>
						<button class="action-btn" onmousedown={() => handleOverlayAction('collapse-all')}>
							<span class="icon-minimize"></span>
							Alle einklappen
						</button>

						<button class="action-btn" onmousedown={() => handleOverlayAction('new-event')}>
							<span class="icon-plus"></span>
							Neuer Termin
						</button>

						<button class="action-btn" onmousedown={() => handleOverlayAction('today')}>
							<span class="icon-navigation"></span>
							Heute
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.unified-bar-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
		pointer-events: none;
	}

	.unified-bar-container.transitioning {
		transition: all var(--animation-duration) ease;
	}

	.unified-bar-layer {
		position: absolute;
		left: 0;
		right: 0;
		pointer-events: auto;
		background: color-mix(in srgb, var(--color-surface) 95%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
		transition: all var(--animation-duration) ease;
	}

	.unified-bar-layer.active {
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
		z-index: calc(var(--z-index) + 5) !important;
	}

	.unified-bar-layer:hover {
		background: color-mix(in srgb, var(--color-surface) 98%, transparent);
	}

	.input-layer {
		background: color-mix(in srgb, var(--color-surface) 90%, transparent);
		border-top: 1px solid var(--color-border);
	}

	.input-bar-wrapper {
		position: relative;
		padding: var(--spacing-sm) var(--spacing-md);
	}

	.input-bar-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	/* Overlay Styles */
	.unified-bar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: auto;
		display: flex;
		align-items: flex-end;
	}

	.overlay-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
	}

	.overlay-content {
		position: relative;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-bottom: none;
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: var(--spacing-lg);
		max-width: 100%;
		width: 500px;
		max-height: 70vh;
		overflow-y: auto;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
	}

	.overlay-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-lg);
		padding-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
	}

	.overlay-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: var(--spacing-xs);
		border-radius: var(--radius-md);
		color: var(--color-muted-foreground);
		transition: all var(--transition-fast);
	}

	.close-btn:hover {
		background: var(--color-muted);
		color: var(--color-foreground);
	}

	.overlay-actions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.action-group h4 {
		margin: 0 0 var(--spacing-md) 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		width: 100%;
		padding: var(--spacing-md);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-base);
		font-size: 0.875rem;
		color: var(--color-foreground);
		text-align: left;
	}

	.action-btn:hover {
		background: var(--color-muted);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}

	.action-btn.active {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.action-btn .status {
		margin-left: auto;
		font-weight: 600;
		color: var(--color-success);
	}

	/* Icons (placeholder - replace with actual icon component) */
	.icon-x::before {
		content: '×';
	}
	.icon-calendar::before {
		content: '📅';
	}
	.icon-tag::before {
		content: '🏷️';
	}
	.icon-toolbox::before {
		content: '🔧';
	}
	.icon-minimize::before {
		content: '⬇️';
	}
	.icon-plus::before {
		content: '+';
	}
	.icon-navigation::before {
		content: '🧭';
	}

	/* Placeholder styles */
	.quick-input-placeholder,
	.tag-strip-placeholder,
	.date-strip-placeholder,
	.toolbar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-lg);
		background: var(--color-background);
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		font-weight: 500;
		min-height: 60px;
	}

	.quick-input-placeholder button {
		margin-left: var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.75rem;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.overlay-content {
			width: 100%;
			max-height: 80vh;
			border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		}

		.action-btn {
			padding: var(--spacing-lg);
			font-size: 1rem;
		}

		.quick-input-placeholder,
		.tag-strip-placeholder,
		.date-strip-placeholder,
		.toolbar-placeholder {
			min-height: 50px;
			font-size: 0.75rem;
		}
	}
</style>
