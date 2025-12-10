import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { events, eventToTags } from '../db/schema';

interface Tag {
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
	tags: Tag[];
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

@Injectable()
export class NetworkService {
	private authUrl: string;

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private configService: ConfigService
	) {
		this.authUrl = this.configService.get<string>('MANA_CORE_AUTH_URL') || 'http://localhost:3001';
	}

	/**
	 * Fetch tags from central Tags API
	 */
	private async fetchTagsByIds(tagIds: string[], accessToken: string): Promise<Map<string, Tag>> {
		if (tagIds.length === 0) return new Map();

		try {
			const response = await fetch(`${this.authUrl}/api/v1/tags/by-ids?ids=${tagIds.join(',')}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				console.error('Failed to fetch tags from central API:', response.status);
				return new Map();
			}

			const tags: Tag[] = await response.json();
			return new Map(tags.map((t) => [t.id, t]));
		} catch (error) {
			console.error('Error fetching tags from central API:', error);
			return new Map();
		}
	}

	/**
	 * Build a network graph of events connected by shared tags
	 */
	async getGraph(userId: string, accessToken?: string): Promise<NetworkGraphResponse> {
		// 1. Get all events for user
		const eventsData = await this.db
			.select({
				event: events,
			})
			.from(events)
			.where(eq(events.userId, userId));

		// 2. Get tag IDs for each event from junction table
		const eventTagIdsMap = new Map<string, string[]>();
		const allTagIds = new Set<string>();

		for (const { event } of eventsData) {
			const tagRelations = await this.db
				.select({
					tagId: eventToTags.tagId,
				})
				.from(eventToTags)
				.where(eq(eventToTags.eventId, event.id));

			const tagIds = tagRelations.map((r) => r.tagId);
			eventTagIdsMap.set(event.id, tagIds);
			tagIds.forEach((id) => allTagIds.add(id));
		}

		// 3. Fetch tag details from central Tags API
		let tagsMap = new Map<string, Tag>();
		if (accessToken && allTagIds.size > 0) {
			tagsMap = await this.fetchTagsByIds(Array.from(allTagIds), accessToken);
		}

		// 4. Build tags for each event
		const eventTagsMap = new Map<string, Tag[]>();
		for (const { event } of eventsData) {
			const tagIds = eventTagIdsMap.get(event.id) || [];
			const tags = tagIds.map((id) => tagsMap.get(id)).filter((t): t is Tag => t !== undefined);
			eventTagsMap.set(event.id, tags);
		}

		// 5. Filter events that have at least one tag
		const eventsWithTagsList = eventsData.filter((e) => {
			const tags = eventTagsMap.get(e.event.id) || [];
			return tags.length > 0;
		});

		// 6. Build nodes
		const nodes: NetworkNode[] = eventsWithTagsList.map(({ event }) => {
			const tags = eventTagsMap.get(event.id) || [];
			return {
				id: event.id,
				name: event.title,
				photoUrl: null, // Events don't have photos
				company: event.location || null, // Use location as subtitle
				isFavorite: false,
				tags,
				connectionCount: 0, // Will be calculated below
			};
		});

		// 7. Build links based on shared tags
		const links: NetworkLink[] = [];
		const connectionCounts = new Map<string, number>();

		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const node1 = nodes[i];
				const node2 = nodes[j];

				// Find shared tags
				const sharedTags = node1.tags
					.filter((t1) => node2.tags.some((t2) => t2.id === t1.id))
					.map((t) => t.name);

				if (sharedTags.length > 0) {
					// Calculate strength based on number of shared tags
					const maxTags = Math.max(node1.tags.length, node2.tags.length);
					const strength = Math.round((sharedTags.length / maxTags) * 100);

					links.push({
						source: node1.id,
						target: node2.id,
						type: 'tag',
						strength,
						sharedTags,
					});

					// Update connection counts
					connectionCounts.set(node1.id, (connectionCounts.get(node1.id) || 0) + 1);
					connectionCounts.set(node2.id, (connectionCounts.get(node2.id) || 0) + 1);
				}
			}
		}

		// 8. Update connection counts in nodes
		for (const node of nodes) {
			node.connectionCount = connectionCounts.get(node.id) || 0;
		}

		return { nodes, links };
	}
}
