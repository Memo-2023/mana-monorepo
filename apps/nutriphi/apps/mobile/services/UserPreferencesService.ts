import { SQLiteService } from './database/SQLiteService';

export interface UserPreferences {
  locationEnabled: boolean;
  locationPermissionAsked: boolean;
  defaultMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  healthGoalCalories?: number;
  healthGoalProtein?: number;
  healthGoalCarbs?: number;
  healthGoalFat?: number;
  notificationsEnabled: boolean;
  reminderTimes: string[]; // Array of times like ["08:00", "12:30", "19:00"]
  theme: 'light' | 'dark' | 'system';
  language: 'de' | 'en';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  locationEnabled: true,
  locationPermissionAsked: false,
  defaultMealType: 'lunch',
  notificationsEnabled: true,
  reminderTimes: [],
  theme: 'system',
  language: 'de',
};

export class UserPreferencesService {
  private static instance: UserPreferencesService;
  private dbService: SQLiteService;
  private cachedPreferences: UserPreferences | null = null;

  private constructor() {
    this.dbService = SQLiteService.getInstance();
  }

  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  public async initialize(): Promise<void> {
    // Load preferences into cache
    await this.loadPreferences();
  }

  private async loadPreferences(): Promise<UserPreferences> {
    try {
      const db = await this.dbService.getDatabase();
      
      // Check if table exists first
      const tableExists = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='user_preferences'"
      );
      
      if (!tableExists) {
        console.log('User preferences table does not exist yet, using defaults');
        this.cachedPreferences = { ...DEFAULT_PREFERENCES };
        return this.cachedPreferences;
      }

      const rows = await db.getAllAsync<{ key: string; value: string; type: string }>(
        'SELECT key, value, type FROM user_preferences'
      );

      const preferences = { ...DEFAULT_PREFERENCES };

      for (const row of rows) {
        const value = this.parseValue(row.value, row.type);
        (preferences as any)[row.key] = value;
      }

      this.cachedPreferences = preferences;
      return preferences;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      this.cachedPreferences = { ...DEFAULT_PREFERENCES };
      return this.cachedPreferences;
    }
  }

  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value);
      case 'array':
        return JSON.parse(value);
      case 'string':
      default:
        return value;
    }
  }

  private getValueType(value: any): string {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';
    return 'string';
  }

  public async getPreferences(): Promise<UserPreferences> {
    if (!this.cachedPreferences) {
      await this.loadPreferences();
    }
    return this.cachedPreferences!;
  }

  public async updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> {
    try {
      // Update cache immediately for responsive UI
      if (!this.cachedPreferences) {
        this.cachedPreferences = { ...DEFAULT_PREFERENCES };
      }
      this.cachedPreferences[key] = value;

      const db = await this.dbService.getDatabase();
      
      // Check if table exists
      const tableExists = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='user_preferences'"
      );
      
      if (!tableExists) {
        console.log('User preferences table does not exist yet, cache updated only');
        return;
      }

      const type = this.getValueType(value);
      const serializedValue = type === 'array' ? JSON.stringify(value) : String(value);

      await db.runAsync(
        `INSERT OR REPLACE INTO user_preferences (key, value, type, updated_at) 
         VALUES (?, ?, ?, datetime('now'))`,
        [key, serializedValue, type]
      );
    } catch (error) {
      console.error(`Failed to update preference ${key}:`, error);
      // Don't throw - we already updated the cache
    }
  }

  public async updateMultiplePreferences(updates: Partial<UserPreferences>): Promise<void> {
    const db = await this.dbService.getDatabase();

    try {
      await db.execAsync('BEGIN TRANSACTION');

      for (const [key, value] of Object.entries(updates)) {
        const type = this.getValueType(value);
        const serializedValue = type === 'array' ? JSON.stringify(value) : String(value);

        await db.runAsync(
          `INSERT OR REPLACE INTO user_preferences (key, value, type, updated_at) 
           VALUES (?, ?, ?, datetime('now'))`,
          [key, serializedValue, type]
        );
      }

      await db.execAsync('COMMIT');

      // Update cache
      if (this.cachedPreferences) {
        Object.assign(this.cachedPreferences, updates);
      }
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  public async resetToDefaults(): Promise<void> {
    try {
      const db = await this.dbService.getDatabase();
      await db.execAsync('DELETE FROM user_preferences');
      this.cachedPreferences = { ...DEFAULT_PREFERENCES };
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      throw error;
    }
  }

  // Convenience methods
  public async isLocationEnabled(): Promise<boolean> {
    const prefs = await this.getPreferences();
    return prefs.locationEnabled;
  }

  public async setLocationEnabled(enabled: boolean): Promise<void> {
    await this.updatePreference('locationEnabled', enabled);
  }

  public async hasAskedLocationPermission(): Promise<boolean> {
    const prefs = await this.getPreferences();
    return prefs.locationPermissionAsked;
  }

  public async markLocationPermissionAsked(): Promise<void> {
    await this.updatePreference('locationPermissionAsked', true);
  }
}
