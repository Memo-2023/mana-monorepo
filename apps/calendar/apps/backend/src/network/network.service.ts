import { Injectable, Inject, Logger } from '@nestjs/common';
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
	type: 'tag' | 'calendar' | 'date' | 'location';
	strength: number;
	sharedTags: string[];
}

export interface NetworkGraphResponse {
	nodes: NetworkNode[];
	links: NetworkLink[];
}

@Injectable()
export class NetworkService {
	private readonly logger = new Logger(NetworkService.name);
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
				this.logger.warn(`Failed to fetch tags from central API: ${response.status}`);
				return new Map();
			}

			const tags: Tag[] = await response.json();
			return new Map(tags.map((t) => [t.id, t]));
		} catch (error) {
			this.logger.error('Error fetching tags from central API', error);
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

		// 5. Build nodes from ALL events (not just those with tags)
		const nodes: NetworkNode[] = eventsData.map(({ event }) => {
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

		// 6. Build links based on multiple criteria
		const links: NetworkLink[] = [];
		const connectionCounts = new Map<string, number>();
		const linkSet = new Set<string>(); // Track unique links to avoid duplicates

		for (let i = 0; i < eventsData.length; i++) {
			for (let j = i + 1; j < eventsData.length; j++) {
				const event1 = eventsData[i].event;
				const event2 = eventsData[j].event;
				const node1 = nodes[i];
				const node2 = nodes[j];
				const linkKey = `${event1.id}-${event2.id}`;

				// Skip if link already exists
				if (linkSet.has(linkKey)) continue;

				let linked = false;
				let linkType: 'tag' | 'calendar' | 'date' | 'location' = 'tag';
				let strength = 0;
				const sharedTags: string[] = [];

				// 6a. Check for shared tags (highest priority)
				const tags1 = eventTagsMap.get(event1.id) || [];
				const tags2 = eventTagsMap.get(event2.id) || [];
				const commonTags = tags1.filter((t1) => tags2.some((t2) => t2.id === t1.id));

				if (commonTags.length > 0) {
					linked = true;
					linkType = 'tag';
					const maxTags = Math.max(tags1.length, tags2.length);
					strength = Math.round((commonTags.length / maxTags) * 100);
					sharedTags.push(...commonTags.map((t) => t.name));
				}

				// 6b. Check for same calendar (if not already linked)
				if (!linked && event1.calendarId === event2.calendarId) {
					linked = true;
					linkType = 'calendar';
					strength = 50;
				}

				// 6c. Check for same date (if not already linked)
				if (!linked) {
					const date1 = new Date(event1.startTime).toDateString();
					const date2 = new Date(event2.startTime).toDateString();
					if (date1 === date2) {
						linked = true;
						linkType = 'date';
						strength = 40;
					}
				}

				// 6d. Check for same location (if not already linked and both have location)
				if (
					!linked &&
					event1.location &&
					event2.location &&
					event1.location.toLowerCase() === event2.location.toLowerCase()
				) {
					linked = true;
					linkType = 'location';
					strength = 60;
				}

				if (linked) {
					links.push({
						source: event1.id,
						target: event2.id,
						type: linkType,
						strength,
						sharedTags,
					});
					linkSet.add(linkKey);

					// Update connection counts
					connectionCounts.set(event1.id, (connectionCounts.get(event1.id) || 0) + 1);
					connectionCounts.set(event2.id, (connectionCounts.get(event2.id) || 0) + 1);
				}
			}
		}

		// 7. Update connection counts in nodes
		for (const node of nodes) {
			node.connectionCount = connectionCounts.get(node.id) || 0;
		}

		return { nodes, links };
	}
}
