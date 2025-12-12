<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { networkStore, type SimulationNode } from '$lib/stores/network.svelte';
	import { NetworkGraph, NetworkControls } from '@manacore/shared-ui';
	import '$lib/i18n';

	let graphComponent = $state<NetworkGraph | null>(null);
	let controlsComponent: NetworkControls;
	let graphContainer: HTMLDivElement;

	function handleNodeClick(node: SimulationNode) {
		// Select node (highlight connections)
		networkStore.selectNode(node.id);
	}

	function handleNodeDoubleClick(node: SimulationNode) {
		// Navigate to event detail page
		goto(`/event/${node.id}`);
	}

	function handleBackgroundClick() {
		networkStore.selectNode(null);
	}

	function handleDragStart(node: SimulationNode) {
		networkStore.fixNode(node.id, node.x ?? 0, node.y ?? 0);
		networkStore.reheatSimulation();
	}

	function handleDrag(node: SimulationNode, x: number, y: number) {
		networkStore.fixNode(node.id, x, y);
	}

	function handleDragEnd(node: SimulationNode) {
		networkStore.releaseNode(node.id);
	}

	function handleZoomIn() {
		graphComponent?.zoomIn();
	}

	function handleZoomOut() {
		graphComponent?.zoomOut();
	}

	function handleResetZoom() {
		graphComponent?.resetZoom();
	}

	function handleFocusSelected() {
		graphComponent?.focusOnSelectedNode();
	}

	function handleFocusSearch() {
		controlsComponent?.focusSearch();
	}

	function handleSearch(query: string) {
		networkStore.setSearch(query);
	}

	function handleTagFilter(tagId: string | null) {
		networkStore.setFilterTag(tagId);
	}

	function handleSubtitleFilter(location: string | null) {
		networkStore.setFilterLocation(location);
	}

	function handleStrengthFilter(strength: number) {
		networkStore.setMinStrength(strength);
	}

	function handleClearFilters() {
		networkStore.clearFilters();
	}

	// Initialize simulation when data is loaded and container is ready
	$effect(() => {
		if (!networkStore.loading && networkStore.allNodes.length > 0 && graphContainer) {
			const rect = graphContainer.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				networkStore.initSimulation(rect.width, rect.height);
			}
		}
	});

	onMount(() => {
		networkStore.loadGraph();
	});

	onDestroy(() => {
		networkStore.stopSimulation();
	});
</script>

<svelte:head>
	<title>Netzwerk - Kalender</title>
</svelte:head>

<div class="network-page">
	<!-- Controls (floating) -->
	<div class="controls-wrapper">
		<NetworkControls
			bind:this={controlsComponent}
			searchQuery={networkStore.searchQuery}
			tags={networkStore.uniqueTags}
			selectedTagId={networkStore.filterTagId}
			subtitles={networkStore.uniqueLocations}
			selectedSubtitle={networkStore.filterLocation}
			subtitleLabel="Ort"
			nodeCount={networkStore.nodes.length}
			linkCount={networkStore.links.length}
			nodeLabel="Events"
			linkLabel="Verbindungen"
			searchPlaceholder="Event suchen..."
			minStrength={networkStore.minStrength}
			onSearch={handleSearch}
			onTagFilter={handleTagFilter}
			onSubtitleFilter={handleSubtitleFilter}
			onStrengthFilter={handleStrengthFilter}
			onZoomIn={handleZoomIn}
			onZoomOut={handleZoomOut}
			onResetZoom={handleResetZoom}
			onFocusSelected={handleFocusSelected}
			onClearFilters={handleClearFilters}
		/>
	</div>

	<!-- Error Banner -->
	{#if networkStore.error}
		<div class="error-banner" role="alert">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<span>{networkStore.error}</span>
		</div>
	{/if}

	<!-- Main Content -->
	<div class="graph-container" bind:this={graphContainer}>
		{#if networkStore.loading}
			<div class="loading-container">
				<div class="loading-spinner"></div>
				<p>Lade Netzwerk-Graph...</p>
			</div>
		{:else}
			<NetworkGraph
				bind:this={graphComponent}
				nodes={networkStore.nodes}
				links={networkStore.links}
				selectedNodeId={networkStore.selectedNodeId}
				onNodeClick={handleNodeClick}
				onNodeDoubleClick={handleNodeDoubleClick}
				onBackgroundClick={handleBackgroundClick}
				onDragStart={handleDragStart}
				onDrag={handleDrag}
				onDragEnd={handleDragEnd}
				onFocusSearch={handleFocusSearch}
			/>
		{/if}
	</div>

	<!-- Selected Event Info Panel -->
	{#if networkStore.selectedNode}
		<div class="info-panel">
			<div class="info-header">
				<h3>{networkStore.selectedNode.name}</h3>
				<button
					class="close-btn"
					onclick={() => networkStore.selectNode(null)}
					aria-label="Schließen"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			{#if networkStore.selectedNode.subtitle}
				<p class="info-subtitle">{networkStore.selectedNode.subtitle}</p>
			{/if}
			{#if networkStore.selectedNode.tags.length > 0}
				<div class="info-tags">
					{#each networkStore.selectedNode.tags as tag}
						<span
							class="tag"
							style="background-color: {tag.color || 'hsl(var(--muted))'}; color: white;"
						>
							{tag.name}
						</span>
					{/each}
				</div>
			{/if}
			<div class="info-stats">
				<span>{networkStore.selectedNode.connectionCount} Verbindungen</span>
			</div>
			<button class="view-btn" onclick={() => goto(`/event/${networkStore.selectedNode?.id}`)}>
				Event anzeigen
			</button>
		</div>
	{/if}
</div>

<style>
	.network-page {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
	}

	/* Floating Controls */
	.controls-wrapper {
		position: absolute;
		top: 5rem; /* Below the nav */
		left: 1rem;
		z-index: 10;
		max-width: calc(100% - 2rem);
	}

	/* Error Banner */
	.error-banner {
		position: absolute;
		top: 5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: hsl(var(--destructive) / 0.1);
		border: 1px solid hsl(var(--destructive) / 0.3);
		border-radius: 0.875rem;
		color: hsl(var(--destructive));
		backdrop-filter: blur(8px);
	}

	/* Graph Container - Full screen */
	.graph-container {
		flex: 1;
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
	}

	/* Loading */
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		color: hsl(var(--muted-foreground));
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid hsl(var(--muted));
		border-top-color: hsl(var(--primary));
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Info Panel */
	.info-panel {
		position: fixed;
		top: 5rem;
		right: 1rem;
		bottom: 1rem;
		width: 320px;
		max-width: calc(100vw - 2rem);
		z-index: 50;
		background: hsl(var(--card) / 0.9);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 1rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		animation: slideInRight 0.2s ease-out;
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.info-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.info-header h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.close-btn {
		padding: 0.25rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: hsl(var(--muted-foreground));
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.info-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.info-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.info-stats {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.view-btn {
		margin-top: auto;
		padding: 0.75rem 1rem;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		border-radius: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.view-btn:hover {
		opacity: 0.9;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.info-panel {
			width: 100%;
			max-width: 100%;
			top: auto;
			right: 0;
			bottom: 0;
			height: auto;
			max-height: 50vh;
			border-radius: 1rem 1rem 0 0;
			animation: slideInUp 0.2s ease-out;
		}

		@keyframes slideInUp {
			from {
				opacity: 0;
				transform: translateY(20px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}

	@media (max-width: 768px) {
		.controls-wrapper {
			top: 6rem;
			width: calc(100% - 1rem);
			max-width: none;
		}
	}
</style>
