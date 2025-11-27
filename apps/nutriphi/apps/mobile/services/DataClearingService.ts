import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { SQLiteService } from './database/SQLiteService';
import { PhotoService } from './storage/PhotoService';
import { useMealStore } from '../store/MealStore';
import { useAppStore } from '../store/AppStore';
import { useAuthStore } from '../store/AuthStore';
import { tokenManager } from './auth/tokenManager';

export class DataClearingService {
  private static instance: DataClearingService;

  public static getInstance(): DataClearingService {
    if (!DataClearingService.instance) {
      DataClearingService.instance = new DataClearingService();
    }
    return DataClearingService.instance;
  }

  async clearAllData(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // 1. Clear SQLite database
      await this.clearDatabase();
    } catch (error) {
      errors.push(`Database clearing failed: ${error}`);
    }

    try {
      // 2. Clear photo storage
      await this.clearPhotoStorage();
    } catch (error) {
      errors.push(`Photo storage clearing failed: ${error}`);
    }

    try {
      // 3. Reset Zustand stores
      this.resetZustandStores();
    } catch (error) {
      errors.push(`State reset failed: ${error}`);
    }

    try {
      // 4. Clear AsyncStorage
      await this.clearAsyncStorage();
    } catch (error) {
      errors.push(`AsyncStorage clearing failed: ${error}`);
    }

    try {
      // 5. Sign out and clear auth tokens
      await this.signOutAndClearAuth();
    } catch (error) {
      errors.push(`Auth clearing failed: ${error}`);
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  private async signOutAndClearAuth(): Promise<void> {
    // Sign out from auth store
    await useAuthStore.getState().signOut();
    // Clear all tokens
    await tokenManager.clearTokens();
  }

  private async clearDatabase(): Promise<void> {
    const db = SQLiteService.getInstance();

    // Clear all main tables while preserving structure
    await db.executeRaw('DELETE FROM meals');
    await db.executeRaw('DELETE FROM food_items');
    await db.executeRaw('DELETE FROM sync_metadata');

    // Reset user preferences to defaults but keep the table
    await db.executeRaw('DELETE FROM user_preferences');

    // Don't delete schema_migrations to preserve database version
  }

  private async clearPhotoStorage(): Promise<void> {
    const photosDir = `${FileSystem.documentDirectory}photos/`;

    // Check if photos directory exists
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) return;

    // Get all files in photos directory
    const files = await FileSystem.readDirectoryAsync(photosDir);

    // Delete all photo files
    for (const file of files) {
      const filePath = `${photosDir}${file}`;
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }

    // Also cleanup any temp photos
    await PhotoService.getInstance().cleanupTempPhotos();
  }

  private resetZustandStores(): void {
    // Reset MealStore
    const mealStore = useMealStore.getState();
    mealStore.clearAllMeals();
    mealStore.setSelectedMeal(null);

    // Reset AppStore (but preserve theme preference as it will be handled by AsyncStorage)
    const appStore = useAppStore.getState();
    appStore.resetStats();

    // Reset other app store states except theme
    const currentTheme = appStore.theme;
    appStore.resetToDefaults();
    appStore.setTheme(currentTheme); // Preserve current theme
  }

  private async clearAsyncStorage(): Promise<void> {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();

    // Define keys to clear (all except we might want to preserve some)
    const keysToRemove = keys.filter(
      (key) => key !== 'user-theme-preference' // We might want to preserve theme preference
    );

    // Clear selected keys
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  }

  // Optional: Clear everything including theme preference
  async clearAllDataIncludingTheme(): Promise<{ success: boolean; errors: string[] }> {
    const result = await this.clearAllData();

    try {
      // Also clear theme preference
      await AsyncStorage.removeItem('user-theme-preference');
    } catch (error) {
      result.errors.push(`Theme preference clearing failed: ${error}`);
      result.success = false;
    }

    return result;
  }
}
