<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
	import { select, type Selection } from 'd3-selection';
	import 'd3-transition'; // Side-effect import for .transition() method
	import type { SimulationNode, SimulationLink, NetworkTransform } from './network.types';
	import { stringToColor, getInitials, NODE_CONFIG, LABEL_CONFIG } from './constants';

	interface Props {
		nodes: SimulationNode[];
		links: SimulationLink[];
		selectedNodeId?: string | null;
		onNodeClick?: (node: SimulationNode) => void;
		onNodeDoubleClick?: (node: SimulationNode) => void;
		onBackgroundClick?: () => void;
		onDragStart?: (node: SimulationNode) => void;
		onDrag?: (node: SimulationNode, x: number, y: number) => void;
		onDragEnd?: (node: SimulationNode) => void;
		onFocusSearch?: () => void;
	}

	let {
		nodes,
		links,
		selectedNodeId = null,
		onNodeClick,
		onNodeDoubleClick,
		onBackgroundClick,
		onDragStart,
		onDrag,
		onDragEnd,
		onFocusSearch,
	}: Props = $props();

	let svgElement: SVGSVGElement;
	let containerElement: HTMLDivElement;
	let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null;
	let transform = $state<NetworkTransform>({ x: 0, y: 0, k: 1 });
	let draggedNode: SimulationNode | null = null;

	// Tooltip state
	let hoveredLink = $state<SimulationLink | null>(null);
	let tooltipPosition = $state({ x: 0, y: 0 });

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

	function handleNodeClick(node: SimulationNode) {
		onNodeClick?.(node);
	}

	function handleBackgroundClick(event: MouseEvent) {
		if (event.target === svgElement) {
			onBackgroundClick?.();
		}
	}

	function handleNodeDoubleClick(node: SimulationNode) {
		onNodeDoubleClick?.(node);
	}

	function handleDragStart(event: MouseEvent, node: SimulationNode) {
		event.stopPropagation();
		draggedNode = node;
		onDragStart?.(node);
	}

	function handleDrag(event: MouseEvent) {
		if (!draggedNode || !svgElement) return;

		const rect = svgElement.getBoundingClientRect();
		const x = (event.clientX - rect.left - transform.x) / transform.k;
		const y = (event.clientY - rect.top - transform.y) / transform.k;

		onDrag?.(draggedNode, x, y);
	}

	function handleDragEnd() {
		if (draggedNode) {
			onDragEnd?.(draggedNode);
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

	function focusOnSelectedNode() {
		if (!selectedNodeId || !svgElement || !zoomBehavior || !containerElement) return;
		const node = nodes.find((n) => n.id === selectedNodeId);
		if (!node || node.x === undefined || node.y === undefined) return;

		const rect = containerElement.getBoundingClientRect();
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		// Calculate transform to center on node
		const scale = 1.5;
		const x = centerX - node.x * scale;
		const y = centerY - node.y * scale;

		select(svgElement)
			.transition()
			.duration(500)
			.call(zoomBehavior.transform, zoomIdentity.translate(x, y).scale(scale));
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Ignore if typing in an input
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement ||
			event.target instanceof HTMLSelectElement
		) {
			return;
		}

		switch (event.key) {
			case '+':
			case '=':
				event.preventDefault();
				zoomIn();
				break;
			case '-':
			case '_':
				event.preventDefault();
				zoomOut();
				break;
			case '0':
				event.preventDefault();
				resetZoom();
				break;
			case 'Escape':
				event.preventDefault();
				onBackgroundClick?.();
				break;
			case 'f':
			case 'F':
				if (!event.ctrlKey && !event.metaKey) {
					event.preventDefault();
					focusOnSelectedNode();
				}
				break;
			case '/':
				event.preventDefault();
				onFocusSearch?.();
				break;
		}
	}

	// Setup keyboard listener
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
			return () => {
				window.removeEventListener('keydown', handleKeydown);
			};
		}
	});

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

	// Link hover handlers
	function handleLinkMouseEnter(event: MouseEvent, link: SimulationLink) {
		hoveredLink = link;
		updateTooltipPosition(event);
	}

	function handleLinkMouseMove(event: MouseEvent) {
		if (hoveredLink) {
			updateTooltipPosition(event);
		}
	}

	function handleLinkMouseLeave() {
		hoveredLink = null;
	}

	function updateTooltipPosition(event: MouseEvent) {
		if (!containerElement) return;
		const rect = containerElement.getBoundingClientRect();
		tooltipPosition = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
	}

	// Get node names for tooltip
	function getLinkNodeNames(link: SimulationLink): { source: string; target: string } {
		const source =
			typeof link.source === 'string' ? nodes.find((n) => n.id === link.source) : link.source;
		const target =
			typeof link.target === 'string' ? nodes.find((n) => n.id === link.target) : link.target;
		return {
			source: source?.name ?? 'Unknown',
			target: target?.name ?? 'Unknown',
		};
	}

	// Check if a node is connected to selected node
	function isConnectedToSelected(nodeId: string): boolean {
		if (!selectedNodeId) return false;
		if (nodeId === selectedNodeId) return true;

		return links.some((link) => {
			const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
			const targetId = typeof link.target === 'string' ? link.target : link.target.id;
			return (
				(sourceId === selectedNodeId && targetId === nodeId) ||
				(targetId === selectedNodeId && sourceId === nodeId)
			);
		});
	}

	// Export functions for parent component
	export { resetZoom, zoomIn, zoomOut, focusOnSelectedNode };
</script>

<div
	bind:this={containerElement}
	class="network-graph-container"
	onmousemove={handleDrag}
	onmouseup={handleDragEnd}
	onmouseleave={handleDragEnd}
	role="application"
	aria-label="Network Graph"
>
	<svg
		bind:this={svgElement}
		class="network-graph-svg"
		style="width: 100%; height: 100%;"
		onclick={handleBackgroundClick}
	>
		<g transform="translate({transform.x}, {transform.y}) scale({transform.k})">
			<!-- Links -->
			<g class="links">
				{#each links as link}
					{@const coords = getLinkCoords(link)}
					{@const sourceId = typeof link.source === 'string' ? link.source : link.source.id}
					{@const targetId = typeof link.target === 'string' ? link.target : link.target.id}
					{@const isHighlighted =
						selectedNodeId && (sourceId === selectedNodeId || targetId === selectedNodeId)}
					<!-- Invisible wider line for easier hover -->
					<line
						x1={coords.x1}
						y1={coords.y1}
						x2={coords.x2}
						y2={coords.y2}
						stroke="transparent"
						stroke-width="20"
						class="link-hitbox"
						onmouseenter={(e) => handleLinkMouseEnter(e, link)}
						onmousemove={handleLinkMouseMove}
						onmouseleave={handleLinkMouseLeave}
					/>
					<!-- Visible link -->
					<line
						x1={coords.x1}
						y1={coords.y1}
						x2={coords.x2}
						y2={coords.y2}
						stroke-width={Math.max(1, link.strength / 25)}
						class="link"
						class:highlighted={isHighlighted}
						class:dimmed={selectedNodeId && !isHighlighted}
						class:hovered={hoveredLink === link}
						pointer-events="none"
					/>
				{/each}
			</g>

			<!-- Nodes -->
			<g class="nodes">
				{#each nodes as node (node.id)}
					{@const isSelected = node.id === selectedNodeId}
					{@const isConnected = isConnectedToSelected(node.id)}
					{@const isDimmed = selectedNodeId && !isConnected}
					{@const nodeRadius = isSelected ? NODE_CONFIG.selectedRadius : NODE_CONFIG.radius}
					{@const avatarRadius = isSelected
						? NODE_CONFIG.selectedAvatarRadius
						: NODE_CONFIG.avatarRadius}
					{@const badgeOffset = isSelected
						? NODE_CONFIG.selectedBadgeOffset
						: NODE_CONFIG.badgeOffset}
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
						<circle r={nodeRadius} fill={stringToColor(node.name)} class="node-circle" />

						<!-- Avatar image or initials -->
						{#if node.photoUrl}
							<clipPath id="clip-{node.id}">
								<circle r={avatarRadius} />
							</clipPath>
							<image
								href={node.photoUrl}
								x={-avatarRadius}
								y={-avatarRadius}
								width={avatarRadius * 2}
								height={avatarRadius * 2}
								clip-path="url(#clip-{node.id})"
								preserveAspectRatio="xMidYMid slice"
							/>
						{:else}
							<text
								class="node-initials"
								text-anchor="middle"
								dominant-baseline="central"
								fill="white"
								font-size={isSelected
									? LABEL_CONFIG.selectedInitialsFontSize
									: LABEL_CONFIG.initialsFontSize}
								font-weight="600"
							>
								{getInitials(node.name)}
							</text>
						{/if}

						<!-- Favorite indicator -->
						{#if node.isFavorite}
							<circle cx={badgeOffset} cy={-badgeOffset} r="10" fill="hsl(var(--background))" />
							<text
								x={badgeOffset}
								y={-badgeOffset}
								text-anchor="middle"
								dominant-baseline="central"
								font-size="12"
							>
								&#11088;
							</text>
						{/if}

						<!-- Connection count badge -->
						{#if node.connectionCount > 0}
							<circle cx={-badgeOffset} cy={-badgeOffset} r="12" fill="hsl(var(--primary))" />
							<text
								x={-badgeOffset}
								y={-badgeOffset}
								text-anchor="middle"
								dominant-baseline="central"
								fill="white"
								font-size="11"
								font-weight="600"
							>
								{node.connectionCount}
							</text>
						{/if}

						<!-- Node label (counter-scaled for zoom independence) -->
						<g transform="scale({1 / transform.k})">
							<text
								y={(isSelected ? LABEL_CONFIG.selectedNameOffset : LABEL_CONFIG.nameOffset) *
									transform.k}
								class="node-label"
								text-anchor="middle"
								font-size={isSelected
									? LABEL_CONFIG.selectedNameFontSize
									: LABEL_CONFIG.nameFontSize}
								font-weight={isSelected ? '600' : '500'}
							>
								{node.name}
							</text>

							<!-- Subtitle label (e.g., company) -->
							{#if node.subtitle}
								{@const labelOffset =
									(isSelected ? LABEL_CONFIG.selectedNameOffset : LABEL_CONFIG.nameOffset) *
									transform.k}
								<text
									y={labelOffset + LABEL_CONFIG.subtitleGap}
									class="node-subtitle"
									text-anchor="middle"
									font-size={LABEL_CONFIG.subtitleFontSize}
								>
									{node.subtitle}
								</text>
							{/if}
						</g>
					</g>
				{/each}
			</g>
		</g>
	</svg>

	<!-- Empty state -->
	{#if nodes.length === 0}
		<div class="empty-state">
			<div class="empty-icon">&#128279;</div>
			<p class="empty-title">Keine Verbindungen gefunden</p>
			<p class="empty-description">Elemente werden verbunden, wenn sie gemeinsame Tags haben.</p>
		</div>
	{/if}

	<!-- Link tooltip -->
	{#if hoveredLink}
		{@const names = getLinkNodeNames(hoveredLink)}
		<div class="link-tooltip" style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;">
			<div class="tooltip-header">
				<span class="tooltip-source">{names.source}</span>
				<span class="tooltip-arrow">↔</span>
				<span class="tooltip-target">{names.target}</span>
			</div>
			<div class="tooltip-strength">
				<span class="strength-label">Stärke:</span>
				<span class="strength-value">{hoveredLink.strength}%</span>
				<div class="strength-bar">
					<div class="strength-fill" style="width: {hoveredLink.strength}%"></div>
				</div>
			</div>
			<div class="tooltip-tags">
				{#each hoveredLink.sharedTags as tag}
					<span class="tooltip-tag">{tag}</span>
				{/each}
			</div>
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

	.link.hovered {
		stroke: hsl(var(--primary));
		stroke-width: 3 !important;
	}

	.link-hitbox {
		cursor: pointer;
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

	.node-subtitle {
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

	/* Link tooltip */
	.link-tooltip {
		position: absolute;
		transform: translate(-50%, -100%) translateY(-12px);
		padding: 0.75rem 1rem;
		background: hsl(var(--popover));
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		box-shadow: 0 4px 12px hsl(var(--foreground) / 0.1);
		pointer-events: none;
		z-index: 100;
		min-width: 200px;
		max-width: 300px;
	}

	.tooltip-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.tooltip-arrow {
		color: hsl(var(--muted-foreground));
	}

	.tooltip-strength {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.625rem;
		font-size: 0.75rem;
	}

	.strength-label {
		color: hsl(var(--muted-foreground));
	}

	.strength-value {
		font-weight: 600;
		color: hsl(var(--primary));
	}

	.strength-bar {
		flex: 1;
		height: 4px;
		background: hsl(var(--muted));
		border-radius: 2px;
		overflow: hidden;
	}

	.strength-fill {
		height: 100%;
		background: hsl(var(--primary));
		border-radius: 2px;
		transition: width 0.2s;
	}

	.tooltip-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.tooltip-tag {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.625rem;
		background: hsl(var(--primary) / 0.1);
		border: 1px solid hsl(var(--primary) / 0.2);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--primary));
	}
</style>
