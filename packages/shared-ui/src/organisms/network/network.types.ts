import type { SimulationNodeDatum } from 'd3-force';

/**
 * Tag attached to a network node
 */
export interface NetworkTag {
	id: string;
	name: string;
	color: string | null;
}

/**
 * Base network node interface (before D3 simulation)
 */
export interface NetworkNode {
	id: string;
	name: string;
	photoUrl?: string | null;
	subtitle?: string | null; // e.g., Company, Project, Category
	isFavorite?: boolean;
	tags: NetworkTag[];
	connectionCount: number;
}

/**
 * Network node with D3 simulation properties
 */
export interface SimulationNode extends NetworkNode, SimulationNodeDatum {
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
	fx?: number | null;
	fy?: number | null;
}

/**
 * Network link between nodes
 */
export interface NetworkLink {
	source: string;
	target: string;
	type: 'tag';
	strength: number; // 0-100, based on shared tag count
	sharedTags: string[];
}

/**
 * Network link with D3 simulation properties
 * Note: After D3 simulation runs, source/target become SimulationNode objects
 */
export interface SimulationLink {
	source: string | SimulationNode;
	target: string | SimulationNode;
	type: 'tag';
	strength: number;
	sharedTags: string[];
	index?: number;
}

/**
 * Zoom/pan transform state
 */
export interface NetworkTransform {
	x: number;
	y: number;
	k: number; // scale factor
}

/**
 * Props for NetworkGraph component
 */
export interface NetworkGraphProps {
	nodes: SimulationNode[];
	links: SimulationLink[];
	selectedNodeId?: string | null;
	onNodeClick?: (node: SimulationNode) => void;
	onNodeDoubleClick?: (node: SimulationNode) => void;
	onBackgroundClick?: () => void;
}

/**
 * Props for NetworkControls component
 */
export interface NetworkControlsProps {
	searchQuery?: string;
	tags?: NetworkTag[];
	selectedTagId?: string | null;
	subtitles?: string[]; // e.g., companies, projects
	selectedSubtitle?: string | null;
	subtitleLabel?: string; // e.g., "Firma", "Projekt"
	nodeCount?: number;
	linkCount?: number;
	nodeLabel?: string; // e.g., "Kontakte", "Tasks"
	linkLabel?: string; // e.g., "Verbindungen"
	searchPlaceholder?: string;
	onSearch?: (query: string) => void;
	onTagFilter?: (tagId: string | null) => void;
	onSubtitleFilter?: (subtitle: string | null) => void;
	onZoomIn?: () => void;
	onZoomOut?: () => void;
	onResetZoom?: () => void;
	onClearFilters?: () => void;
}

/**
 * API response structure for network graph
 */
export interface NetworkGraphResponse {
	nodes: NetworkNode[];
	links: NetworkLink[];
}
