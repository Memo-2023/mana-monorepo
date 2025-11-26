import { env } from '$env/dynamic/public';

const API_BASE = env.PUBLIC_BACKEND_URL || 'http://localhost:3002';

export interface NutritionAnalysis {
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  confidence: number;
  ingredients?: string[];
  healthTips?: string[];
}

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

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async analyzeImage(imageBase64: string): Promise<NutritionAnalysis> {
    return this.request('/meals/analyze/image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    });
  }

  async analyzeText(description: string): Promise<NutritionAnalysis> {
    return this.request('/meals/analyze/text', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async getMeals(userId: string, date?: string): Promise<Meal[]> {
    const params = date ? `?date=${date}` : '';
    return this.request(`/meals/user/${userId}${params}`);
  }

  async getDailySummary(userId: string, date: string): Promise<DailySummary> {
    return this.request(`/meals/user/${userId}/summary?date=${date}`);
  }

  async createMeal(meal: Partial<Meal> & { userId: string }): Promise<Meal> {
    return this.request('/meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    });
  }

  async updateMeal(id: string, updates: Partial<Meal>): Promise<Meal> {
    return this.request(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMeal(id: string): Promise<void> {
    await this.request(`/meals/${id}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return this.request('/health');
  }
}

export const api = new ApiService();
