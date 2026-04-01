import { db } from '$lib/data/database';
import { getManaApp } from '@manacore/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('mukke');

export const mukkeSearchProvider: SearchProvider = {
	appId: 'mukke',
	appName: 'Mukke',
	appIcon: app?.icon,
	appColor: app?.color,
	searchableTypes: ['song', 'playlist', 'project'],

	async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
		const limit = options?.limit ?? 5;
		const results: SearchResult[] = [];

		// Search songs
		const songs = await db.table('songs').toArray();
		for (const song of songs) {
			if (song.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'title', value: song.title, weight: 1.0 },
					{ name: 'artist', value: song.artist, weight: 0.8 },
					{ name: 'album', value: song.album, weight: 0.6 },
					{ name: 'genre', value: song.genre, weight: 0.4 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: song.id,
					type: 'song',
					appId: 'mukke',
					title: song.title,
					subtitle: [song.artist, song.album].filter(Boolean).join(' · ') || undefined,
					appIcon: app?.icon,
					appColor: app?.color,
					href: '/mukke/library',
					score,
					matchedField,
				});
			}
		}

		// Search playlists
		const playlists = await db.table('mukkePlaylists').toArray();
		for (const pl of playlists) {
			if (pl.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'name', value: pl.name, weight: 1.0 },
					{ name: 'description', value: pl.description, weight: 0.7 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: pl.id,
					type: 'playlist',
					appId: 'mukke',
					title: pl.name,
					subtitle: truncateSubtitle(pl.description) || 'Playlist',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/mukke/playlists/${pl.id}`,
					score,
					matchedField,
				});
			}
		}

		// Search projects
		const projects = await db.table('mukkeProjects').toArray();
		for (const proj of projects) {
			if (proj.deletedAt) continue;
			const { score, matchedField } = scoreRecord(
				[
					{ name: 'title', value: proj.title, weight: 1.0 },
					{ name: 'description', value: proj.description, weight: 0.7 },
				],
				query
			);
			if (score > 0) {
				results.push({
					id: proj.id,
					type: 'project',
					appId: 'mukke',
					title: proj.title,
					subtitle: truncateSubtitle(proj.description) || 'Projekt',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/mukke/projects`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
