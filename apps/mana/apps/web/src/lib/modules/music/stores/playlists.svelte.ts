/**
 * Playlists Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles playlist CRUD and song associations.
 */

import { db } from '$lib/data/database';
import { musicPlaylistTable, playlistSongTable } from '../collections';
import { toPlaylist } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import { MusicEvents } from '@mana/shared-utils/analytics';
import type { LocalPlaylist, LocalPlaylistSong } from '../types';

export const playlistsStore = {
	/** Create a new playlist. */
	async create(name: string, description?: string) {
		const newLocal: LocalPlaylist = {
			id: crypto.randomUUID(),
			name,
			description: description ?? null,
			coverArtPath: null,
		};
		// Snapshot the plaintext for the return value before encryptRecord
		// mutates `newLocal` in place — UI consumers expect plaintext.
		const plaintextSnapshot = toPlaylist({ ...newLocal });
		await encryptRecord('mukkePlaylists', newLocal);
		await musicPlaylistTable.add(newLocal);
		MusicEvents.playlistCreated();
		return plaintextSnapshot;
	},

	/** Update a playlist. */
	async update(id: string, data: Partial<Pick<LocalPlaylist, 'name' | 'description'>>) {
		const diff: Record<string, unknown> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('mukkePlaylists', diff);
		await musicPlaylistTable.update(id, diff);
	},

	/** Soft-delete a playlist and its song associations atomically. */
	async delete(id: string) {
		const now = new Date().toISOString();
		// Atomic cascade: playlist + playlistSongs in one Dexie transaction.
		await db.transaction('rw', musicPlaylistTable, playlistSongTable, async () => {
			await musicPlaylistTable.update(id, { deletedAt: now, updatedAt: now });
			const allPS = await playlistSongTable.where('playlistId').equals(id).toArray();
			for (const ps of allPS) {
				await playlistSongTable.update(ps.id, { deletedAt: now, updatedAt: now });
			}
		});
		MusicEvents.playlistDeleted();
	},

	/** Add a song to a playlist. */
	async addSong(playlistId: string, songId: string) {
		const existing = await playlistSongTable.where('playlistId').equals(playlistId).toArray();
		const maxSort = existing
			.filter((ps) => !ps.deletedAt)
			.reduce((max, ps) => Math.max(max, ps.sortOrder), -1);

		const newPS: LocalPlaylistSong = {
			id: crypto.randomUUID(),
			playlistId,
			songId,
			sortOrder: maxSort + 1,
		};
		await playlistSongTable.add(newPS);
	},

	/** Remove a song from a playlist. */
	async removeSong(playlistId: string, songId: string) {
		const allPS = await playlistSongTable.where('playlistId').equals(playlistId).toArray();
		const toRemove = allPS.find((ps) => ps.songId === songId && !ps.deletedAt);
		if (toRemove) {
			const now = new Date().toISOString();
			await playlistSongTable.update(toRemove.id, { deletedAt: now, updatedAt: now });
		}
	},

	/** Reorder songs in a playlist. */
	async reorderSongs(playlistId: string, songIds: string[]) {
		const allPS = await playlistSongTable.where('playlistId').equals(playlistId).toArray();
		const now = new Date().toISOString();
		for (let i = 0; i < songIds.length; i++) {
			const ps = allPS.find((p) => p.songId === songIds[i] && !p.deletedAt);
			if (ps) {
				await playlistSongTable.update(ps.id, { sortOrder: i, updatedAt: now });
			}
		}
	},
};
