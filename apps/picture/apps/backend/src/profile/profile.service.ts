import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { profiles, images, type Profile } from '../db/schema';
import { UpdateProfileDto, ProfileResponse, UserStatsResponse } from './dto/profile.dto';

@Injectable()
export class ProfileService {
	private readonly logger = new Logger(ProfileService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async getProfile(userId: string): Promise<ProfileResponse> {
		try {
			const result = await this.db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

			if (result.length === 0) {
				throw new NotFoundException('Profile not found');
			}

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error(`Error fetching profile for user ${userId}`, error);
			throw error;
		}
	}

	async getOrCreateProfile(userId: string, email: string): Promise<ProfileResponse> {
		try {
			// Try to get existing profile
			const existing = await this.db
				.select()
				.from(profiles)
				.where(eq(profiles.id, userId))
				.limit(1);

			if (existing.length > 0) {
				return existing[0];
			}

			// Create new profile
			const newProfile = await this.db
				.insert(profiles)
				.values({
					id: userId,
					email,
					username: null,
				})
				.returning();

			return newProfile[0];
		} catch (error) {
			this.logger.error(`Error getting/creating profile for user ${userId}`, error);
			throw error;
		}
	}

	async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
		try {
			// Check if profile exists
			const existing = await this.db
				.select()
				.from(profiles)
				.where(eq(profiles.id, userId))
				.limit(1);

			if (existing.length === 0) {
				throw new NotFoundException('Profile not found');
			}

			const result = await this.db
				.update(profiles)
				.set({
					...dto,
					updatedAt: new Date(),
				})
				.where(eq(profiles.id, userId))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error(`Error updating profile for user ${userId}`, error);
			throw error;
		}
	}

	async getUserStats(userId: string): Promise<UserStatsResponse> {
		try {
			// Get total images (non-archived)
			const totalResult = await this.db
				.select({ count: sql<number>`count(*)` })
				.from(images)
				.where(and(eq(images.userId, userId), isNull(images.archivedAt)));

			// Get favorite images
			const favoriteResult = await this.db
				.select({ count: sql<number>`count(*)` })
				.from(images)
				.where(
					and(eq(images.userId, userId), eq(images.isFavorite, true), isNull(images.archivedAt))
				);

			// Get archived images
			const archivedResult = await this.db
				.select({ count: sql<number>`count(*)` })
				.from(images)
				.where(and(eq(images.userId, userId), isNotNull(images.archivedAt)));

			// Get public images
			const publicResult = await this.db
				.select({ count: sql<number>`count(*)` })
				.from(images)
				.where(
					and(eq(images.userId, userId), eq(images.isPublic, true), isNull(images.archivedAt))
				);

			return {
				totalImages: Number(totalResult[0]?.count || 0),
				favoriteImages: Number(favoriteResult[0]?.count || 0),
				archivedImages: Number(archivedResult[0]?.count || 0),
				publicImages: Number(publicResult[0]?.count || 0),
			};
		} catch (error) {
			this.logger.error(`Error fetching stats for user ${userId}`, error);
			throw error;
		}
	}
}
