import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, asc, max, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { playlists, playlistSongs, songs } from '../db/schema';
import type { Playlist, NewPlaylist } from '../db/schema';

@Injectable()
export class PlaylistService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<Playlist[]> {
		return this.db
			.select()
			.from(playlists)
			.where(eq(playlists.userId, userId))
			.orderBy(desc(playlists.updatedAt));
	}

	async findById(id: string, userId: string): Promise<Playlist> {
		const [playlist] = await this.db
			.select()
			.from(playlists)
			.where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
		if (!playlist) {
			throw new NotFoundException('Playlist not found');
		}
		return playlist;
	}

	async create(userId: string, data: { name: string; description?: string }): Promise<Playlist> {
		const [playlist] = await this.db
			.insert(playlists)
			.values({
				userId,
				name: data.name,
				description: data.description,
			})
			.returning();
		return playlist;
	}

	async update(
		id: string,
		userId: string,
		data: { name?: string; description?: string }
	): Promise<Playlist> {
		await this.findById(id, userId);
		const [playlist] = await this.db
			.update(playlists)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
			.returning();
		return playlist;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findById(id, userId);
		await this.db.delete(playlists).where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
	}

	async getPlaylistWithSongs(id: string, userId: string) {
		const playlist = await this.findById(id, userId);
		const playlistSongRows = await this.db
			.select({
				playlistSong: playlistSongs,
				song: songs,
			})
			.from(playlistSongs)
			.innerJoin(songs, eq(playlistSongs.songId, songs.id))
			.where(eq(playlistSongs.playlistId, id))
			.orderBy(asc(playlistSongs.sortOrder));

		return {
			...playlist,
			songs: playlistSongRows.map((row) => ({
				...row.song,
				sortOrder: row.playlistSong.sortOrder,
				addedAt: row.playlistSong.addedAt,
			})),
		};
	}

	async addSong(playlistId: string, songId: string, userId: string): Promise<void> {
		await this.findById(playlistId, userId);

		const [result] = await this.db
			.select({ maxOrder: max(playlistSongs.sortOrder) })
			.from(playlistSongs)
			.where(eq(playlistSongs.playlistId, playlistId));

		const nextOrder = (result?.maxOrder ?? -1) + 1;

		await this.db.insert(playlistSongs).values({
			playlistId,
			songId,
			sortOrder: nextOrder,
		});

		await this.db
			.update(playlists)
			.set({ updatedAt: new Date() })
			.where(eq(playlists.id, playlistId));
	}

	async removeSong(playlistId: string, songId: string, userId: string): Promise<void> {
		await this.findById(playlistId, userId);
		await this.db
			.delete(playlistSongs)
			.where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)));

		await this.db
			.update(playlists)
			.set({ updatedAt: new Date() })
			.where(eq(playlists.id, playlistId));
	}

	async reorderSongs(playlistId: string, userId: string, songIds: string[]): Promise<void> {
		await this.findById(playlistId, userId);

		for (let i = 0; i < songIds.length; i++) {
			await this.db
				.update(playlistSongs)
				.set({ sortOrder: i })
				.where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songIds[i])));
		}
	}
}
