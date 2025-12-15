<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		networkStore,
		type SimulationNode,
		type SimulationLink,
	} from '$lib/stores/network.svelte';
	import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
	import { select } from 'd3-selection';

	interface Props {
		width?: number;
		height?: number;
		onNodeClick?: (node: SimulationNode) => void;
	}

	let { width = 800, height = 600, onNodeClick }: Props = $props();

	let svgElement: SVGSVGElement;
	let containerElement: HTMLDivElement;
	let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null;
	let transform = $state({ x: 0, y: 0, k: 1 });
	let draggedNode: SimulationNode | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let hasInitialized = $state(false);
	let initTimeoutId: ReturnType<typeof setTimeout> | null = null;

	// Initialize simulation ONCE when nodes are loaded AND dimensions are stable
	function tryInitialize() {
		const nodeCount = networkStore.allNodes.length;
		if (!hasInitialized && nodeCount > 0 && containerWidth > 100 && containerHeight > 100) {
			console.log(
				'[NetworkGraph] Initializing with dimensions:',
				containerWidth,
				'x',
				containerHeight
			);
			hasInitialized = true;
			networkStore.initSimulation(containerWidth, containerHeight);
		}
	}

	// Try to initialize when nodes become available
	$effect(() => {
		const nodeCount = networkStore.allNodes.length;
		if (nodeCount > 0 && containerWidth > 100 && containerHeight > 100) {
			tryInitialize();
		}
	});

	// Get nodes and links (these will update on each tick)
	const graphNodes = $derived(networkStore.nodes);
	const graphLinks = $derived(networkStore.links);

	// Setup zoom behavior
	$effect(() => {
		if (svgElement) {
			zoomBehavior = zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.1, 4])
				.on('zoom', (event) => {
					transform = {
						x: event.transform.x,
						y: event.transform.y,
						k: event.transform.k,
					};
				});

			select(svgElement).call(zoomBehavior);
		}
	});

	onMount(() => {
		// Setup resize observer - wait for stable dimensions before initializing
		if (containerElement) {
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const newWidth = entry.contentRect.width;
					const newHeight = entry.contentRect.height;

					if (newWidth > 100 && newHeight > 100) {
						containerWidth = newWidth;
						containerHeight = newHeight;

						// Debounce initialization to wait for layout to stabilize
						if (!hasInitialized) {
							if (initTimeoutId) clearTimeout(initTimeoutId);
							initTimeoutId = setTimeout(() => {
								console.log(
									'[NetworkGraph] Stable dimensions:',
									containerWidth,
									'x',
									containerHeight
								);
								tryInitialize();
							}, 100);
						}
					}
				}
			});
			resizeObserver.observe(containerElement);
		}
	});

	onDestroy(() => {
		if (initTimeoutId) clearTimeout(initTimeoutId);
		networkStore.reset();
		resizeObserver?.disconnect();
	});

	function handleNodeClick(node: SimulationNode) {
		networkStore.selectNode(node.id);
		onNodeClick?.(node);
	}

	function handleNodeDoubleClick(node: SimulationNode) {
		// Navigate to contact detail
		goto(`/contacts/${node.id}`);
	}

	function handleDragStart(event: MouseEvent, node: SimulationNode) {
		event.stopPropagation();
		draggedNode = node;
		networkStore.fixNode(node.id, node.x ?? 0, node.y ?? 0);
		networkStore.reheatSimulation();
	}

	function handleDrag(event: MouseEvent) {
		if (!draggedNode) return;

		// Convert screen coordinates to graph coordinates
		const x = (event.clientX - svgElement.getBoundingClientRect().left - transform.x) / transform.k;
		const y = (event.clientY - svgElement.getBoundingClientRect().top - transform.y) / transform.k;

		networkStore.fixNode(draggedNode.id, x, y);
	}

	function handleDragEnd() {
		if (draggedNode) {
			networkStore.releaseNode(draggedNode.id);
			draggedNode = null;
		}
	}

	function resetZoom() {
		if (svgElement && zoomBehavior) {
			select(svgElement).transition().duration(300).call(zoomBehavior.transform, zoomIdentity);
		}
	}

	function zoomIn() {
		if (svgElement && zoomBehavior) {
			select(svgElement).transition().duration(200).call(zoomBehavior.scaleBy, 1.3);
		}
	}

	function zoomOut() {
		if (svgElement && zoomBehavior) {
			select(svgElement).transition().duration(200).call(zoomBehavior.scaleBy, 0.7);
		}
	}

	// Helper to get node initials
	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	// Helper to generate consistent color from string
	function stringToColor(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue = hash % 360;
		return `hsl(${hue}, 70%, 50%)`;
	}

	// Get link coordinates
	function getLinkCoords(link: SimulationLink) {
		const source = link.source as SimulationNode;
		const target = link.target as SimulationNode;
		return {
			x1: source.x ?? 0,
			y1: source.y ?? 0,
			x2: target.x ?? 0,
			y2: target.y ?? 0,
		};
	}

	// Check if a node is connected to selected node
	function isConnectedToSelected(nodeId: string, links: typeof graphLinks): boolean {
		if (!networkStore.selectedNodeId) return false;
		if (nodeId === networkStore.selectedNodeId) return true;

		return links.some((link) => {
			const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
			const targetId = typeof link.target === 'string' ? link.target : link.target.id;
			return (
				(sourceId === networkStore.selectedNodeId && targetId === nodeId) ||
				(targetId === networkStore.selectedNodeId && sourceId === nodeId)
			);
		});
	}

	// Export zoom functions for parent component
	export { resetZoom, zoomIn, zoomOut };
</script>

<div
	bind:this={containerElement}
	class="network-graph-container"
	onmousemove={handleDrag}
	onmouseup={handleDragEnd}
	onmouseleave={handleDragEnd}
	role="application"
	aria-label="Kontakt-Netzwerk Graph"
>
	<svg bind:this={svgElement} class="network-graph-svg" style="width: 100%; height: 100%;">
		<g transform="translate({transform.x}, {transform.y}) scale({transform.k})">
			<!-- Links -->
			<g class="links">
				{#each graphLinks as link}
					{@const coords = getLinkCoords(link)}
					{@const sourceId = typeof link.source === 'string' ? link.source : link.source.id}
					{@const targetId = typeof link.target === 'string' ? link.target : link.target.id}
					{@const isHighlighted =
						networkStore.selectedNodeId &&
						(sourceId === networkStore.selectedNodeId || targetId === networkStore.selectedNodeId)}
					<line
						x1={coords.x1}
						y1={coords.y1}
						x2={coords.x2}
						y2={coords.y2}
						stroke-width={Math.max(1, link.strength / 25)}
						class="link"
						class:highlighted={isHighlighted}
						class:dimmed={networkStore.selectedNodeId && !isHighlighted}
					>
						<title>{link.sharedTags.join(', ')}</title>
					</line>
				{/each}
			</g>

			<!-- Nodes -->
			<g class="nodes">
				{#each graphNodes as node (node.id)}
					{@const isSelected = node.id === networkStore.selectedNodeId}
					{@const isConnected = isConnectedToSelected(node.id, graphLinks)}
					{@const isDimmed = networkStore.selectedNodeId && !isConnected}
					<g
						transform="translate({node.x ?? 0}, {node.y ?? 0})"
						class="node"
						class:selected={isSelected}
						class:connected={isConnected && !isSelected}
						class:dimmed={isDimmed}
						onmousedown={(e) => handleDragStart(e, node)}
						onclick={() => handleNodeClick(node)}
						ondblclick={() => handleNodeDoubleClick(node)}
						role="button"
						tabindex="0"
						aria-label={node.name}
					>
						<!-- Node circle -->
						<circle r={isSelected ? 28 : 24} fill={stringToColor(node.name)} class="node-circle" />

						<!-- Avatar image or initials -->
						{#if node.photoUrl}
							<clipPath id="clip-{node.id}">
								<circle r={isSelected ? 26 : 22} />
							</clipPath>
							<image
								href={node.photoUrl}
								x={isSelected ? -26 : -22}
								y={isSelected ? -26 : -22}
								width={isSelected ? 52 : 44}
								height={isSelected ? 52 : 44}
								clip-path="url(#clip-{node.id})"
								preserveAspectRatio="xMidYMid slice"
							/>
						{:else}
							<text
								class="node-initials"
								text-anchor="middle"
								dominant-baseline="central"
								fill="white"
								font-size={isSelected ? 14 : 12}
								font-weight="600"
							>
								{getInitials(node.name)}
							</text>
						{/if}

						<!-- Favorite indicator -->
						{#if node.isFavorite}
							<circle
								cx={isSelected ? 20 : 17}
								cy={isSelected ? -20 : -17}
								r="8"
								fill="hsl(var(--background))"
							/>
							<text
								x={isSelected ? 20 : 17}
								y={isSelected ? -20 : -17}
								text-anchor="middle"
								dominant-baseline="central"
								font-size="10"
							>
								⭐
							</text>
						{/if}

						<!-- Connection count badge -->
						{#if node.connectionCount > 0}
							<circle
								cx={isSelected ? -20 : -17}
								cy={isSelected ? -20 : -17}
								r="10"
								fill="hsl(var(--primary))"
							/>
							<text
								x={isSelected ? -20 : -17}
								y={isSelected ? -20 : -17}
								text-anchor="middle"
								dominant-baseline="central"
								fill="white"
								font-size="9"
								font-weight="600"
							>
								{node.connectionCount}
							</text>
						{/if}

						<!-- Node label -->
						<text
							y={isSelected ? 42 : 38}
							class="node-label"
							text-anchor="middle"
							font-size={isSelected ? 13 : 11}
							font-weight={isSelected ? '600' : '500'}
						>
							{node.name}
						</text>

						<!-- Company label (uses subtitle field) -->
						{#if node.subtitle}
							<text
								y={isSelected ? 56 : 50}
								class="node-company"
								text-anchor="middle"
								font-size="9"
							>
								{node.subtitle}
							</text>
						{/if}
					</g>
				{/each}
			</g>
		</g>
	</svg>

	<!-- Empty state -->
	{#if graphNodes.length === 0 && !networkStore.loading}
		<div class="empty-state">
			<div class="empty-icon">🔗</div>
			<p class="empty-title">Keine Verbindungen gefunden</p>
			<p class="empty-description">
				Kontakte werden verbunden, wenn sie gemeinsame Tags haben. Füge Tags zu deinen Kontakten
				hinzu, um das Netzwerk zu sehen.
			</p>
		</div>
	{/if}
</div>

<style>
	.network-graph-container {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		background: hsl(var(--background));
	}

	.network-graph-svg {
		display: block;
		cursor: grab;
	}

	.network-graph-svg:active {
		cursor: grabbing;
	}

	/* Links */
	.link {
		stroke: hsl(var(--muted-foreground) / 0.3);
		transition:
			stroke 0.2s,
			stroke-width 0.2s,
			opacity 0.2s;
	}

	.link.highlighted {
		stroke: hsl(var(--primary));
		stroke-width: 3 !important;
	}

	.link.dimmed {
		opacity: 0.1;
	}

	/* Nodes */
	.node {
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.node:hover .node-circle {
		filter: brightness(1.1);
	}

	.node.selected .node-circle {
		stroke: hsl(var(--primary));
		stroke-width: 4;
	}

	.node.connected .node-circle {
		stroke: hsl(var(--primary) / 0.5);
		stroke-width: 2;
	}

	.node.dimmed {
		opacity: 0.3;
	}

	.node-circle {
		transition:
			r 0.2s,
			stroke 0.2s,
			stroke-width 0.2s,
			filter 0.2s;
	}

	.node-initials {
		pointer-events: none;
		user-select: none;
	}

	.node-label {
		fill: hsl(var(--foreground));
		pointer-events: none;
		user-select: none;
	}

	.node-company {
		fill: hsl(var(--muted-foreground));
		pointer-events: none;
		user-select: none;
	}

	/* Empty state */
	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		padding: 2rem;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: hsl(var(--muted-foreground));
		max-width: 300px;
		line-height: 1.5;
	}
</style>
