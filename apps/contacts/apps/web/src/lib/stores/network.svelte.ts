/**
 * Network Store - Manages network graph state with D3-force simulation
 */

import { browser } from '$app/environment';
import { networkApi } from '$lib/api/network';
import type { NetworkNode, NetworkLink } from '$lib/api/network';
import {
	forceSimulation,
	forceLink,
	forceManyBody,
	forceCenter,
	forceCollide,
	type Simulation,
} from 'd3-force';
import type {
	SimulationNode as SharedSimulationNode,
	SimulationLink as SharedSimulationLink,
} from '@manacore/shared-ui';
import { NetworkGraph } from '@manacore/shared-ui';

// Re-export types from shared-ui for convenience
export type SimulationNode = SharedSimulationNode;
export type SimulationLink = SharedSimulationLink;

// Graph component reference for zoom controls
let graphComponentRef: NetworkGraph | null = null;

// localStorage key for toolbar state
const TOOLBAR_STORAGE_KEY = 'network-toolbar-state';

// Load toolbar state from localStorage
function loadToolbarState(): boolean {
	if (!browser) return true;
	try {
		const stored = localStorage.getItem(TOOLBAR_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.isCollapsed ?? true;
		}
	} catch {
		// Ignore parse errors
	}
	return true;
}

// Save toolbar state to localStorage
function saveToolbarState(isCollapsed: boolean) {
	if (!browser) return;
	try {
		localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify({ isCollapsed }));
	} catch {
		// Ignore storage errors
	}
}

// State
let nodes = $state<SimulationNode[]>([]);
let links = $state<SimulationLink[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let selectedNodeId = $state<string | null>(null);
let simulation: Simulation<SimulationNode, SimulationLink> | null = null;
let searchQuery = $state('');
let filterTagId = $state<string | null>(null);
let filterCompany = $state<string | null>(null);
let minStrength = $state(0);
let tickCounter = $state(0); // Used to trigger reactivity on simulation tick
let simulationInitialized = false;
let dataLoaded = false; // Prevent double loading
let lastDimensions = { width: 0, height: 0 };
let isToolbarCollapsed = $state(loadToolbarState());

// Derived state for filtering
const filteredNodes = $derived.by(() => {
	let result = nodes;

	// Search filter
	if (searchQuery.trim()) {
		const query = searchQuery.toLowerCase();
		result = result.filter(
			(node) =>
				node.name.toLowerCase().includes(query) ||
				node.subtitle?.toLowerCase().includes(query) ||
				node.tags.some((t) => t.name.toLowerCase().includes(query))
		);
	}

	// Tag filter
	if (filterTagId) {
		result = result.filter((node) => node.tags.some((t) => t.id === filterTagId));
	}

	// Company filter (uses subtitle field)
	if (filterCompany) {
		result = result.filter((node) => node.subtitle === filterCompany);
	}

	return result;
});

const filteredLinks = $derived.by(() => {
	const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
	return links.filter((link) => {
		const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
		const targetId = typeof link.target === 'string' ? link.target : link.target.id;
		// Check if both nodes are visible and strength meets minimum
		if (!filteredNodeIds.has(sourceId) || !filteredNodeIds.has(targetId)) {
			return false;
		}
		// Filter by minimum strength
		if (minStrength > 0 && link.strength < minStrength) {
			return false;
		}
		return true;
	});
});

// Get unique companies for filter dropdown (uses subtitle field)
const uniqueCompanies = $derived.by(() => {
	const companies = new Set<string>();
	for (const node of nodes) {
		if (node.subtitle) {
			companies.add(node.subtitle);
		}
	}
	return Array.from(companies).sort();
});

// Get unique tags for filter dropdown
const uniqueTags = $derived.by(() => {
	const tagsMap = new Map<string, { id: string; name: string; color: string | null }>();
	for (const node of nodes) {
		for (const tag of node.tags) {
			if (!tagsMap.has(tag.id)) {
				tagsMap.set(tag.id, tag);
			}
		}
	}
	return Array.from(tagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
});

export const networkStore = {
	// Getters
	get nodes() {
		// Access tickCounter to trigger reactivity on simulation updates
		void tickCounter;
		return filteredNodes;
	},
	get allNodes() {
		void tickCounter;
		return nodes;
	},
	get links() {
		void tickCounter;
		return filteredLinks;
	},
	get allLinks() {
		void tickCounter;
		return links;
	},
	get tick() {
		return tickCounter;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get selectedNodeId() {
		return selectedNodeId;
	},
	get selectedNode() {
		return nodes.find((n) => n.id === selectedNodeId) || null;
	},
	get searchQuery() {
		return searchQuery;
	},
	get filterTagId() {
		return filterTagId;
	},
	get filterCompany() {
		return filterCompany;
	},
	get minStrength() {
		return minStrength;
	},
	get uniqueCompanies() {
		return uniqueCompanies;
	},
	get uniqueTags() {
		return uniqueTags;
	},
	get isToolbarCollapsed() {
		return isToolbarCollapsed;
	},

	/**
	 * Set toolbar collapsed state
	 */
	setToolbarCollapsed(value: boolean) {
		isToolbarCollapsed = value;
		saveToolbarState(value);
	},

	/**
	 * Toggle toolbar collapsed state
	 */
	toggleToolbar() {
		isToolbarCollapsed = !isToolbarCollapsed;
		saveToolbarState(isToolbarCollapsed);
	},

	/**
	 * Register graph component reference for zoom controls
	 */
	setGraphComponent(component: NetworkGraph | null) {
		graphComponentRef = component;
	},

	/**
	 * Zoom in on the graph
	 */
	zoomIn() {
		graphComponentRef?.zoomIn();
	},

	/**
	 * Zoom out on the graph
	 */
	zoomOut() {
		graphComponentRef?.zoomOut();
	},

	/**
	 * Reset zoom to fit all nodes
	 */
	resetZoom() {
		graphComponentRef?.resetZoom();
	},

	/**
	 * Focus on the currently selected node
	 */
	focusOnSelected() {
		graphComponentRef?.focusOnSelectedNode();
	},

	/**
	 * Load network graph data from API
	 */
	async loadGraph(force = false) {
		// Prevent double loading
		if (dataLoaded && !force) {
			console.log('[Network] Data already loaded, skipping');
			return;
		}

		if (loading) {
			console.log('[Network] Already loading, skipping');
			return;
		}

		loading = true;
		error = null;

		// Reset simulation state for fresh data
		if (simulation) {
			simulation.stop();
			simulation = null;
		}
		simulationInitialized = false;

		try {
			const response = await networkApi.getGraph();

			console.log(
				'[Network] Loaded',
				response.nodes.length,
				'nodes and',
				response.links.length,
				'links'
			);

			// Convert to simulation nodes with subtitle for company
			nodes = response.nodes.map((node) => ({
				...node,
				subtitle: node.company, // Map company to subtitle for shared component
				x: undefined,
				y: undefined,
				vx: undefined,
				vy: undefined,
				fx: null,
				fy: null,
			}));

			// Convert to simulation links
			links = response.links.map((link) => ({
				source: link.source,
				target: link.target,
				type: link.type,
				strength: link.strength,
				sharedTags: link.sharedTags,
			}));

			dataLoaded = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load network graph';
			console.error('Failed to load network graph:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Initialize D3 force simulation
	 */
	initSimulation(width: number, height: number) {
		if (!browser) return;
		if (nodes.length === 0) return;
		if (width <= 0 || height <= 0) return;

		// Prevent re-initialization if already running
		if (simulationInitialized && simulation) {
			// Only update center if dimensions changed significantly
			if (
				Math.abs(lastDimensions.width - width) > 50 ||
				Math.abs(lastDimensions.height - height) > 50
			) {
				console.log('[Network] Updating simulation center for new dimensions:', width, 'x', height);
				lastDimensions = { width, height };
				this.updateSimulationCenter(width, height);
			}
			return;
		}

		// Stop existing simulation
		if (simulation) {
			simulation.stop();
		}

		console.log(
			'[Network] Initializing simulation with',
			nodes.length,
			'nodes, dimensions:',
			width,
			'x',
			height
		);
		lastDimensions = { width, height };

		// Initialize node positions spread around the center
		const centerX = width / 2;
		const centerY = height / 2;
		const radius = Math.min(width, height) / 3;

		nodes.forEach((node, i) => {
			// Only set initial position if not already set
			if (node.x === undefined || node.y === undefined) {
				// Spread nodes in a circle initially
				const angle = (i / nodes.length) * 2 * Math.PI;
				const r = radius * (0.5 + Math.random() * 0.5);
				node.x = centerX + r * Math.cos(angle);
				node.y = centerY + r * Math.sin(angle);
			}
		});

		// Create new simulation
		simulation = forceSimulation<SimulationNode, SimulationLink>(nodes)
			.force(
				'link',
				forceLink<SimulationNode, SimulationLink>(links)
					.id((d) => d.id)
					.distance(100) // Fixed distance for cleaner layout
					.strength(0.5)
			)
			.force('charge', forceManyBody().strength(-300))
			.force('center', forceCenter(centerX, centerY))
			.force('collision', forceCollide().radius(50))
			.on('tick', () => {
				// Trigger Svelte reactivity by incrementing counter
				tickCounter++;
			});

		simulationInitialized = true;

		// Run simulation with higher alpha for better initial spread
		simulation.alpha(1).restart();
	},

	/**
	 * Update simulation dimensions (e.g., on window resize)
	 */
	updateSimulationCenter(width: number, height: number) {
		if (simulation) {
			simulation.force('center', forceCenter(width / 2, height / 2));
			simulation.alpha(0.3).restart();
		}
	},

	/**
	 * Stop the simulation
	 */
	stopSimulation() {
		if (simulation) {
			simulation.stop();
			simulation = null;
		}
		simulationInitialized = false;
		// Don't reset dataLoaded here - only reset when navigating away
	},

	/**
	 * Reset the store completely (call when leaving the page)
	 */
	reset() {
		this.stopSimulation();
		nodes = [];
		links = [];
		dataLoaded = false;
		lastDimensions = { width: 0, height: 0 };
		tickCounter = 0;
	},

	/**
	 * Reheat simulation (restart with some energy)
	 */
	reheatSimulation() {
		if (simulation) {
			simulation.alpha(0.3).restart();
		}
	},

	/**
	 * Fix node position (for dragging)
	 */
	fixNode(nodeId: string, x: number, y: number) {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			node.fx = x;
			node.fy = y;
		}
	},

	/**
	 * Release node (after dragging)
	 */
	releaseNode(nodeId: string) {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			node.fx = null;
			node.fy = null;
		}
	},

	/**
	 * Select a node
	 */
	selectNode(nodeId: string | null) {
		selectedNodeId = nodeId;
	},

	/**
	 * Set search query
	 */
	setSearch(query: string) {
		searchQuery = query;
	},

	/**
	 * Set tag filter
	 */
	setFilterTag(tagId: string | null) {
		filterTagId = tagId;
	},

	/**
	 * Set company filter
	 */
	setFilterCompany(company: string | null) {
		filterCompany = company;
	},

	/**
	 * Set minimum strength filter
	 */
	setMinStrength(strength: number) {
		minStrength = strength;
	},

	/**
	 * Clear all filters
	 */
	clearFilters() {
		searchQuery = '';
		filterTagId = null;
		filterCompany = null;
		minStrength = 0;
	},

	/**
	 * Get connected nodes for a given node
	 */
	getConnectedNodes(nodeId: string): SimulationNode[] {
		const connectedIds = new Set<string>();

		for (const link of links) {
			const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
			const targetId = typeof link.target === 'string' ? link.target : link.target.id;

			if (sourceId === nodeId) {
				connectedIds.add(targetId);
			} else if (targetId === nodeId) {
				connectedIds.add(sourceId);
			}
		}

		return nodes.filter((n) => connectedIds.has(n.id));
	},

	/**
	 * Get links for a given node
	 */
	getNodeLinks(nodeId: string): SimulationLink[] {
		return links.filter((link) => {
			const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
			const targetId = typeof link.target === 'string' ? link.target : link.target.id;
			return sourceId === nodeId || targetId === nodeId;
		});
	},
};
