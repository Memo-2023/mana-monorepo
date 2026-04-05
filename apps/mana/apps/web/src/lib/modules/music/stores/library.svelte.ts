/**
 * Library Store — Mutations for songs
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles toggle favorite, delete, update metadata.
 */

import { songTable } from '../collections';
import { MusicEvents } from '@mana/shared-utils/analytics';
import type { LocalSong } from '../types';

export const libraryStore = {
	/** Toggle favorite — writes to IndexedDB instantly. */
	async toggleFavorite(id: string) {
		const local = await songTable.get(id);
		if (local) {
			const newState = !local.favorite;
			await songTable.update(id, {
				favorite: newState,
				updatedAt: new Date().toISOString(),
			});
			MusicEvents.songFavorited(newState);
		}
	},

	/** Increment play count. */
	async incrementPlayCount(id: string) {
		const local = await songTable.get(id);
		if (local) {
			await songTable.update(id, {
				playCount: (local.playCount || 0) + 1,
				lastPlayedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
			MusicEvents.songPlayed();
		}
	},

	/** Update song metadata. */
	async updateMetadata(
		id: string,
		data: Partial<
			Pick<
				LocalSong,
				'title' | 'artist' | 'album' | 'albumArtist' | 'genre' | 'trackNumber' | 'year' | 'bpm'
			>
		>
	) {
		await songTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Soft-delete a song. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await songTable.update(id, { deletedAt: now, updatedAt: now });
		MusicEvents.songDeleted();
	},

	/** Insert a song (e.g., after upload). */
	async insert(song: LocalSong) {
		await songTable.add(song);
	},
};
