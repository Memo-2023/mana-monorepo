/**
 * Network Graph API Client
 */

import { fetchApi } from './client';

export interface NetworkTag {
	id: string;
	name: string;
	color: string | null;
}

export interface NetworkNode {
	id: string;
	name: string;
	photoUrl: string | null;
	company: string | null;
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
	 * Get the network graph of events connected by shared tags
	 */
	async getGraph(): Promise<NetworkGraphResponse> {
		const result = await fetchApi<NetworkGraphResponse>('/network/graph');
		if (result.error) {
			throw result.error;
		}
		return result.data || { nodes: [], links: [] };
	},
};
