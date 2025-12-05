import type { ContentNode, NodeKind, ContentData, VisibilityLevel } from '$lib/types/content';
import type { CustomFieldSchema, CustomFieldData } from '$lib/types/customFields';

export interface CreateNodeRequest {
	kind: NodeKind;
	slug: string;
	title: string;
	summary?: string;
	visibility: VisibilityLevel;
	world_slug?: string;
	tags: string[];
	content: ContentData;
	custom_schema?: CustomFieldSchema;
	custom_data?: CustomFieldData;
	image_url?: string;
	generation_prompt?: string;
	generation_model?: string;
	generation_date?: string;
	generation_context?: any;
}

export interface UpdateNodeRequest {
	title?: string;
	slug?: string;
	summary?: string;
	visibility?: VisibilityLevel;
	tags?: string[];
	content?: ContentData;
	custom_schema?: CustomFieldSchema;
	custom_data?: CustomFieldData;
	image_url?: string;
}

export interface NodeFilters {
	kind?: NodeKind;
	world_slug?: string;
	search?: string;
	limit?: number;
	offset?: number;
}

export class NodeService {
	static async create(node: CreateNodeRequest): Promise<ContentNode> {
		const response = await fetch('/api/nodes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(node),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Fehler beim Erstellen');
		}

		return response.json();
	}

	static async update(slug: string, updates: UpdateNodeRequest): Promise<ContentNode> {
		const response = await fetch(`/api/nodes/${slug}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Fehler beim Aktualisieren');
		}

		return response.json();
	}

	static async get(slug: string): Promise<ContentNode> {
		const response = await fetch(`/api/nodes/${slug}`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Node nicht gefunden');
		}

		return response.json();
	}

	static async list(filters: NodeFilters = {}): Promise<ContentNode[]> {
		const params = new URLSearchParams();

		if (filters.kind) params.set('kind', filters.kind);
		if (filters.world_slug) params.set('world_slug', filters.world_slug);
		if (filters.search) params.set('search', filters.search);
		if (filters.limit) params.set('limit', filters.limit.toString());
		if (filters.offset) params.set('offset', filters.offset.toString());

		const response = await fetch(`/api/nodes?${params}`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Fehler beim Laden der Nodes');
		}

		return response.json();
	}

	static async delete(slug: string): Promise<void> {
		const response = await fetch(`/api/nodes/${slug}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Fehler beim Löschen');
		}
	}

	static generateSlug(title: string): string {
		return title
			.toLowerCase()
			.replace(/[äöü]/g, (char) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[char] || char)
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}
}
