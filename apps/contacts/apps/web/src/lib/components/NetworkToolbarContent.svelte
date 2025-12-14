<script lang="ts">
	import { ZoomIn, ZoomOut, RotateCcw, Focus, X } from 'lucide-svelte';
	import { networkStore } from '$lib/stores/network.svelte';

	let strengthValue = $state(networkStore.minStrength);

	// Sync strength with store
	$effect(() => {
		strengthValue = networkStore.minStrength;
	});

	function handleTagChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		networkStore.setFilterTag(target.value || null);
	}

	function handleCompanyChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		networkStore.setFilterCompany(target.value || null);
	}

	function handleStrengthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		strengthValue = parseInt(target.value, 10);
		networkStore.setMinStrength(strengthValue);
	}

	function clearAllFilters() {
		strengthValue = 0;
		networkStore.clearFilters();
	}

	const hasActiveFilters = $derived(
		networkStore.filterTagId || networkStore.filterCompany || networkStore.minStrength > 0
	);
</script>

<div class="toolbar-content-inner">
	<!-- Tag Filter -->
	{#if networkStore.uniqueTags.length > 0}
		<div class="filter-group">
			<select
				onchange={handleTagChange}
				value={networkStore.filterTagId || ''}
				class="filter-select"
				title="Tag filtern"
			>
				<option value="">Alle Tags</option>
				{#each networkStore.uniqueTags as tag}
					<option value={tag.id}>{tag.name}</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Company Filter -->
	{#if networkStore.uniqueCompanies.length > 0}
		<div class="filter-group">
			<select
				onchange={handleCompanyChange}
				value={networkStore.filterCompany || ''}
				class="filter-select"
				title="Firma filtern"
			>
				<option value="">Alle Firmen</option>
				{#each networkStore.uniqueCompanies as company}
					<option value={company}>{company}</option>
				{/each}
			</select>
		</div>
	{/if}

	<div class="toolbar-divider"></div>

	<!-- Strength Filter -->
	<div class="strength-group">
		<label for="network-strength-filter" class="strength-label">
			Stärke: {strengthValue}%
		</label>
		<input
			id="network-strength-filter"
			type="range"
			min="0"
			max="100"
			step="10"
			value={strengthValue}
			oninput={handleStrengthChange}
			class="strength-slider"
			title="Mindest-Verbindungsstärke"
		/>
	</div>

	<div class="toolbar-divider"></div>

	<!-- Zoom Controls -->
	<div class="zoom-controls">
		<button
			onclick={() => networkStore.zoomIn()}
			class="control-btn"
			aria-label="Vergrößern"
			title="Vergrößern (+)"
		>
			<ZoomIn size={16} />
		</button>
		<button
			onclick={() => networkStore.zoomOut()}
			class="control-btn"
			aria-label="Verkleinern"
			title="Verkleinern (-)"
		>
			<ZoomOut size={16} />
		</button>
		<button
			onclick={() => networkStore.resetZoom()}
			class="control-btn"
			aria-label="Ansicht zurücksetzen"
			title="Zurücksetzen (0)"
		>
			<RotateCcw size={16} />
		</button>
		<button
			onclick={() => networkStore.focusOnSelected()}
			class="control-btn"
			aria-label="Auf Auswahl fokussieren"
			title="Fokus auf Auswahl (F)"
		>
			<Focus size={16} />
		</button>
	</div>

	<!-- Clear Filters -->
	{#if hasActiveFilters}
		<div class="toolbar-divider"></div>
		<button onclick={clearAllFilters} class="clear-btn" title="Filter löschen">
			<X size={14} />
			<span>Filter löschen</span>
		</button>
	{/if}

	<!-- Stats -->
	<div class="stats">
		<span class="stat">{networkStore.nodes.length} Kontakte</span>
		<span class="stat-divider">•</span>
		<span class="stat">{networkStore.links.length} Verbindungen</span>
	</div>
</div>

<style>
	.toolbar-content-inner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.toolbar-divider {
		width: 1px;
		height: 1.5rem;
		background: hsl(var(--color-border));
		margin: 0 0.25rem;
	}

	.filter-group {
		display: flex;
		align-items: center;
	}

	.filter-select {
		padding: 0.375rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.filter-select:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	.filter-select:hover {
		border-color: hsl(var(--color-muted-foreground));
	}

	.strength-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.strength-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
	}

	.strength-slider {
		width: 80px;
		height: 4px;
		border-radius: 2px;
		background: hsl(var(--color-muted));
		appearance: none;
		cursor: pointer;
	}

	.strength-slider::-webkit-slider-thumb {
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		cursor: pointer;
		transition: transform 0.1s;
	}

	.strength-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.strength-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border: none;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		cursor: pointer;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
	}

	.control-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.control-btn:active {
		transform: scale(0.95);
	}

	.clear-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		background: hsl(var(--destructive) / 0.1);
		border: none;
		border-radius: 0.5rem;
		color: hsl(var(--destructive));
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.clear-btn:hover {
		background: hsl(var(--destructive) / 0.15);
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.stat-divider {
		opacity: 0.5;
	}

	@media (max-width: 640px) {
		.stats {
			display: none;
		}

		.strength-group {
			flex: 1;
			min-width: 120px;
		}

		.strength-slider {
			flex: 1;
		}
	}
</style>
