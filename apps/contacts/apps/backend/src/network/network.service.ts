import { Injectable, Inject } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contacts, contactTags, contactToTags } from '../db/schema';

export interface NetworkNode {
	id: string;
	name: string;
	photoUrl: string | null;
	company: string | null;
	isFavorite: boolean;
	tags: { id: string; name: string; color: string | null }[];
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
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async getTagBasedGraph(userId: string): Promise<NetworkGraphResponse> {
		// 1. Get all contacts for the user (excluding archived)
		const userContacts = await this.db
			.select({
				id: contacts.id,
				firstName: contacts.firstName,
				lastName: contacts.lastName,
				displayName: contacts.displayName,
				photoUrl: contacts.photoUrl,
				company: contacts.company,
				isFavorite: contacts.isFavorite,
			})
			.from(contacts)
			.where(eq(contacts.userId, userId));

		if (userContacts.length === 0) {
			return { nodes: [], links: [] };
		}

		// 2. Get all tags for the user
		const userTags = await this.db.select().from(contactTags).where(eq(contactTags.userId, userId));

		const tagMap = new Map(userTags.map((t) => [t.id, t]));

		// 3. Get all contact-tag associations
		const contactTagAssociations = await this.db
			.select({
				contactId: contactToTags.contactId,
				tagId: contactToTags.tagId,
			})
			.from(contactToTags)
			.innerJoin(contacts, eq(contactToTags.contactId, contacts.id))
			.where(eq(contacts.userId, userId));

		// 4. Build contact -> tags mapping
		const contactTagsMap = new Map<string, string[]>();
		for (const assoc of contactTagAssociations) {
			const existing = contactTagsMap.get(assoc.contactId) || [];
			existing.push(assoc.tagId);
			contactTagsMap.set(assoc.contactId, existing);
		}

		// 5. Build nodes
		const nodes: NetworkNode[] = userContacts.map((contact) => {
			const tagIds = contactTagsMap.get(contact.id) || [];
			const tags = tagIds
				.map((tagId) => {
					const tag = tagMap.get(tagId);
					return tag ? { id: tag.id, name: tag.name, color: tag.color } : null;
				})
				.filter((t): t is { id: string; name: string; color: string | null } => t !== null);

			return {
				id: contact.id,
				name: this.getDisplayName(contact),
				photoUrl: contact.photoUrl,
				company: contact.company,
				isFavorite: contact.isFavorite ?? false,
				tags,
				connectionCount: 0, // Will be calculated after links
			};
		});

		// 6. Build links based on shared tags
		const links: NetworkLink[] = [];
		const connectionCounts = new Map<string, number>();

		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const nodeA = nodes[i];
				const nodeB = nodes[j];

				const tagsA = new Set(nodeA.tags.map((t) => t.id));
				const tagsB = new Set(nodeB.tags.map((t) => t.id));

				const sharedTagIds = [...tagsA].filter((tagId) => tagsB.has(tagId));

				if (sharedTagIds.length > 0) {
					const sharedTagNames = sharedTagIds
						.map((tagId) => tagMap.get(tagId)?.name)
						.filter((name): name is string => !!name);

					// Strength based on number of shared tags (max 100)
					const strength = Math.min(sharedTagIds.length * 25, 100);

					links.push({
						source: nodeA.id,
						target: nodeB.id,
						type: 'tag',
						strength,
						sharedTags: sharedTagNames,
					});

					// Count connections
					connectionCounts.set(nodeA.id, (connectionCounts.get(nodeA.id) || 0) + 1);
					connectionCounts.set(nodeB.id, (connectionCounts.get(nodeB.id) || 0) + 1);
				}
			}
		}

		// 7. Update connection counts on nodes
		for (const node of nodes) {
			node.connectionCount = connectionCounts.get(node.id) || 0;
		}

		return { nodes, links };
	}

	private getDisplayName(contact: {
		firstName: string | null;
		lastName: string | null;
		displayName: string | null;
	}): string {
		if (contact.displayName) return contact.displayName;
		const parts = [contact.firstName, contact.lastName].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : 'Unbekannt';
	}
}
