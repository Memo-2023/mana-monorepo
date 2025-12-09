<script lang="ts">
	import { networkStore } from '$lib/stores/network.svelte';
	import { Search, ZoomIn, ZoomOut, RotateCcw, Filter, X } from 'lucide-svelte';

	interface Props {
		onZoomIn: () => void;
		onZoomOut: () => void;
		onResetZoom: () => void;
	}

	let { onZoomIn, onZoomOut, onResetZoom }: Props = $props();

	let searchInput = $state(networkStore.searchQuery);
	let showFilters = $state(false);

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchInput = target.value;
		networkStore.setSearch(target.value);
	}

	function clearSearch() {
		searchInput = '';
		networkStore.setSearch('');
	}

	function handleTagChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		networkStore.setFilterTag(target.value || null);
	}

	function handleCompanyChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		networkStore.setFilterCompany(target.value || null);
	}

	function clearAllFilters() {
		searchInput = '';
		networkStore.clearFilters();
	}

	const hasActiveFilters = $derived(
		networkStore.searchQuery || networkStore.filterTagId || networkStore.filterCompany
	);
</script>

<div class="network-controls">
	<!-- Search bar -->
	<div class="search-container">
		<Search size={18} class="search-icon" />
		<input
			type="text"
			placeholder="Kontakt suchen..."
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

	<!-- Filter toggle -->
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

	<!-- Zoom controls -->
	<div class="zoom-controls">
		<button onclick={onZoomIn} class="control-btn" aria-label="Vergrößern" title="Vergrößern">
			<ZoomIn size={18} />
		</button>
		<button onclick={onZoomOut} class="control-btn" aria-label="Verkleinern" title="Verkleinern">
			<ZoomOut size={18} />
		</button>
		<button
			onclick={onResetZoom}
			class="control-btn"
			aria-label="Ansicht zurücksetzen"
			title="Zurücksetzen"
		>
			<RotateCcw size={18} />
		</button>
	</div>

	<!-- Stats -->
	<div class="stats">
		<span class="stat">
			{networkStore.nodes.length} Kontakte
		</span>
		<span class="stat-divider">•</span>
		<span class="stat">
			{networkStore.links.length} Verbindungen
		</span>
	</div>
</div>

<!-- Filter panel -->
{#if showFilters}
	<div class="filter-panel">
		<div class="filter-row">
			<!-- Tag filter -->
			<div class="filter-group">
				<label for="tag-filter" class="filter-label">Tag</label>
				<select
					id="tag-filter"
					onchange={handleTagChange}
					value={networkStore.filterTagId || ''}
					class="filter-select"
				>
					<option value="">Alle Tags</option>
					{#each networkStore.uniqueTags as tag}
						<option value={tag.id}>
							{tag.name}
						</option>
					{/each}
				</select>
			</div>

			<!-- Company filter -->
			<div class="filter-group">
				<label for="company-filter" class="filter-label">Firma</label>
				<select
					id="company-filter"
					onchange={handleCompanyChange}
					value={networkStore.filterCompany || ''}
					class="filter-select"
				>
					<option value="">Alle Firmen</option>
					{#each networkStore.uniqueCompanies as company}
						<option value={company}>
							{company}
						</option>
					{/each}
				</select>
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
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
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
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
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
