import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import {
	type Database,
	meals,
	eq,
	and,
	gte,
	lte,
	desc,
	type Meal as DbMeal,
} from '@manacore/nutriphi-database';
import { DATABASE_TOKEN } from '../database/database.module';
import { StorageService } from '../storage/storage.service';
import { GeminiService, NutritionAnalysis } from '../gemini/gemini.service';
import { CreateMealDto, UpdateMealDto, UploadMealDto } from './dto/analyze-meal.dto';

export interface Meal {
	id: string;
	user_id: string;
	food_name: string;
	image_url?: string;
	calories: number;
	protein: number;
	carbohydrates: number;
	fat: number;
	fiber: number;
	sugar: number;
	sodium: number;
	serving_size: string;
	meal_type?: string;
	notes?: string;
	created_at: string;
	updated_at: string;
}

export interface DailySummary {
	date: string;
	totalCalories: number;
	totalProtein: number;
	totalCarbohydrates: number;
	totalFat: number;
	totalFiber: number;
	totalSugar: number;
	totalSodium: number;
	mealCount: number;
}

@Injectable()
export class MealsService {
	private readonly logger = new Logger(MealsService.name);

	constructor(
		@Inject(DATABASE_TOKEN) private readonly db: Database,
		private geminiService: GeminiService,
		private storageService: StorageService
	) {}

	private mapDbMealToMeal(dbMeal: DbMeal): Meal {
		return {
			id: dbMeal.id,
			user_id: dbMeal.userId,
			food_name: dbMeal.foodName,
			image_url: dbMeal.imageUrl ?? undefined,
			calories: dbMeal.calories ?? 0,
			protein: dbMeal.protein ?? 0,
			carbohydrates: dbMeal.carbohydrates ?? 0,
			fat: dbMeal.fat ?? 0,
			fiber: dbMeal.fiber ?? 0,
			sugar: dbMeal.sugar ?? 0,
			sodium: dbMeal.sodium ?? 0,
			serving_size: dbMeal.servingSize ?? '',
			meal_type: dbMeal.mealType ?? undefined,
			notes: dbMeal.notes ?? undefined,
			created_at: dbMeal.createdAt.toISOString(),
			updated_at: dbMeal.updatedAt.toISOString(),
		};
	}

	async analyzeImage(imageBase64: string): Promise<NutritionAnalysis> {
		return this.geminiService.analyzeFoodImage(imageBase64);
	}

	async analyzeText(description: string): Promise<NutritionAnalysis> {
		return this.geminiService.analyzeFoodText(description);
	}

	/**
	 * Upload an image to storage, analyze it, and create a meal
	 */
	async uploadAndAnalyzeMeal(dto: UploadMealDto, userId: string): Promise<Meal> {
		this.logger.log(`Uploading and analyzing meal for user: ${userId}`);

		// Step 1: Upload image to storage
		let imageUrl: string | undefined;
		let storagePath: string | undefined;

		try {
			const uploadResult = await this.storageService.uploadBase64(dto.imageBase64, 'meals');
			imageUrl = uploadResult.url;
			storagePath = uploadResult.key;
			this.logger.log(`Image uploaded: ${storagePath}`);
		} catch (error) {
			this.logger.warn('Storage not configured, skipping image upload', error);
		}

		// Step 2: Analyze the image with Gemini
		// Extract base64 data without the data URL prefix
		let base64Data = dto.imageBase64;
		if (base64Data.includes(',')) {
			base64Data = base64Data.split(',')[1];
		}

		const analysis = await this.geminiService.analyzeFoodImage(base64Data);

		// Step 3: Create the meal record
		const [result] = await this.db
			.insert(meals)
			.values({
				userId,
				foodName: analysis.foodName || 'Unbekanntes Gericht',
				imageUrl,
				storagePath,
				calories: analysis.calories,
				protein: analysis.protein,
				carbohydrates: analysis.carbohydrates,
				fat: analysis.fat,
				fiber: analysis.fiber,
				sugar: analysis.sugar,
				servingSize: analysis.servingSize || '1 Portion',
				mealType: dto.mealType,
				analysisStatus: 'completed',
			})
			.returning();

		this.logger.log(`Meal created: ${result.id}`);

		return this.mapDbMealToMeal(result);
	}

	async createMeal(dto: CreateMealDto, userId: string): Promise<Meal> {
		this.logger.log(`Creating meal for user: ${userId}`);

		const [result] = await this.db
			.insert(meals)
			.values({
				userId,
				foodName: dto.foodName,
				imageUrl: dto.imageUrl,
				calories: dto.calories,
				protein: dto.protein,
				carbohydrates: dto.carbohydrates,
				fat: dto.fat,
				fiber: dto.fiber,
				sugar: dto.sugar,
				sodium: dto.sodium,
				servingSize: dto.servingSize,
				mealType: dto.mealType,
				notes: dto.notes,
			})
			.returning();

		return this.mapDbMealToMeal(result);
	}

	async getMealsByUser(userId: string, date?: string): Promise<Meal[]> {
		this.logger.log(`Fetching meals for user: ${userId}`);

		let query;

		if (date) {
			const startOfDay = new Date(date);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(date);
			endOfDay.setHours(23, 59, 59, 999);

			query = this.db
				.select()
				.from(meals)
				.where(
					and(
						eq(meals.userId, userId),
						gte(meals.createdAt, startOfDay),
						lte(meals.createdAt, endOfDay)
					)
				)
				.orderBy(desc(meals.createdAt));
		} else {
			query = this.db
				.select()
				.from(meals)
				.where(eq(meals.userId, userId))
				.orderBy(desc(meals.createdAt));
		}

		const results = await query;
		return results.map(this.mapDbMealToMeal);
	}

	async getMealById(id: string, userId: string): Promise<Meal> {
		const [result] = await this.db
			.select()
			.from(meals)
			.where(and(eq(meals.id, id), eq(meals.userId, userId)));

		if (!result) {
			throw new NotFoundException(`Meal with id ${id} not found`);
		}

		return this.mapDbMealToMeal(result);
	}

	async updateMeal(id: string, dto: UpdateMealDto, userId: string): Promise<Meal> {
		this.logger.log(`Updating meal: ${id} for user: ${userId}`);

		const updateData: Partial<typeof meals.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (dto.foodName !== undefined) updateData.foodName = dto.foodName;
		if (dto.calories !== undefined) updateData.calories = dto.calories;
		if (dto.protein !== undefined) updateData.protein = dto.protein;
		if (dto.carbohydrates !== undefined) updateData.carbohydrates = dto.carbohydrates;
		if (dto.fat !== undefined) updateData.fat = dto.fat;
		if (dto.fiber !== undefined) updateData.fiber = dto.fiber;
		if (dto.sugar !== undefined) updateData.sugar = dto.sugar;
		if (dto.sodium !== undefined) updateData.sodium = dto.sodium;
		if (dto.servingSize !== undefined) updateData.servingSize = dto.servingSize;
		if (dto.mealType !== undefined) updateData.mealType = dto.mealType;
		if (dto.notes !== undefined) updateData.notes = dto.notes;

		const [result] = await this.db
			.update(meals)
			.set(updateData)
			.where(and(eq(meals.id, id), eq(meals.userId, userId)))
			.returning();

		if (!result) {
			throw new NotFoundException(`Meal with id ${id} not found`);
		}

		return this.mapDbMealToMeal(result);
	}

	async deleteMeal(id: string, userId: string): Promise<void> {
		this.logger.log(`Deleting meal: ${id} for user: ${userId}`);

		const result = await this.db
			.delete(meals)
			.where(and(eq(meals.id, id), eq(meals.userId, userId)))
			.returning();

		if (result.length === 0) {
			throw new NotFoundException(`Meal with id ${id} not found`);
		}
	}

	async getDailySummary(userId: string, date: string): Promise<DailySummary> {
		const userMeals = await this.getMealsByUser(userId, date);

		const summary: DailySummary = {
			date,
			totalCalories: 0,
			totalProtein: 0,
			totalCarbohydrates: 0,
			totalFat: 0,
			totalFiber: 0,
			totalSugar: 0,
			totalSodium: 0,
			mealCount: userMeals.length,
		};

		for (const meal of userMeals) {
			summary.totalCalories += meal.calories || 0;
			summary.totalProtein += meal.protein || 0;
			summary.totalCarbohydrates += meal.carbohydrates || 0;
			summary.totalFat += meal.fat || 0;
			summary.totalFiber += meal.fiber || 0;
			summary.totalSugar += meal.sugar || 0;
			summary.totalSodium += meal.sodium || 0;
		}

		return summary;
	}
}
