import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION, Database } from '../db/database.module';
import { albums, albumItems, type Album, type NewAlbum, type AlbumItem } from '../db/schema';

export interface AlbumWithItems extends Album {
	items: AlbumItem[];
	itemCount: number;
}

@Injectable()
export class AlbumService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Album[]> {
		return this.db
			.select()
			.from(albums)
			.where(eq(albums.userId, userId))
			.orderBy(albums.sortOrder, albums.createdAt);
	}

	async findById(id: string, userId: string): Promise<AlbumWithItems | null> {
		const [album] = await this.db
			.select()
			.from(albums)
			.where(and(eq(albums.id, id), eq(albums.userId, userId)))
			.limit(1);

		if (!album) return null;

		const items = await this.db
			.select()
			.from(albumItems)
			.where(eq(albumItems.albumId, id))
			.orderBy(albumItems.sortOrder, albumItems.addedAt);

		return {
			...album,
			items,
			itemCount: items.length,
		};
	}

	async create(userId: string, data: Omit<NewAlbum, 'userId'>): Promise<Album> {
		const [album] = await this.db
			.insert(albums)
			.values({
				...data,
				userId,
			})
			.returning();
		return album;
	}

	async update(id: string, userId: string, data: Partial<NewAlbum>): Promise<Album | null> {
		const [updated] = await this.db
			.update(albums)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(and(eq(albums.id, id), eq(albums.userId, userId)))
			.returning();
		return updated || null;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.db.delete(albums).where(and(eq(albums.id, id), eq(albums.userId, userId)));
	}

	async addItems(albumId: string, userId: string, mediaIds: string[]): Promise<void> {
		const [album] = await this.db
			.select()
			.from(albums)
			.where(and(eq(albums.id, albumId), eq(albums.userId, userId)))
			.limit(1);

		if (!album) {
			throw new NotFoundException('Album not found');
		}

		const existingItems = await this.db
			.select()
			.from(albumItems)
			.where(eq(albumItems.albumId, albumId));

		const existingMediaIds = new Set(existingItems.map((i) => i.mediaId));
		const newMediaIds = mediaIds.filter((id) => !existingMediaIds.has(id));

		if (newMediaIds.length > 0) {
			const maxOrder = existingItems.length;
			await this.db.insert(albumItems).values(
				newMediaIds.map((mediaId, index) => ({
					albumId,
					mediaId,
					sortOrder: maxOrder + index,
				}))
			);
		}
	}

	async removeItem(albumId: string, userId: string, mediaId: string): Promise<void> {
		const [album] = await this.db
			.select()
			.from(albums)
			.where(and(eq(albums.id, albumId), eq(albums.userId, userId)))
			.limit(1);

		if (!album) {
			throw new NotFoundException('Album not found');
		}

		await this.db
			.delete(albumItems)
			.where(and(eq(albumItems.albumId, albumId), eq(albumItems.mediaId, mediaId)));
	}

	async setCover(albumId: string, userId: string, mediaId: string): Promise<Album | null> {
		return this.update(albumId, userId, { coverMediaId: mediaId });
	}

	async getAlbumsForMedia(userId: string, mediaId: string): Promise<Album[]> {
		const items = await this.db
			.select({ albumId: albumItems.albumId })
			.from(albumItems)
			.innerJoin(albums, eq(albumItems.albumId, albums.id))
			.where(and(eq(albumItems.mediaId, mediaId), eq(albums.userId, userId)));

		if (items.length === 0) return [];

		const albumIds = items.map((i) => i.albumId);
		return this.db
			.select()
			.from(albums)
			.where(and(eq(albums.userId, userId)));
	}
}
