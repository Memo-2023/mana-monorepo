import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Types from NutriPhi backend
export interface DetectedFood {
	name: string;
	quantity: string;
	calories: number;
	confidence: number;
}

export interface NutritionData {
	calories: number;
	protein: number;
	carbohydrates: number;
	fat: number;
	fiber: number;
	sugar: number;
}

export interface AIAnalysisResult {
	foods: DetectedFood[];
	totalNutrition: NutritionData;
	description: string;
	confidence: number;
	warnings?: string[];
	suggestions?: string[];
}

export interface UserGoals {
	id: string;
	dailyCalories: number;
	dailyProtein?: number | null;
	dailyCarbs?: number | null;
	dailyFat?: number | null;
}

export interface Meal {
	id: string;
	date: Date;
	mealType: string;
	description: string;
	confidence: number;
}

export interface MealWithNutrition extends Meal {
	nutrition?: NutritionData;
}

export interface DailySummary {
	date: Date;
	meals: MealWithNutrition[];
	totalNutrition: NutritionData;
	goals?: UserGoals;
	progress: {
		calories: { current: number; target: number; percentage: number };
		protein?: { current: number; target: number; percentage: number };
		carbs?: { current: number; target: number; percentage: number };
		fat?: { current: number; target: number; percentage: number };
	};
}

export interface WeeklyStats {
	startDate: Date;
	endDate: Date;
	days: {
		date: Date;
		totalCalories: number;
		totalProtein: number;
		totalCarbs: number;
		totalFat: number;
		mealCount: number;
		goalsMet: boolean;
	}[];
	averages: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
	};
}

export interface FavoriteMeal {
	id: string;
	name: string;
	nutrition: NutritionData;
	usageCount: number;
}

export interface Recommendation {
	id: string;
	type: 'hint' | 'coaching';
	message: string;
}

@Injectable()
export class NutriPhiService {
	private readonly logger = new Logger(NutriPhiService.name);
	private readonly backendUrl: string;
	private readonly apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl =
			this.configService.get<string>('nutriphi.backendUrl') || 'http://localhost:3023';
		this.apiPrefix = this.configService.get<string>('nutriphi.apiPrefix') || '/api/v1';
	}

	private getUrl(path: string): string {
		return `${this.backendUrl}${this.apiPrefix}${path}`;
	}

	private async request<T>(
		path: string,
		options: RequestInit & { token?: string } = {}
	): Promise<T> {
		const { token, ...fetchOptions } = options;
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...(options.headers as Record<string, string>),
		};

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const response = await fetch(this.getUrl(path), {
			...fetchOptions,
			headers,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`NutriPhi API error (${response.status}): ${error}`);
		}

		return response.json();
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(this.getUrl('/health'));
			return response.ok;
		} catch {
			return false;
		}
	}

	async analyzePhoto(
		imageBase64: string,
		mimeType: string,
		token: string
	): Promise<AIAnalysisResult> {
		return this.request<AIAnalysisResult>('/analysis/photo', {
			method: 'POST',
			body: JSON.stringify({ image: imageBase64, mimeType }),
			token,
		});
	}

	async analyzeText(description: string, token: string): Promise<AIAnalysisResult> {
		return this.request<AIAnalysisResult>('/analysis/text', {
			method: 'POST',
			body: JSON.stringify({ description }),
			token,
		});
	}

	async createMeal(
		data: {
			description: string;
			mealType: string;
			inputType: 'photo' | 'text';
			nutrition: NutritionData;
			confidence: number;
		},
		token: string
	): Promise<Meal> {
		return this.request<Meal>('/meals', {
			method: 'POST',
			body: JSON.stringify(data),
			token,
		});
	}

	async getDailySummary(date: string, token: string): Promise<DailySummary> {
		return this.request<DailySummary>(`/stats/daily?date=${date}`, { token });
	}

	async getWeeklyStats(date: string, token: string): Promise<WeeklyStats> {
		return this.request<WeeklyStats>(`/stats/weekly?date=${date}`, { token });
	}

	async getGoals(token: string): Promise<UserGoals | null> {
		try {
			return await this.request<UserGoals>('/goals', { token });
		} catch {
			return null;
		}
	}

	async setGoals(
		goals: {
			dailyCalories: number;
			dailyProtein?: number;
			dailyCarbs?: number;
			dailyFat?: number;
		},
		token: string
	): Promise<UserGoals> {
		return this.request<UserGoals>('/goals', {
			method: 'POST',
			body: JSON.stringify(goals),
			token,
		});
	}

	async getFavorites(token: string): Promise<FavoriteMeal[]> {
		return this.request<FavoriteMeal[]>('/favorites', { token });
	}

	async createFavorite(
		data: { name: string; nutrition: NutritionData },
		token: string
	): Promise<FavoriteMeal> {
		return this.request<FavoriteMeal>('/favorites', {
			method: 'POST',
			body: JSON.stringify(data),
			token,
		});
	}

	async getRecommendations(token: string): Promise<Recommendation[]> {
		return this.request<Recommendation[]>('/recommendations', { token });
	}
}
