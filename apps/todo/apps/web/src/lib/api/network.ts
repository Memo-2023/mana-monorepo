/**
 * Network Graph API Client
 */

import { apiClient } from './client';

export interface NetworkTag {
	id: string;
	name: string;
	color: string | null;
}

export interface NetworkNode {
	id: string;
	name: string;
	photoUrl: string | null;
	company: string | null; // Project name
	isFavorite: boolean;
	tags: NetworkTag[];
	connectionCount: number;
}

export interface NetworkLink {
	source: string;
	target: string;
	type: 'tag';
	strength: number;
	sharedTags: string[];
}

export interface NetworkGraphResponse {
	nodes: NetworkNode[];
	links: NetworkLink[];
}

export const networkApi = {
	/**
	 * Get the network graph of tasks connected by shared labels
	 */
	async getGraph(): Promise<NetworkGraphResponse> {
		return apiClient.get<NetworkGraphResponse>('/api/v1/network/graph');
	},
};
