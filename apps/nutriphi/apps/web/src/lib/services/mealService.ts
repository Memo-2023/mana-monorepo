/**
 * Meal Service for Nutriphi Web
 * Handles all meal-related API calls
 */

import { env } from '$lib/config/env';
import { tokenManager } from './tokenManager';
import type { Meal, MealWithItems, FoodItem, DailySummary, MealFilters } from '$lib/types/meal';

const API_BASE = env.backend.url;

class MealService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await tokenManager.getValidToken();

    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all meals for a user
   */
  async getMeals(userId: string, filters?: MealFilters): Promise<Meal[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.set('date', filters.date);
    if (filters?.mealType) params.set('mealType', filters.mealType);
    if (filters?.minHealthScore) params.set('minHealthScore', String(filters.minHealthScore));

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Meal[]>(`/meals/user/${userId}${query}`);
  }

  /**
   * Get a single meal with its food items
   */
  async getMealById(id: string): Promise<MealWithItems> {
    return this.request<MealWithItems>(`/meals/${id}`);
  }

  /**
   * Get daily nutrition summary
   */
  async getDailySummary(userId: string, date: string): Promise<DailySummary> {
    return this.request<DailySummary>(`/meals/user/${userId}/summary?date=${date}`);
  }

  /**
   * Create a new meal
   */
  async createMeal(meal: Partial<Meal> & { user_id: string }): Promise<Meal> {
    return this.request<Meal>('/meals', {
      method: 'POST',
      body: JSON.stringify(meal)
    });
  }

  /**
   * Upload a meal photo and trigger analysis
   */
  async uploadMealPhoto(data: {
    photoUrl: string;
    storagePath: string;
    userId: string;
    mealType?: string;
  }): Promise<{ id: string; status: string }> {
    return this.request('/meals/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Update a meal
   */
  async updateMeal(id: string, updates: Partial<Meal>): Promise<Meal> {
    return this.request<Meal>(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Delete a meal
   */
  async deleteMeal(id: string): Promise<void> {
    await this.request(`/meals/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Analyze a food image
   */
  async analyzeImage(imageBase64: string): Promise<{
    foodName: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    confidence: number;
    ingredients?: string[];
  }> {
    return this.request('/meals/analyze/image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 })
    });
  }

  /**
   * Analyze a food description
   */
  async analyzeText(description: string): Promise<{
    foodName: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    confidence: number;
  }> {
    return this.request('/meals/analyze/text', {
      method: 'POST',
      body: JSON.stringify({ description })
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return this.request('/health');
  }
}

export const mealService = new MealService();
