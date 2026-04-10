/**
 * Library Store — Mutations for songs
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles toggle favorite, delete, update metadata.
 */

import { songTable } from '../collections';
import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import { createBlock } from '$lib/data/time-blocks/service';
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

	/** Increment play count and create a listening TimeBlock. */
	async incrementPlayCount(id: string) {
		const local = await songTable.get(id);
		if (local) {
			const now = new Date().toISOString();
			await songTable.update(id, {
				playCount: (local.playCount || 0) + 1,
				lastPlayedAt: now,
				updatedAt: now,
			});

			const decrypted = await decryptRecord('songs', { ...local });
			const title = decrypted?.title ?? 'Song';
			const artist = decrypted?.artist;
			const endDate = local.duration
				? new Date(Date.now() + local.duration * 1000).toISOString()
				: now;

			await createBlock({
				startDate: now,
				endDate,
				kind: 'logged',
				type: 'listening',
				sourceModule: 'music',
				sourceId: id,
				title: artist ? `${title} — ${artist}` : title,
				color: '#d946ef',
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
		const diff: Record<string, unknown> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('songs', diff);
		await songTable.update(id, diff);
	},

	/** Soft-delete a song. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await songTable.update(id, { deletedAt: now, updatedAt: now });
		MusicEvents.songDeleted();
	},

	/** Insert a song (e.g., after upload). */
	async insert(song: LocalSong) {
		await encryptRecord('songs', song);
		await songTable.add(song);
	},
};
