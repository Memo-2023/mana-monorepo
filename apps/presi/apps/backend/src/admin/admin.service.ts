import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq, sql, desc, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import * as schema from '../db/schema';
import {
	UserDataResponse,
	DeleteUserDataResponse,
	EntityCount,
} from './dto/user-data-response.dto';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: Database
	) {}

	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count decks
		const decksResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.decks)
			.where(eq(schema.decks.userId, userId));
		const decksCount = decksResult[0]?.count ?? 0;

		// Count slides (through decks)
		const userDecks = await this.db
			.select({ id: schema.decks.id })
			.from(schema.decks)
			.where(eq(schema.decks.userId, userId));

		let slidesCount = 0;
		if (userDecks.length > 0) {
			const deckIds = userDecks.map((d) => d.id);
			const slidesResult = await this.db
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.slides)
				.where(inArray(schema.slides.deckId, deckIds));
			slidesCount = slidesResult[0]?.count ?? 0;
		}

		// Count shared decks (through decks)
		let sharedDecksCount = 0;
		if (userDecks.length > 0) {
			const deckIds = userDecks.map((d) => d.id);
			const sharedResult = await this.db
				.select({ count: sql<number>`count(*)::int` })
				.from(schema.sharedDecks)
				.where(inArray(schema.sharedDecks.deckId, deckIds));
			sharedDecksCount = sharedResult[0]?.count ?? 0;
		}

		// Get last activity
		const lastDeck = await this.db
			.select({ updatedAt: schema.decks.updatedAt })
			.from(schema.decks)
			.where(eq(schema.decks.userId, userId))
			.orderBy(desc(schema.decks.updatedAt))
			.limit(1);
		const lastActivityAt = lastDeck[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'decks', count: decksCount, label: 'Decks' },
			{ entity: 'slides', count: slidesCount, label: 'Slides' },
			{ entity: 'shared_decks', count: sharedDecksCount, label: 'Shared Links' },
		];

		const totalCount = decksCount + slidesCount + sharedDecksCount;

		return { entities, totalCount, lastActivityAt };
	}

	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Get user's decks first
		const userDecks = await this.db
			.select({ id: schema.decks.id })
			.from(schema.decks)
			.where(eq(schema.decks.userId, userId));

		if (userDecks.length > 0) {
			const deckIds = userDecks.map((d) => d.id);

			// Delete shared decks
			const deletedShared = await this.db
				.delete(schema.sharedDecks)
				.where(inArray(schema.sharedDecks.deckId, deckIds))
				.returning();
			deletedCounts.push({
				entity: 'shared_decks',
				count: deletedShared.length,
				label: 'Shared Links',
			});
			totalDeleted += deletedShared.length;

			// Delete slides (cascade should handle this, but let's be explicit)
			const deletedSlides = await this.db
				.delete(schema.slides)
				.where(inArray(schema.slides.deckId, deckIds))
				.returning();
			deletedCounts.push({ entity: 'slides', count: deletedSlides.length, label: 'Slides' });
			totalDeleted += deletedSlides.length;
		}

		// Delete decks
		const deletedDecks = await this.db
			.delete(schema.decks)
			.where(eq(schema.decks.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'decks', count: deletedDecks.length, label: 'Decks' });
		totalDeleted += deletedDecks.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return { success: true, deletedCounts, totalDeleted };
	}
}
