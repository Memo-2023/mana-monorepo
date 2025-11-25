import { create } from 'zustand';
import { Meal, MealWithItems, CreateMealInput, CreateFoodItemInput } from '../types/Database';
import { SQLiteService } from '../services/database/SQLiteService';

interface MealState {
  meals: MealWithItems[];
  isLoading: boolean;
  error: string | null;
  selectedMeal: MealWithItems | null;

  // Actions
  loadMeals: () => Promise<void>;
  loadMealById: (id: number) => Promise<void>;
  createMeal: (input: CreateMealInput) => Promise<number>;
  updateMeal: (id: number, updates: Partial<Meal>) => Promise<void>;
  deleteMeal: (id: number) => Promise<void>;
  createFoodItem: (input: CreateFoodItemInput) => Promise<number>;
  createFoodItemsBatch: (inputs: CreateFoodItemInput[]) => Promise<number[]>;
  searchMeals: (query: string) => Promise<void>;
  clearError: () => void;
  setSelectedMeal: (meal: MealWithItems | null) => void;
  clearAllMeals: () => void;
}

export const useMealStore = create<MealState>((set, get) => ({
  meals: [],
  isLoading: false,
  error: null,
  selectedMeal: null,

  loadMeals: async () => {
    set({ isLoading: true, error: null });
    try {
      const dbService = SQLiteService.getInstance();
      const meals = await dbService.getAllMealsWithItems(50, 0);
      set({ meals, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load meals',
        isLoading: false,
      });
    }
  },

  loadMealById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const dbService = SQLiteService.getInstance();
      const meal = await dbService.getMealWithItems(id);
      console.log(`Loaded meal ${id} with photo_path:`, meal?.photo_path);
      set({ selectedMeal: meal, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load meal',
        isLoading: false,
      });
    }
  },

  createMeal: async (input: CreateMealInput) => {
    set({ isLoading: true, error: null });
    try {
      const dbService = SQLiteService.getInstance();
      const mealId = await dbService.createMeal(input);

      // Reload meals to update the list
      await get().loadMeals();

      set({ isLoading: false });
      return mealId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create meal',
        isLoading: false,
      });
      throw error;
    }
  },

  updateMeal: async (id: number, updates: Partial<Meal>) => {
    set({ isLoading: true, error: null });
    try {
      const dbService = SQLiteService.getInstance();
      await dbService.updateMeal(id, updates);

      // If this is a completed analysis, reload the meal with all food items
      if (updates.analysis_status === 'completed') {
        const updatedMealWithItems = await dbService.getMealWithItems(id);

        // Update meals in store with the full meal data
        const meals = get().meals.map((meal) => (meal.id === id ? updatedMealWithItems : meal));

        // Update selected meal if it's the one being updated
        const selectedMeal = get().selectedMeal;
        if (selectedMeal && selectedMeal.id === id) {
          set({ selectedMeal: updatedMealWithItems });
        }

        set({ meals, isLoading: false });
      } else {
        // For other updates, just update the fields we have
        const meals = get().meals.map((meal) => (meal.id === id ? { ...meal, ...updates } : meal));

        // Update selected meal if it's the one being updated
        const selectedMeal = get().selectedMeal;
        if (selectedMeal && selectedMeal.id === id) {
          set({ selectedMeal: { ...selectedMeal, ...updates } });
        }

        set({ meals, isLoading: false });
      }

      console.log(`Meal ${id} updated with:`, updates);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update meal',
        isLoading: false,
      });
    }
  },

  deleteMeal: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const dbService = SQLiteService.getInstance();
      await dbService.deleteMeal(id);

      // Remove from meals array
      const meals = get().meals.filter((meal) => meal.id !== id);

      // Clear selected meal if it was deleted
      const selectedMeal = get().selectedMeal;
      if (selectedMeal && selectedMeal.id === id) {
        set({ selectedMeal: null });
      }

      set({ meals, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete meal',
        isLoading: false,
      });
    }
  },

  searchMeals: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const dbService = SQLiteService.getInstance();
      const meals =
        query.trim() === ''
          ? await dbService.getAllMeals(50, 0)
          : await dbService.searchMeals(query);
      set({ meals, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search meals',
        isLoading: false,
      });
    }
  },

  createFoodItem: async (input: CreateFoodItemInput) => {
    try {
      const dbService = SQLiteService.getInstance();
      const foodItemId = await dbService.createFoodItem(input);
      return foodItemId;
    } catch (error) {
      console.error('Failed to create food item:', error);
      throw error;
    }
  },

  createFoodItemsBatch: async (inputs: CreateFoodItemInput[]) => {
    try {
      const dbService = SQLiteService.getInstance();
      const foodItemIds = await dbService.createFoodItemsBatch(inputs);
      return foodItemIds;
    } catch (error) {
      console.error('Failed to create food items batch:', error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  setSelectedMeal: (meal: MealWithItems | null) => set({ selectedMeal: meal }),

  clearAllMeals: () => set({ meals: [], selectedMeal: null, error: null }),
}));
