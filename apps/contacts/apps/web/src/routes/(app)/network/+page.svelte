<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { networkStore, type SimulationNode } from '$lib/stores/network.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
	import { NetworkGraph, NetworkControls } from '@manacore/shared-ui';
	import ContactDetailModal from '$lib/components/ContactDetailModal.svelte';
	import { NetworkGraphSkeleton } from '$lib/components/skeletons';
	import '$lib/i18n';

	// Sync global search to network store
	$effect(() => {
		networkStore.setSearch(contactsFilterStore.searchQuery);
	});

	let graphComponent: NetworkGraph;
	let controlsComponent: NetworkControls;
	let graphContainer: HTMLDivElement;

	function handleNodeClick(node: SimulationNode) {
		// Select node (highlight connections and show detail sidebar)
		networkStore.selectNode(node.id);
	}

	function handleNodeDoubleClick(node: SimulationNode) {
		// Navigate to contact detail page
		goto(`/contacts/${node.id}`);
	}

	function handleBackgroundClick() {
		networkStore.selectNode(null);
	}

	function handleCloseSidebar() {
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

	function handleSubtitleFilter(company: string | null) {
		networkStore.setFilterCompany(company);
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
	<title>Netzwerk - Contacts</title>
</svelte:head>

<div class="network-page">
	<!-- Controls (floating) -->
	<div class="controls-wrapper">
		<NetworkControls
			bind:this={controlsComponent}
			showSearch={false}
			tags={networkStore.uniqueTags}
			selectedTagId={networkStore.filterTagId}
			subtitles={networkStore.uniqueCompanies}
			selectedSubtitle={networkStore.filterCompany}
			subtitleLabel="Firma"
			nodeCount={networkStore.nodes.length}
			linkCount={networkStore.links.length}
			nodeLabel="Kontakte"
			linkLabel="Verbindungen"
			minStrength={networkStore.minStrength}
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
			<NetworkGraphSkeleton />
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

	<!-- Contact Detail Modal as Sidebar -->
	{#if networkStore.selectedNodeId}
		<div class="modal-sidebar-wrapper">
			<ContactDetailModal contactId={networkStore.selectedNodeId} onClose={handleCloseSidebar} />
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
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
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

	/* Modal Sidebar Wrapper - Override modal positioning */
	.modal-sidebar-wrapper {
		position: fixed;
		top: 5rem; /* Below the pill nav */
		right: 1rem;
		bottom: 1rem;
		width: 400px;
		max-width: calc(100vw - 2rem);
		z-index: 50;
	}

	/* Override the modal styles when inside the sidebar wrapper */
	.modal-sidebar-wrapper :global(.modal-backdrop) {
		position: absolute;
		background: transparent;
		backdrop-filter: none;
		padding: 0;
		align-items: stretch;
		justify-content: flex-end;
	}

	.modal-sidebar-wrapper :global(.modal-container) {
		max-width: 100%;
		width: 100%;
		max-height: 100%;
		height: 100%;
		border-radius: 1rem;
		background: hsl(var(--card) / 0.8);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
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

	/* Responsive */
	@media (max-width: 1024px) {
		.modal-sidebar-wrapper {
			width: 100%;
			max-width: 100%;
			top: auto;
			right: 0;
			bottom: 0;
			height: 70vh;
		}

		.modal-sidebar-wrapper :global(.modal-container) {
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
			top: 1rem;
			width: calc(100% - 2rem);
			max-width: none;
		}
	}
</style>
