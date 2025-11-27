import { Injectable, Inject, Logger } from '@nestjs/common';
import {
	type Database,
	meals,
	eq,
	and,
	gt,
	type Meal as DbMeal,
} from '@manacore/nutriphi-database';
import { DATABASE_TOKEN } from '../database/database.module';
import {
	LocalMealDto,
	SyncPushDto,
	SyncPushResponse,
	SyncPullResponse,
	SyncStatusResponse,
	ConflictInfo,
} from './dto/sync.dto';

@Injectable()
export class SyncService {
	private readonly logger = new Logger(SyncService.name);

	constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

	/**
	 * Push local changes to server
	 */
	async pushChanges(userId: string, dto: SyncPushDto): Promise<SyncPushResponse> {
		this.logger.log(`Processing sync push for user: ${userId}, ${dto.meals.length} meals`);

		const created: { localId: number; cloudId: string }[] = [];
		const updated: string[] = [];
		const conflicts: ConflictInfo[] = [];
		const serverTime = new Date().toISOString();

		// Process each meal
		for (const localMeal of dto.meals) {
			try {
				if (localMeal.cloudId) {
					// Update existing meal
					const result = await this.updateExistingMeal(userId, localMeal);
					if (result.conflict) {
						conflicts.push(result.conflict);
					} else if (result.updated) {
						updated.push(localMeal.cloudId);
					}
				} else {
					// Create new meal
					const cloudId = await this.createNewMeal(userId, localMeal);
					created.push({ localId: localMeal.localId, cloudId });
				}
			} catch (error) {
				this.logger.error(`Error processing meal ${localMeal.localId}:`, error);
			}
		}

		// Process deletions
		for (const cloudId of dto.deletedIds) {
			try {
				await this.db.delete(meals).where(and(eq(meals.id, cloudId), eq(meals.userId, userId)));
				this.logger.log(`Deleted meal: ${cloudId}`);
			} catch (error) {
				this.logger.error(`Error deleting meal ${cloudId}:`, error);
			}
		}

		return { created, updated, conflicts, serverTime };
	}

	/**
	 * Pull changes from server since given timestamp
	 */
	async pullChanges(userId: string, since?: string): Promise<SyncPullResponse> {
		this.logger.log(`Processing sync pull for user: ${userId}, since: ${since}`);

		const serverTime = new Date().toISOString();

		let query;
		if (since) {
			const sinceDate = new Date(since);
			query = this.db
				.select()
				.from(meals)
				.where(and(eq(meals.userId, userId), gt(meals.updatedAt, sinceDate)));
		} else {
			// Full sync - get all meals
			query = this.db.select().from(meals).where(eq(meals.userId, userId));
		}

		const results = await query;

		const mappedMeals = results.map((meal) => this.mapDbMealToSync(meal));

		return {
			meals: mappedMeals,
			deletedIds: [], // TODO: Implement soft deletes to track deleted meals
			serverTime,
		};
	}

	/**
	 * Get sync status
	 */
	async getStatus(userId: string): Promise<SyncStatusResponse> {
		const serverTime = new Date().toISOString();

		// Count user's meals
		const result = await this.db.select().from(meals).where(eq(meals.userId, userId));

		return {
			lastSyncAt: null, // Could be stored in a user preferences table
			pendingChanges: 0,
			serverTime,
		};
	}

	/**
	 * Create a new meal from local data
	 */
	private async createNewMeal(userId: string, localMeal: LocalMealDto): Promise<string> {
		const [result] = await this.db
			.insert(meals)
			.values({
				userId,
				foodName: localMeal.foodName,
				imageUrl: localMeal.imageUrl,
				calories: localMeal.calories ?? 0,
				protein: localMeal.protein ?? 0,
				carbohydrates: localMeal.carbohydrates ?? 0,
				fat: localMeal.fat ?? 0,
				fiber: localMeal.fiber ?? 0,
				sugar: localMeal.sugar ?? 0,
				sodium: localMeal.sodium ?? 0,
				servingSize: localMeal.servingSize,
				mealType: localMeal.mealType,
				analysisStatus: localMeal.analysisStatus ?? 'completed',
				healthScore: localMeal.healthScore,
				healthCategory: localMeal.healthCategory,
				notes: localMeal.notes,
				userRating: localMeal.userRating,
				foodItems: localMeal.foodItems ?? [],
				createdAt: new Date(localMeal.createdAt),
				updatedAt: new Date(localMeal.updatedAt),
			})
			.returning();

		this.logger.log(`Created meal: ${result.id} for local: ${localMeal.localId}`);
		return result.id;
	}

	/**
	 * Update existing meal, checking for conflicts
	 */
	private async updateExistingMeal(
		userId: string,
		localMeal: LocalMealDto
	): Promise<{ updated: boolean; conflict?: ConflictInfo }> {
		// Get current server version
		const [serverMeal] = await this.db
			.select()
			.from(meals)
			.where(and(eq(meals.id, localMeal.cloudId!), eq(meals.userId, userId)));

		if (!serverMeal) {
			this.logger.warn(`Meal not found: ${localMeal.cloudId}`);
			return { updated: false };
		}

		// Simple last-write-wins strategy
		// In production, you might want more sophisticated conflict resolution
		const localUpdateTime = new Date(localMeal.updatedAt);
		const serverUpdateTime = serverMeal.updatedAt;

		// If local is newer, update server
		if (localUpdateTime >= serverUpdateTime) {
			await this.db
				.update(meals)
				.set({
					foodName: localMeal.foodName,
					imageUrl: localMeal.imageUrl,
					calories: localMeal.calories ?? 0,
					protein: localMeal.protein ?? 0,
					carbohydrates: localMeal.carbohydrates ?? 0,
					fat: localMeal.fat ?? 0,
					fiber: localMeal.fiber ?? 0,
					sugar: localMeal.sugar ?? 0,
					sodium: localMeal.sodium ?? 0,
					servingSize: localMeal.servingSize,
					mealType: localMeal.mealType,
					analysisStatus: localMeal.analysisStatus,
					healthScore: localMeal.healthScore,
					healthCategory: localMeal.healthCategory,
					notes: localMeal.notes,
					userRating: localMeal.userRating,
					foodItems: localMeal.foodItems ?? [],
					updatedAt: new Date(),
				})
				.where(eq(meals.id, localMeal.cloudId!));

			this.logger.log(`Updated meal: ${localMeal.cloudId}`);
			return { updated: true };
		}

		// Server is newer - report conflict
		return {
			updated: false,
			conflict: {
				cloudId: localMeal.cloudId!,
				localVersion: localMeal.version,
				serverVersion: 1, // Would need version tracking in DB
				serverData: this.mapDbMealToSync(serverMeal),
				message: 'Server has newer data',
			},
		};
	}

	/**
	 * Map database meal to sync format
	 */
	private mapDbMealToSync(meal: DbMeal): any {
		return {
			cloudId: meal.id,
			userId: meal.userId,
			foodName: meal.foodName,
			imageUrl: meal.imageUrl,
			calories: meal.calories,
			protein: meal.protein,
			carbohydrates: meal.carbohydrates,
			fat: meal.fat,
			fiber: meal.fiber,
			sugar: meal.sugar,
			sodium: meal.sodium,
			servingSize: meal.servingSize,
			mealType: meal.mealType,
			analysisStatus: meal.analysisStatus,
			healthScore: meal.healthScore,
			healthCategory: meal.healthCategory,
			notes: meal.notes,
			userRating: meal.userRating,
			foodItems: meal.foodItems,
			createdAt: meal.createdAt.toISOString(),
			updatedAt: meal.updatedAt.toISOString(),
		};
	}
}
