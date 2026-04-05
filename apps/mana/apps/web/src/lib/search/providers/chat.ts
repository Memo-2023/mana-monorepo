import { db } from '$lib/data/database';
import { getManaApp } from '@mana/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('chat');

export const chatSearchProvider: SearchProvider = {
	appId: 'chat',
	appName: 'Chat',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['conversation', 'message'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search conversations by title
		const conversations = await db.table('conversations').toArray();
		for (const conv of conversations) {
			if (conv.deletedAt || conv.isArchived) continue;
			const { score, matchedField } = scoreRecord(
				[{ name: 'title', value: conv.title, weight: 1.0 }],
				query
			);
			if (score > 0) {
				results.push({
					id: conv.id,
					type: 'conversation',
					appId: 'chat',
					title: conv.title || 'Untitled',
					subtitle: 'Konversation',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/chat/${conv.id}`,
					score,
					matchedField,
				});
			}
		}

		// Search recent messages (limit scan to avoid performance issues)
		const messages = await db.table('messages').limit(500).toArray();
		const seenConversations = new Set<string>();

		for (const msg of messages) {
			if (msg.deletedAt || seenConversations.has(msg.conversationId)) continue;
			const { score, matchedField } = scoreRecord(
				[{ name: 'messageText', value: msg.messageText, weight: 0.7 }],
				query
			);
			if (score > 0) {
				seenConversations.add(msg.conversationId);
				results.push({
					id: msg.id,
					type: 'message',
					appId: 'chat',
					title: truncateSubtitle(msg.messageText, 60) || 'Nachricht',
					subtitle: `in Konversation`,
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/chat/${msg.conversationId}`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
