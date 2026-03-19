import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, and, desc, asc, ilike, or, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { songs } from '../db/schema';
import type { Song } from '../db/schema';
import {
	createMukkeStorage,
	generateUserFileKey,
	getContentType,
	type StorageClient,
} from '@manacore/shared-storage';

@Injectable()
export class SongService {
	private readonly logger = new Logger(SongService.name);
	private storage: StorageClient;

	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {
		this.storage = createMukkeStorage();
	}

	async createUploadUrl(
		userId: string,
		filename: string
	): Promise<{ song: Song; uploadUrl: string }> {
		const key = generateUserFileKey(userId, filename);
		const contentType = getContentType(filename);

		if (!contentType.startsWith('audio/') && !['application/octet-stream'].includes(contentType)) {
			throw new BadRequestException('Invalid file type. Only audio files are allowed.');
		}

		const [song] = await this.db
			.insert(songs)
			.values({
				userId,
				title: filename.replace(/\.[^/.]+$/, ''),
				storagePath: key,
			})
			.returning();

		const uploadUrl = await this.storage.getUploadUrl(key, {
			expiresIn: 3600,
		});

		return { song, uploadUrl };
	}

	async createCoverUploadUrl(
		songId: string,
		userId: string,
		filename: string
	): Promise<{ uploadUrl: string }> {
		const song = await this.findByIdOrThrow(songId, userId);

		const key = generateUserFileKey(userId, `covers/${filename}`);

		await this.db
			.update(songs)
			.set({ coverArtPath: key, updatedAt: new Date() })
			.where(eq(songs.id, songId));

		const uploadUrl = await this.storage.getUploadUrl(key, {
			expiresIn: 3600,
		});

		return { uploadUrl };
	}

	async updateMetadata(
		id: string,
		userId: string,
		data: {
			title?: string;
			artist?: string;
			album?: string;
			albumArtist?: string;
			genre?: string;
			trackNumber?: number;
			year?: number;
			duration?: number;
			bpm?: number;
			fileSize?: number;
		}
	): Promise<Song> {
		await this.findByIdOrThrow(id, userId);

		const [updatedSong] = await this.db
			.update(songs)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(songs.id, id), eq(songs.userId, userId)))
			.returning();

		return updatedSong;
	}

	async findByUserId(
		userId: string,
		sortField: string = 'addedAt',
		sortDirection: string = 'desc'
	): Promise<Song[]> {
		const sortColumn = this.getSortColumn(sortField);
		const orderFn = sortDirection === 'asc' ? asc : desc;

		return this.db
			.select()
			.from(songs)
			.where(eq(songs.userId, userId))
			.orderBy(orderFn(sortColumn));
	}

	async findById(id: string, userId: string): Promise<Song | null> {
		const [song] = await this.db
			.select()
			.from(songs)
			.where(and(eq(songs.id, id), eq(songs.userId, userId)));
		return song || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Song> {
		const song = await this.findById(id, userId);
		if (!song) {
			throw new NotFoundException('Song not found');
		}
		return song;
	}

	async toggleFavorite(id: string, userId: string): Promise<Song> {
		const song = await this.findByIdOrThrow(id, userId);

		const [updatedSong] = await this.db
			.update(songs)
			.set({ favorite: !song.favorite, updatedAt: new Date() })
			.where(and(eq(songs.id, id), eq(songs.userId, userId)))
			.returning();

		return updatedSong;
	}

	async incrementPlayCount(id: string, userId: string): Promise<Song> {
		await this.findByIdOrThrow(id, userId);

		const [updatedSong] = await this.db
			.update(songs)
			.set({
				playCount: sql`${songs.playCount} + 1`,
				lastPlayedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(and(eq(songs.id, id), eq(songs.userId, userId)))
			.returning();

		return updatedSong;
	}

	async search(userId: string, query: string): Promise<Song[]> {
		const pattern = `%${query}%`;

		return this.db
			.select()
			.from(songs)
			.where(
				and(
					eq(songs.userId, userId),
					or(ilike(songs.title, pattern), ilike(songs.artist, pattern), ilike(songs.album, pattern))
				)
			)
			.limit(50);
	}

	async delete(id: string, userId: string): Promise<void> {
		const song = await this.findByIdOrThrow(id, userId);

		// Delete audio from storage
		try {
			await this.storage.delete(song.storagePath);
		} catch {
			// Ignore storage errors, continue with DB deletion
		}

		// Delete cover art from storage if exists
		if (song.coverArtPath) {
			try {
				await this.storage.delete(song.coverArtPath);
			} catch {
				// Ignore storage errors
			}
		}

		await this.db.delete(songs).where(and(eq(songs.id, id), eq(songs.userId, userId)));
	}

	async getDownloadUrl(id: string, userId: string): Promise<string> {
		const song = await this.findByIdOrThrow(id, userId);
		return this.storage.getDownloadUrl(song.storagePath, { expiresIn: 3600 });
	}

	private getSortColumn(field: string) {
		switch (field) {
			case 'title':
				return songs.title;
			case 'artist':
				return songs.artist;
			case 'album':
				return songs.album;
			case 'duration':
				return songs.duration;
			case 'playCount':
				return songs.playCount;
			case 'lastPlayedAt':
				return songs.lastPlayedAt;
			default:
				return songs.addedAt;
		}
	}
}
