<script lang="ts">
	import { Search, ZoomIn, ZoomOut, RotateCcw, Filter, X, Focus, Keyboard } from 'lucide-svelte';
	import type { NetworkTag } from './network.types';

	interface Props {
		searchQuery?: string;
		tags?: NetworkTag[];
		selectedTagId?: string | null;
		subtitles?: string[];
		selectedSubtitle?: string | null;
		subtitleLabel?: string;
		nodeCount?: number;
		linkCount?: number;
		nodeLabel?: string;
		linkLabel?: string;
		searchPlaceholder?: string;
		minStrength?: number;
		showSearch?: boolean;
		onSearch?: (query: string) => void;
		onTagFilter?: (tagId: string | null) => void;
		onSubtitleFilter?: (subtitle: string | null) => void;
		onStrengthFilter?: (minStrength: number) => void;
		onZoomIn?: () => void;
		onZoomOut?: () => void;
		onResetZoom?: () => void;
		onFocusSelected?: () => void;
		onClearFilters?: () => void;
	}

	let {
		searchQuery = '',
		tags = [],
		selectedTagId = null,
		subtitles = [],
		selectedSubtitle = null,
		subtitleLabel = 'Filter',
		nodeCount = 0,
		linkCount = 0,
		nodeLabel = 'Elemente',
		linkLabel = 'Verbindungen',
		searchPlaceholder = 'Suchen...',
		minStrength = 0,
		showSearch = true,
		onSearch,
		onTagFilter,
		onSubtitleFilter,
		onStrengthFilter,
		onZoomIn,
		onZoomOut,
		onResetZoom,
		onFocusSelected,
		onClearFilters,
	}: Props = $props();

	let searchInput = $state(searchQuery);
	let showFilters = $state(false);
	let showKeyboardHelp = $state(false);
	let strengthValue = $state(minStrength);
	// svelte-ignore non_reactive_update - Element reference doesn't need reactivity
	let searchInputElement: HTMLInputElement;

	// Sync searchInput with external searchQuery
	$effect(() => {
		searchInput = searchQuery;
	});

	// Sync strength with external minStrength
	$effect(() => {
		strengthValue = minStrength;
	});

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchInput = target.value;
		onSearch?.(target.value);
	}

	function clearSearch() {
		searchInput = '';
		onSearch?.('');
	}

	function handleTagChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onTagFilter?.(target.value || null);
	}

	function handleSubtitleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onSubtitleFilter?.(target.value || null);
	}

	function clearAllFilters() {
		searchInput = '';
		strengthValue = 0;
		onClearFilters?.();
	}

	function handleStrengthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		strengthValue = parseInt(target.value, 10);
		onStrengthFilter?.(strengthValue);
	}

	function focusSearch() {
		searchInputElement?.focus();
	}

	const hasActiveFilters = $derived(
		searchQuery || selectedTagId || selectedSubtitle || minStrength > 0
	);

	// Keyboard shortcuts info
	const keyboardShortcuts = [
		{ key: '+/-', description: 'Zoom in/out' },
		{ key: '0', description: 'Reset zoom' },
		{ key: 'F', description: 'Fokus auf Auswahl' },
		{ key: '/', description: 'Suche fokussieren' },
		{ key: 'Esc', description: 'Auswahl aufheben' },
	];

	// Export focus function for parent
	export { focusSearch };
</script>

<div class="network-controls">
	<!-- Search bar -->
	{#if showSearch}
		<div class="search-container">
			<Search size={18} class="search-icon" />
			<input
				bind:this={searchInputElement}
				type="text"
				placeholder={searchPlaceholder}
				value={searchInput}
				oninput={handleSearchInput}
				class="search-input"
			/>
			{#if searchInput}
				<button onclick={clearSearch} class="clear-btn" aria-label="Suche löschen">
					<X size={16} />
				</button>
			{/if}
		</div>
	{/if}

	<!-- Filter toggle -->
	{#if tags.length > 0 || subtitles.length > 0}
		<button
			onclick={() => (showFilters = !showFilters)}
			class="control-btn"
			class:active={showFilters || hasActiveFilters}
			aria-label="Filter anzeigen"
			title="Filter"
		>
			<Filter size={18} />
			{#if hasActiveFilters}
				<span class="filter-badge"></span>
			{/if}
		</button>
	{/if}

	<!-- Zoom controls -->
	<div class="zoom-controls">
		<button onclick={onZoomIn} class="control-btn" aria-label="Vergrößern" title="Vergrößern (+)">
			<ZoomIn size={18} />
		</button>
		<button
			onclick={onZoomOut}
			class="control-btn"
			aria-label="Verkleinern"
			title="Verkleinern (-)"
		>
			<ZoomOut size={18} />
		</button>
		<button
			onclick={onResetZoom}
			class="control-btn"
			aria-label="Ansicht zurücksetzen"
			title="Zurücksetzen (0)"
		>
			<RotateCcw size={18} />
		</button>
		<button
			onclick={onFocusSelected}
			class="control-btn"
			aria-label="Auf Auswahl fokussieren"
			title="Fokus auf Auswahl (F)"
		>
			<Focus size={18} />
		</button>
	</div>

	<!-- Keyboard help toggle -->
	<button
		onclick={() => (showKeyboardHelp = !showKeyboardHelp)}
		class="control-btn"
		class:active={showKeyboardHelp}
		aria-label="Tastaturkürzel anzeigen"
		title="Tastaturkürzel"
	>
		<Keyboard size={18} />
	</button>

	<!-- Stats -->
	<div class="stats">
		<span class="stat">
			{nodeCount}
			{nodeLabel}
		</span>
		<span class="stat-divider">•</span>
		<span class="stat">
			{linkCount}
			{linkLabel}
		</span>
	</div>
</div>

<!-- Keyboard shortcuts help -->
{#if showKeyboardHelp}
	<div class="keyboard-help">
		<div class="keyboard-help-title">Tastaturkürzel</div>
		<div class="keyboard-shortcuts">
			{#each keyboardShortcuts as shortcut}
				<div class="shortcut">
					<kbd class="shortcut-key">{shortcut.key}</kbd>
					<span class="shortcut-desc">{shortcut.description}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Filter panel -->
{#if showFilters}
	<div class="filter-panel">
		<div class="filter-row">
			<!-- Tag filter -->
			{#if tags.length > 0}
				<div class="filter-group">
					<label for="tag-filter" class="filter-label">Tag</label>
					<select
						id="tag-filter"
						onchange={handleTagChange}
						value={selectedTagId || ''}
						class="filter-select"
					>
						<option value="">Alle Tags</option>
						{#each tags as tag}
							<option value={tag.id}>
								{tag.name}
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Subtitle filter (e.g., Company, Project) -->
			{#if subtitles.length > 0}
				<div class="filter-group">
					<label for="subtitle-filter" class="filter-label">{subtitleLabel}</label>
					<select
						id="subtitle-filter"
						onchange={handleSubtitleChange}
						value={selectedSubtitle || ''}
						class="filter-select"
					>
						<option value="">Alle</option>
						{#each subtitles as subtitle}
							<option value={subtitle}>
								{subtitle}
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Strength filter slider -->
			<div class="filter-group strength-group">
				<label for="strength-filter" class="filter-label">
					Min. Stärke: {strengthValue}%
				</label>
				<input
					id="strength-filter"
					type="range"
					min="0"
					max="100"
					step="10"
					value={strengthValue}
					oninput={handleStrengthChange}
					class="strength-slider"
				/>
			</div>

			<!-- Clear filters button -->
			{#if hasActiveFilters}
				<button onclick={clearAllFilters} class="clear-filters-btn">
					<X size={14} />
					Filter löschen
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.network-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--card) / 0.8);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 9999px;
		flex-wrap: wrap;
	}

	.search-container {
		position: relative;
		flex: 1;
		min-width: 200px;
		max-width: 300px;
	}

	.search-container :global(.search-icon) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: hsl(var(--muted-foreground));
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 2rem 0.5rem 2.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.1);
	}

	.search-input::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.clear-btn {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		padding: 0.25rem;
		background: none;
		border: none;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-btn:hover {
		color: hsl(var(--foreground));
		background: hsl(var(--muted));
	}

	.control-btn {
		position: relative;
		padding: 0.5rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.control-btn:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.control-btn.active {
		background: hsl(var(--primary) / 0.1);
		border-color: hsl(var(--primary));
		color: hsl(var(--primary));
	}

	.filter-badge {
		position: absolute;
		top: -2px;
		right: -2px;
		width: 8px;
		height: 8px;
		background: hsl(var(--primary));
		border-radius: 50%;
	}

	.zoom-controls {
		display: flex;
		gap: 0.25rem;
		padding-left: 0.5rem;
		border-left: 1px solid hsl(var(--border));
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.stat-divider {
		opacity: 0.5;
	}

	/* Filter panel */
	.filter-panel {
		margin-top: 0.5rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--card) / 0.8);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 1rem;
	}

	.filter-row {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 150px;
	}

	.filter-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.filter-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		cursor: pointer;
	}

	.filter-select:focus {
		outline: none;
		border-color: hsl(var(--primary));
	}

	.clear-filters-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: hsl(var(--destructive) / 0.1);
		border: 1px solid hsl(var(--destructive) / 0.2);
		border-radius: 0.5rem;
		color: hsl(var(--destructive));
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.clear-filters-btn:hover {
		background: hsl(var(--destructive) / 0.15);
	}

	/* Strength slider */
	.strength-group {
		min-width: 180px;
	}

	.strength-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: hsl(var(--muted));
		appearance: none;
		cursor: pointer;
	}

	.strength-slider::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
		transition: transform 0.1s;
	}

	.strength-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.strength-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border: none;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
	}

	/* Keyboard help panel */
	.keyboard-help {
		margin-top: 0.5rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--card) / 0.8);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 1rem;
	}

	.keyboard-help-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.keyboard-shortcuts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.shortcut {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.shortcut-key {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.75rem;
		padding: 0.25rem 0.5rem;
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		font-family: monospace;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.shortcut-desc {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	@media (max-width: 640px) {
		.network-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.search-container {
			max-width: none;
		}

		.zoom-controls {
			padding-left: 0;
			border-left: none;
			justify-content: center;
		}

		.stats {
			justify-content: center;
			margin-left: 0;
		}
	}
</style>
