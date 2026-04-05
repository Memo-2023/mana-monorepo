import { db } from '$lib/data/database';
import { getManaApp } from '@manacore/shared-branding';
import { scoreRecord, truncateSubtitle } from '../scoring';
import type { SearchProvider, SearchResult, SearchOptions } from '../types';

const app = getManaApp('music');

export const musicSearchProvider: SearchProvider = {
	appId: 'music',
	appName: 'Music',
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
					appId: 'music',
					title: song.title,
					subtitle: [song.artist, song.album].filter(Boolean).join(' · ') || undefined,
					appIcon: app?.icon,
					appColor: app?.color,
					href: '/music/library',
					score,
					matchedField,
				});
			}
		}

		// Search playlists (Dexie table name kept for backward compat)
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
					appId: 'music',
					title: pl.name,
					subtitle: truncateSubtitle(pl.description) || 'Playlist',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/music/playlists/${pl.id}`,
					score,
					matchedField,
				});
			}
		}

		// Search projects (Dexie table name kept for backward compat)
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
					appId: 'music',
					title: proj.title,
					subtitle: truncateSubtitle(proj.description) || 'Projekt',
					appIcon: app?.icon,
					appColor: app?.color,
					href: `/music/projects`,
					score,
					matchedField,
				});
			}
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	},
};
