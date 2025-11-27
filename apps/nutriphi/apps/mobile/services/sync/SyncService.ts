import { tokenManager } from '../auth/tokenManager';
import { SQLiteService } from '../database/SQLiteService';
import type { Meal } from '../../types/Database';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3002';

export interface SyncResult {
	success: boolean;
	created: number;
	updated: number;
	deleted: number;
	conflicts: ConflictInfo[];
	error?: string;
}

export interface ConflictInfo {
	cloudId: string;
	localVersion: number;
	serverVersion: number;
	serverData: any;
	message: string;
}

export interface LocalMealForSync {
	localId: number;
	cloudId?: string;
	foodName: string;
	imageUrl?: string;
	calories?: number;
	protein?: number;
	carbohydrates?: number;
	fat?: number;
	fiber?: number;
	sugar?: number;
	sodium?: number;
	servingSize?: string;
	mealType?: string;
	analysisStatus?: string;
	healthScore?: number;
	healthCategory?: string;
	notes?: string;
	userRating?: number;
	foodItems?: any[];
	version: number;
	createdAt: string;
	updatedAt: string;
}

/**
 * Sync Service for synchronizing local SQLite data with the backend
 */
export class SyncService {
	private static instance: SyncService;
	private isSyncing = false;
	private lastSyncAt: string | null = null;

	private constructor() {}

	public static getInstance(): SyncService {
		if (!SyncService.instance) {
			SyncService.instance = new SyncService();
		}
		return SyncService.instance;
	}

	/**
	 * Check if sync is currently in progress
	 */
	public isSyncInProgress(): boolean {
		return this.isSyncing;
	}

	/**
	 * Get last sync timestamp
	 */
	public getLastSyncAt(): string | null {
		return this.lastSyncAt;
	}

	/**
	 * Perform a full sync (push + pull)
	 */
	public async fullSync(): Promise<SyncResult> {
		if (this.isSyncing) {
			return {
				success: false,
				created: 0,
				updated: 0,
				deleted: 0,
				conflicts: [],
				error: 'Sync already in progress',
			};
		}

		this.isSyncing = true;

		try {
			// First push local changes
			const pushResult = await this.pushChanges();
			if (!pushResult.success) {
				return pushResult;
			}

			// Then pull server changes
			const pullResult = await this.pullChanges();

			return {
				success: pullResult.success,
				created: pushResult.created + pullResult.created,
				updated: pushResult.updated + pullResult.updated,
				deleted: pullResult.deleted,
				conflicts: pushResult.conflicts,
				error: pullResult.error,
			};
		} finally {
			this.isSyncing = false;
		}
	}

	/**
	 * Push local changes to server
	 */
	public async pushChanges(): Promise<SyncResult> {
		try {
			const authHeader = await tokenManager.getAuthHeader();
			if (!authHeader.Authorization) {
				return {
					success: false,
					created: 0,
					updated: 0,
					deleted: 0,
					conflicts: [],
					error: 'Not authenticated',
				};
			}

			const db = SQLiteService.getInstance();

			// Get unsynced meals
			const unsyncedMeals = await db.getUnsyncedMeals();

			if (unsyncedMeals.length === 0) {
				return {
					success: true,
					created: 0,
					updated: 0,
					deleted: 0,
					conflicts: [],
				};
			}

			// Map to sync format
			const mealsForSync: LocalMealForSync[] = unsyncedMeals.map((meal) =>
				this.mapMealToSyncFormat(meal)
			);

			// Get deleted meals (meals marked for deletion)
			const deletedIds: string[] = []; // TODO: Implement delete tracking

			const response = await fetch(`${BACKEND_URL}/api/sync/push`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...authHeader,
				},
				body: JSON.stringify({
					meals: mealsForSync,
					deletedIds,
					lastSyncAt: this.lastSyncAt,
				}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				return {
					success: false,
					created: 0,
					updated: 0,
					deleted: 0,
					conflicts: [],
					error: error.message || 'Push failed',
				};
			}

			const result = await response.json();

			// Update local records with cloud IDs
			for (const created of result.created) {
				await db.updateCloudId(created.localId, created.cloudId);
				await db.markSynced(created.localId);
			}

			// Mark updated records as synced
			for (const cloudId of result.updated) {
				const meal = unsyncedMeals.find((m) => m.cloud_id === cloudId);
				if (meal && meal.id) {
					await db.markSynced(meal.id);
				}
			}

			this.lastSyncAt = result.serverTime;

			return {
				success: true,
				created: result.created.length,
				updated: result.updated.length,
				deleted: 0,
				conflicts: result.conflicts || [],
			};
		} catch (error) {
			console.error('Push sync error:', error);
			return {
				success: false,
				created: 0,
				updated: 0,
				deleted: 0,
				conflicts: [],
				error: error instanceof Error ? error.message : 'Push failed',
			};
		}
	}

	/**
	 * Pull changes from server
	 */
	public async pullChanges(): Promise<SyncResult> {
		try {
			const authHeader = await tokenManager.getAuthHeader();
			if (!authHeader.Authorization) {
				return {
					success: false,
					created: 0,
					updated: 0,
					deleted: 0,
					conflicts: [],
					error: 'Not authenticated',
				};
			}

			const url = new URL(`${BACKEND_URL}/api/sync/pull`);
			if (this.lastSyncAt) {
				url.searchParams.set('since', this.lastSyncAt);
			}

			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...authHeader,
				},
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				return {
					success: false,
					created: 0,
					updated: 0,
					deleted: 0,
					conflicts: [],
					error: error.message || 'Pull failed',
				};
			}

			const result = await response.json();
			const db = SQLiteService.getInstance();

			let created = 0;
			let updated = 0;
			let deleted = 0;

			// Process server meals
			for (const serverMeal of result.meals) {
				const existingMeal = await db.getMealByCloudId(serverMeal.cloudId);

				if (existingMeal) {
					// Update existing local meal
					await db.updateMealFromServer(existingMeal.id!, serverMeal);
					updated++;
				} else {
					// Create new local meal
					await db.createMealFromServer(serverMeal);
					created++;
				}
			}

			// Process deletions
			for (const cloudId of result.deletedIds) {
				await db.deleteByCloudId(cloudId);
				deleted++;
			}

			this.lastSyncAt = result.serverTime;

			return {
				success: true,
				created,
				updated,
				deleted,
				conflicts: [],
			};
		} catch (error) {
			console.error('Pull sync error:', error);
			return {
				success: false,
				created: 0,
				updated: 0,
				deleted: 0,
				conflicts: [],
				error: error instanceof Error ? error.message : 'Pull failed',
			};
		}
	}

	/**
	 * Map local meal to sync format
	 */
	private mapMealToSyncFormat(meal: Meal): LocalMealForSync {
		return {
			localId: meal.id!,
			cloudId: meal.cloud_id || undefined,
			foodName: meal.analysis_result
				? JSON.parse(meal.analysis_result).foodName || 'Unbekanntes Gericht'
				: 'Unbekanntes Gericht',
			imageUrl: meal.photo_url || undefined,
			calories: meal.total_calories || undefined,
			protein: meal.total_protein || undefined,
			carbohydrates: meal.total_carbs || undefined,
			fat: meal.total_fat || undefined,
			fiber: meal.total_fiber || undefined,
			sugar: meal.total_sugar || undefined,
			servingSize: undefined,
			mealType: meal.meal_type || undefined,
			analysisStatus: meal.analysis_status || 'completed',
			healthScore: meal.health_score || undefined,
			healthCategory: meal.health_category || undefined,
			notes: meal.user_notes || undefined,
			userRating: meal.user_rating || undefined,
			foodItems: meal.analysis_result ? JSON.parse(meal.analysis_result).foodItems : [],
			version: meal.version || 1,
			createdAt: meal.created_at || new Date().toISOString(),
			updatedAt: meal.updated_at || new Date().toISOString(),
		};
	}
}
