import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { getManaApp } from '@mana/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('picture');

export const pictureSearchProvider: SearchProvider = {
	appId: 'picture',
	appName: 'Picture',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['image', 'board'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search images by prompt. prompt + negativePrompt are encrypted
		// at rest; the scorer needs plaintext to do substring matching.
		const rawImages = await db.table('images').toArray();
		const visibleImages = rawImages.filter((i) => !i.deletedAt);
		const images = await decryptRecords('images', visibleImages);
		for (const image of images) {
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'prompt', value: image.prompt, weight: 1.0 },
					{ name: 'filename', value: image.filename, weight: 0.5 },
					{ name: 'style', value: image.style, weight: 0.3 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: image.id,
					type: 'image',
					appId: 'picture',
					title: truncateSubtitle(image.prompt, 60) || image.filename || 'Bild',
					subtitle: [image.style, image.model].filter(Boolean).join(' · ') || undefined,
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/picture/board/${image.boardId || ''}`,
					score,
					matchedField,
				});
			}
		}

		// Search boards
		const boards = await db.table('boards').toArray();
		for (const board of boards) {
			if (board.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'name', value: board.name, weight: 1.0 },
					{ name: 'description', value: board.description, weight: 0.7 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: board.id,
					type: 'board',
					appId: 'picture',
					title: board.name,
					subtitle: truncateSubtitle(board.description) || 'Board',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/picture/board/${board.id}`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
