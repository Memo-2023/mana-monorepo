import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { getManaApp } from '@mana/shared-branding';
import { scoreRecord } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('storage');

export const storageSearchProvider: SearchProvider = {
	appId: 'storage',
	appName: 'Storage',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['file', 'folder'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search files. name + originalName are encrypted at rest; the
		// scorer needs plaintext to do substring matching.
		const rawFiles = await db.table('files').toArray();
		const visibleFiles = rawFiles.filter((f) => !f.deletedAt && !f.isDeleted);
		const files = await decryptRecords('files', visibleFiles);
		for (const file of files) {
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'name', value: file.name, weight: 1.0 },
					{ name: 'originalName', value: file.originalName, weight: 0.8 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: file.id,
					type: 'file',
					appId: 'storage',
					title: file.name,
					subtitle: file.mimeType || 'Datei',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/storage?file=${file.id}`,
					score,
					matchedField,
				});
			}
		}

		// Search folders
		const folders = await db.table('storageFolders').toArray();
		for (const folder of folders) {
			if (folder.deletedAt || folder.isDeleted) continue;
			const { score, matchedField } = scoreRecord(
				[{ name: 'name', value: folder.name, weight: 1.0 }],
				query
			);
			if (score > 0) {
				results.push({
					id: folder.id,
					type: 'folder',
					appId: 'storage',
					title: folder.name,
					subtitle: 'Ordner',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/storage?folder=${folder.id}`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
