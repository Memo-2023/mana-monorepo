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

// Re-export types from shared-ui for convenience
export type SimulationNode = SharedSimulationNode;
export type SimulationLink = SharedSimulationLink;

// State
let nodes = $state<SimulationNode[]>([]);
let links = $state<SimulationLink[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let selectedNodeId = $state<string | null>(null);
let simulation: Simulation<SimulationNode, SimulationLink> | null = null;
let searchQuery = $state('');
let filterTagId = $state<string | null>(null);
let filterLocation = $state<string | null>(null);
let minStrength = $state(0);
let tickCounter = $state(0);
let simulationInitialized = false;
let dataLoaded = false;
let lastDimensions = { width: 0, height: 0 };

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

	// Location filter (uses subtitle field)
	if (filterLocation) {
		result = result.filter((node) => node.subtitle === filterLocation);
	}

	return result;
});

const filteredLinks = $derived.by(() => {
	const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
	return links.filter((link) => {
		const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
		const targetId = typeof link.target === 'string' ? link.target : link.target.id;
		// Check if both nodes are visible
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

// Get unique locations for filter dropdown
const uniqueLocations = $derived.by(() => {
	const locations = new Set<string>();
	for (const node of nodes) {
		if (node.subtitle) {
			locations.add(node.subtitle);
		}
	}
	return Array.from(locations).sort();
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
	get filterLocation() {
		return filterLocation;
	},
	get minStrength() {
		return minStrength;
	},
	get uniqueLocations() {
		return uniqueLocations;
	},
	get uniqueTags() {
		return uniqueTags;
	},

	/**
	 * Load network graph data from API
	 */
	async loadGraph(force = false) {
		if (dataLoaded && !force) {
			return;
		}

		if (loading) {
			return;
		}

		loading = true;
		error = null;

		if (simulation) {
			simulation.stop();
			simulation = null;
		}
		simulationInitialized = false;

		try {
			const response = await networkApi.getGraph();

			// Convert to simulation nodes with subtitle for location
			nodes = response.nodes.map((node) => ({
				...node,
				subtitle: node.company, // Map company/location to subtitle
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

		if (simulationInitialized && simulation) {
			if (
				Math.abs(lastDimensions.width - width) > 50 ||
				Math.abs(lastDimensions.height - height) > 50
			) {
				lastDimensions = { width, height };
				this.updateSimulationCenter(width, height);
			}
			return;
		}

		if (simulation) {
			simulation.stop();
		}

		lastDimensions = { width, height };

		const centerX = width / 2;
		const centerY = height / 2;
		const radius = Math.min(width, height) / 3;

		nodes.forEach((node, i) => {
			if (node.x === undefined || node.y === undefined) {
				const angle = (i / nodes.length) * 2 * Math.PI;
				const r = radius * (0.5 + Math.random() * 0.5);
				node.x = centerX + r * Math.cos(angle);
				node.y = centerY + r * Math.sin(angle);
			}
		});

		simulation = forceSimulation<SimulationNode, SimulationLink>(nodes)
			.force(
				'link',
				forceLink<SimulationNode, SimulationLink>(links)
					.id((d) => d.id)
					.distance(100)
					.strength(0.5)
			)
			.force('charge', forceManyBody().strength(-300))
			.force('center', forceCenter(centerX, centerY))
			.force('collision', forceCollide().radius(50))
			.on('tick', () => {
				tickCounter++;
			});

		simulationInitialized = true;
		simulation.alpha(1).restart();
	},

	updateSimulationCenter(width: number, height: number) {
		if (simulation) {
			simulation.force('center', forceCenter(width / 2, height / 2));
			simulation.alpha(0.3).restart();
		}
	},

	stopSimulation() {
		if (simulation) {
			simulation.stop();
			simulation = null;
		}
		simulationInitialized = false;
	},

	reset() {
		this.stopSimulation();
		nodes = [];
		links = [];
		dataLoaded = false;
		lastDimensions = { width: 0, height: 0 };
		tickCounter = 0;
	},

	reheatSimulation() {
		if (simulation) {
			simulation.alpha(0.3).restart();
		}
	},

	fixNode(nodeId: string, x: number, y: number) {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			node.fx = x;
			node.fy = y;
		}
	},

	releaseNode(nodeId: string) {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			node.fx = null;
			node.fy = null;
		}
	},

	selectNode(nodeId: string | null) {
		selectedNodeId = nodeId;
	},

	setSearch(query: string) {
		searchQuery = query;
	},

	setFilterTag(tagId: string | null) {
		filterTagId = tagId;
	},

	setFilterLocation(location: string | null) {
		filterLocation = location;
	},

	setMinStrength(strength: number) {
		minStrength = strength;
	},

	clearFilters() {
		searchQuery = '';
		filterTagId = null;
		filterLocation = null;
		minStrength = 0;
	},

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

	getNodeLinks(nodeId: string): SimulationLink[] {
		return links.filter((link) => {
			const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
			const targetId = typeof link.target === 'string' ? link.target : link.target.id;
			return sourceId === nodeId || targetId === nodeId;
		});
	},
};
