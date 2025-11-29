import * as SQLite from 'expo-sqlite';
import { Meal, FoodItem, CreateMealInput, MealWithItems } from '../../types/Database';

export class SQLiteService {
	private static instance: SQLiteService;
	private db: SQLite.SQLiteDatabase | null = null;

	private constructor() {}

	public static getInstance(): SQLiteService {
		if (!SQLiteService.instance) {
			SQLiteService.instance = new SQLiteService();
		}
		return SQLiteService.instance;
	}

	public async initialize(): Promise<void> {
		try {
			this.db = await SQLite.openDatabaseAsync('nutriphi.db');
			await this.createTables();
			await this.createIndices();
		} catch (error) {
			console.error('Database initialization failed:', error);
			throw error;
		}
	}

	public async getDatabase(): Promise<SQLite.SQLiteDatabase> {
		if (!this.db) {
			throw new Error('Database not initialized. Call initialize() first.');
		}
		return this.db;
	}

	private async createTables(): Promise<void> {
		if (!this.db) throw new Error('Database not initialized');

		// Meals Table
		await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cloud_id TEXT UNIQUE,
        user_id TEXT,
        sync_status TEXT DEFAULT 'local',
        version INTEGER DEFAULT 1,
        last_sync_at TEXT,
        photo_path TEXT NOT NULL,
        photo_url TEXT,
        photo_size INTEGER,
        photo_dimensions TEXT,
        timestamp TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        meal_type TEXT,
        location TEXT,
        analysis_result TEXT,
        analysis_confidence REAL,
        analysis_status TEXT DEFAULT 'pending',
        total_calories INTEGER,
        total_protein REAL,
        total_carbs REAL,
        total_fat REAL,
        total_fiber REAL,
        total_sugar REAL,
        health_score REAL,
        health_category TEXT,
        user_notes TEXT,
        user_modified INTEGER DEFAULT 0,
        user_rating INTEGER,
        api_provider TEXT DEFAULT 'gemini',
        api_cost REAL,
        processing_time INTEGER
      );
    `);

		// Food Items Table
		await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS food_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cloud_id TEXT UNIQUE,
        meal_id INTEGER NOT NULL,
        sync_status TEXT DEFAULT 'local',
        version INTEGER DEFAULT 1,
        name TEXT NOT NULL,
        category TEXT,
        portion_size TEXT,
        calories INTEGER,
        protein REAL,
        carbs REAL,
        fat REAL,
        fiber REAL,
        sugar REAL,
        confidence REAL,
        bounding_box TEXT,
        is_organic INTEGER DEFAULT 0,
        is_processed INTEGER DEFAULT 0,
        allergens TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
      );
    `);

		// Sync Metadata Table
		await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        cloud_id TEXT,
        last_sync_at TEXT,
        conflict_data TEXT,
        retry_count INTEGER DEFAULT 0,
        PRIMARY KEY (table_name, record_id)
      );
    `);

		// User Preferences Table
		await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT DEFAULT 'string',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
	}

	private async createIndices(): Promise<void> {
		if (!this.db) throw new Error('Database not initialized');

		await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_meals_timestamp ON meals(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_meals_sync_status ON meals(sync_status);
      CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON meals(meal_type);
      CREATE INDEX IF NOT EXISTS idx_food_items_meal ON food_items(meal_id);
      CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);
      CREATE INDEX IF NOT EXISTS idx_sync_metadata_status ON sync_metadata(table_name, last_sync_at);
    `);
	}

	// CRUD Operations für Meals
	public async createMeal(input: CreateMealInput): Promise<number> {
		if (!this.db) throw new Error('Database not initialized');

		const now = new Date().toISOString();
		const dimensions = input.photo_dimensions ? JSON.stringify(input.photo_dimensions) : null;

		const result = await this.db.runAsync(
			`
      INSERT INTO meals (
        photo_path, photo_size, photo_dimensions, timestamp, 
        created_at, updated_at, meal_type, location, latitude, longitude, location_accuracy,
        user_notes, analysis_status, api_provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
			[
				input.photo_path,
				input.photo_size || null,
				dimensions,
				now,
				now,
				now,
				input.meal_type || null,
				input.location || null,
				input.latitude || null,
				input.longitude || null,
				input.location_accuracy || null,
				input.user_notes || null,
				input.analysis_status || 'pending',
				input.api_provider || 'gemini',
			]
		);

		return result.lastInsertRowId;
	}

	public async getMealById(id: number): Promise<Meal | null> {
		if (!this.db) throw new Error('Database not initialized');

		const result = await this.db.getFirstAsync<Meal>('SELECT * FROM meals WHERE id = ?', [id]);

		return result || null;
	}

	public async getMealWithItems(id: number): Promise<MealWithItems | null> {
		if (!this.db) throw new Error('Database not initialized');

		const meal = await this.getMealById(id);
		if (!meal) return null;

		const foodItems = await this.db.getAllAsync<FoodItem>(
			'SELECT * FROM food_items WHERE meal_id = ? ORDER BY created_at',
			[id]
		);

		return {
			...meal,
			food_items: foodItems,
		};
	}

	public async getAllMeals(limit: number = 50, offset: number = 0): Promise<Meal[]> {
		if (!this.db) throw new Error('Database not initialized');

		return await this.db.getAllAsync<Meal>(
			'SELECT * FROM meals ORDER BY timestamp DESC LIMIT ? OFFSET ?',
			[limit, offset]
		);
	}

	public async getAllMealsWithItems(
		limit: number = 50,
		offset: number = 0
	): Promise<MealWithItems[]> {
		if (!this.db) throw new Error('Database not initialized');

		const meals = await this.getAllMeals(limit, offset);
		const mealsWithItems: MealWithItems[] = [];

		for (const meal of meals) {
			const foodItems = await this.db.getAllAsync<FoodItem>(
				'SELECT * FROM food_items WHERE meal_id = ? ORDER BY created_at',
				[meal.id!]
			);

			mealsWithItems.push({
				...meal,
				food_items: foodItems,
			});
		}

		return mealsWithItems;
	}

	public async updateMeal(id: number, updates: Partial<Meal>): Promise<void> {
		if (!this.db) throw new Error('Database not initialized');

		const updateFields = Object.keys(updates).filter((key) => key !== 'id');
		const updateValues = updateFields.map((key) => updates[key as keyof Meal]);

		const setClause = updateFields.map((key) => `${key} = ?`).join(', ');

		await this.db.runAsync(
			`
      UPDATE meals SET ${setClause}, updated_at = datetime('now') WHERE id = ?
    `,
			[...updateValues, id]
		);
	}

	public async deleteMeal(id: number): Promise<void> {
		if (!this.db) throw new Error('Database not initialized');

		await this.db.runAsync('DELETE FROM meals WHERE id = ?', [id]);
	}

	// CRUD Operations für Food Items
	public async createFoodItem(foodItem: Omit<FoodItem, 'id' | 'created_at'>): Promise<number> {
		if (!this.db) throw new Error('Database not initialized');

		const result = await this.db.runAsync(
			`
      INSERT INTO food_items (
        meal_id, name, category, portion_size, calories, protein, carbs, fat,
        fiber, sugar, confidence, bounding_box, is_organic, is_processed, allergens
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
			[
				foodItem.meal_id,
				foodItem.name,
				foodItem.category,
				foodItem.portion_size,
				foodItem.calories || null,
				foodItem.protein || null,
				foodItem.carbs || null,
				foodItem.fat || null,
				foodItem.fiber || null,
				foodItem.sugar || null,
				foodItem.confidence || null,
				foodItem.bounding_box || null,
				foodItem.is_organic,
				foodItem.is_processed,
				foodItem.allergens || null,
			]
		);

		return result.lastInsertRowId;
	}

	public async createFoodItemsBatch(foodItems: CreateFoodItemInput[]): Promise<number[]> {
		if (!this.db) throw new Error('Database not initialized');
		if (foodItems.length === 0) return [];

		const insertedIds: number[] = [];

		// Use a transaction for better performance
		await this.db.execAsync('BEGIN TRANSACTION');

		try {
			for (const foodItem of foodItems) {
				const result = await this.db.runAsync(
					`INSERT INTO food_items (
            meal_id, name, category, portion_size, 
            calories, protein, carbs, fat, fiber, sugar,
            confidence, bounding_box, is_organic, is_processed, allergens
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[
						foodItem.meal_id,
						foodItem.name,
						foodItem.category || null,
						foodItem.portion_size || null,
						foodItem.calories || null,
						foodItem.protein || null,
						foodItem.carbs || null,
						foodItem.fat || null,
						foodItem.fiber || null,
						foodItem.sugar || null,
						foodItem.confidence || null,
						foodItem.bounding_box || null,
						foodItem.is_organic,
						foodItem.is_processed,
						foodItem.allergens || null,
					]
				);
				insertedIds.push(result.lastInsertRowId);
			}

			await this.db.execAsync('COMMIT');
			return insertedIds;
		} catch (error) {
			await this.db.execAsync('ROLLBACK');
			throw error;
		}
	}

	public async getFoodItemsByMealId(mealId: number): Promise<FoodItem[]> {
		if (!this.db) throw new Error('Database not initialized');

		return await this.db.getAllAsync<FoodItem>(
			'SELECT * FROM food_items WHERE meal_id = ? ORDER BY created_at',
			[mealId]
		);
	}

	// Statistiken und Aggregationen
	public async getMealStats(days: number = 7): Promise<{
		totalMeals: number;
		avgCalories: number;
		avgHealthScore: number;
	}> {
		if (!this.db) throw new Error('Database not initialized');

		const result = await this.db.getFirstAsync<{
			count: number;
			avg_calories: number;
			avg_health_score: number;
		}>(`
      SELECT 
        COUNT(*) as count,
        AVG(total_calories) as avg_calories,
        AVG(health_score) as avg_health_score
      FROM meals 
      WHERE timestamp >= datetime('now', '-${days} days')
      AND analysis_status = 'completed'
    `);

		return {
			totalMeals: result?.count || 0,
			avgCalories: Math.round(result?.avg_calories || 0),
			avgHealthScore: Math.round((result?.avg_health_score || 0) * 10) / 10,
		};
	}

	public async searchMeals(query: string): Promise<Meal[]> {
		if (!this.db) throw new Error('Database not initialized');

		return await this.db.getAllAsync<Meal>(
			`
      SELECT DISTINCT m.* FROM meals m
      LEFT JOIN food_items fi ON m.id = fi.meal_id
      WHERE m.user_notes LIKE ? 
         OR m.meal_type LIKE ?
         OR fi.name LIKE ?
      ORDER BY m.timestamp DESC
    `,
			[`%${query}%`, `%${query}%`, `%${query}%`]
		);
	}

	// Hilfsmethoden
	public async close(): Promise<void> {
		if (this.db) {
			await this.db.closeAsync();
			this.db = null;
		}
	}

	public async executeRaw(sql: string, params: any[] = []): Promise<any> {
		if (!this.db) throw new Error('Database not initialized');
		return await this.db.runAsync(sql, params);
	}

	// ==================== Sync Methods ====================

	/**
	 * Get all unsynced meals (sync_status = 'local' or 'pending')
	 */
	public async getUnsyncedMeals(): Promise<Meal[]> {
		if (!this.db) throw new Error('Database not initialized');

		return await this.db.getAllAsync<Meal>(
			`SELECT * FROM meals WHERE sync_status IN ('local', 'pending') ORDER BY created_at DESC`
		);
	}

	/**
	 * Get meal by cloud ID
	 */
	public async getMealByCloudId(cloudId: string): Promise<Meal | null> {
		if (!this.db) throw new Error('Database not initialized');

		const result = await this.db.getFirstAsync<Meal>('SELECT * FROM meals WHERE cloud_id = ?', [
			cloudId,
		]);

		return result || null;
	}

	/**
	 * Update cloud_id for a local meal
	 */
	public async updateCloudId(localId: number, cloudId: string): Promise<void> {
		if (!this.db) throw new Error('Database not initialized');

		await this.db.runAsync(
			`UPDATE meals SET cloud_id = ?, updated_at = datetime('now') WHERE id = ?`,
			[cloudId, localId]
		);
	}

	/**
	 * Mark a meal as synced
	 */
	public async markSynced(localId: number): Promise<void> {
		if (!this.db) throw new Error('Database not initialized');

		await this.db.runAsync(
			`UPDATE meals SET sync_status = 'synced', last_sync_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
			[localId]
		);
	}

	/**
	 * Delete a meal by cloud ID
	 */
	public async deleteByCloudId(cloudId: string): Promise<void> {
		if (!this.db) throw new Error('Database not initialized');

		await this.db.runAsync('DELETE FROM meals WHERE cloud_id = ?', [cloudId]);
	}

	/**
	 * Create a meal from server data
	 */
	public async createMealFromServer(serverMeal: any): Promise<number> {
		if (!this.db) throw new Error('Database not initialized');

		const analysisResult = serverMeal.foodItems
			? JSON.stringify({
					foodName: serverMeal.foodName,
					foodItems: serverMeal.foodItems,
				})
			: null;

		const result = await this.db.runAsync(
			`INSERT INTO meals (
        cloud_id, sync_status, version, last_sync_at,
        photo_path, photo_url, timestamp, created_at, updated_at,
        meal_type, analysis_result, analysis_status,
        total_calories, total_protein, total_carbs, total_fat, total_fiber, total_sugar,
        health_score, health_category, user_notes, user_rating
      ) VALUES (?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				serverMeal.cloudId,
				'synced',
				1,
				serverMeal.imageUrl || '',
				serverMeal.imageUrl || null,
				serverMeal.createdAt,
				serverMeal.createdAt,
				serverMeal.updatedAt,
				serverMeal.mealType || null,
				analysisResult,
				serverMeal.analysisStatus || 'completed',
				serverMeal.calories || null,
				serverMeal.protein || null,
				serverMeal.carbohydrates || null,
				serverMeal.fat || null,
				serverMeal.fiber || null,
				serverMeal.sugar || null,
				serverMeal.healthScore || null,
				serverMeal.healthCategory || null,
				serverMeal.notes || null,
				serverMeal.userRating || null,
			]
		);

		return result.lastInsertRowId;
	}

	/**
	 * Update a local meal from server data
	 */
	public async updateMealFromServer(localId: number, serverMeal: any): Promise<void> {
		if (!this.db) throw new Error('Database not initialized');

		const analysisResult = serverMeal.foodItems
			? JSON.stringify({
					foodName: serverMeal.foodName,
					foodItems: serverMeal.foodItems,
				})
			: null;

		await this.db.runAsync(
			`UPDATE meals SET
        sync_status = 'synced',
        last_sync_at = datetime('now'),
        photo_url = ?,
        meal_type = ?,
        analysis_result = ?,
        analysis_status = ?,
        total_calories = ?,
        total_protein = ?,
        total_carbs = ?,
        total_fat = ?,
        total_fiber = ?,
        total_sugar = ?,
        health_score = ?,
        health_category = ?,
        user_notes = ?,
        user_rating = ?,
        updated_at = ?
      WHERE id = ?`,
			[
				serverMeal.imageUrl || null,
				serverMeal.mealType || null,
				analysisResult,
				serverMeal.analysisStatus || 'completed',
				serverMeal.calories || null,
				serverMeal.protein || null,
				serverMeal.carbohydrates || null,
				serverMeal.fat || null,
				serverMeal.fiber || null,
				serverMeal.sugar || null,
				serverMeal.healthScore || null,
				serverMeal.healthCategory || null,
				serverMeal.notes || null,
				serverMeal.userRating || null,
				serverMeal.updatedAt,
				localId,
			]
		);
	}

	/**
	 * Get meals modified since a given timestamp
	 */
	public async getMealsModifiedSince(since: string): Promise<Meal[]> {
		if (!this.db) throw new Error('Database not initialized');

		return await this.db.getAllAsync<Meal>(
			`SELECT * FROM meals WHERE updated_at > ? ORDER BY updated_at ASC`,
			[since]
		);
	}
}
