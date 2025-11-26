/**
 * Hybrid storage solution for Supabase authentication
 * Uses localStorage in browser environments and memory storage in SSR
 * This avoids issues with AsyncStorage during server-side rendering
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageData {
  [key: string]: string;
}

class HybridStorageService {
  private memoryStorage: StorageData = {};
  private isAsyncStorageAvailable: boolean = false;

  constructor() {
    // Check if we're in an environment where AsyncStorage is available
    this.checkAsyncStorageAvailability();
  }

  private async checkAsyncStorageAvailability(): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        this.isAsyncStorageAvailable = false;
        return;
      }
      
      // Try to access AsyncStorage
      this.isAsyncStorageAvailable = typeof AsyncStorage !== 'undefined';
      
      // If available, try to load any existing auth data into memory
      if (this.isAsyncStorageAvailable) {
        await this.syncFromAsyncStorage();
      }
    } catch (error) {
      console.warn('AsyncStorage not available, falling back to memory storage');
      this.isAsyncStorageAvailable = false;
    }
  }

  private async syncFromAsyncStorage(): Promise<void> {
    if (typeof window === 'undefined') {
      // Skip AsyncStorage sync in SSR environment
      return;
    }
    
    try {
      // Get all keys that start with 'supabase.auth'
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => key.startsWith('supabase.auth'));
      
      if (authKeys.length > 0) {
        const keyValuePairs = await AsyncStorage.multiGet(authKeys);
        keyValuePairs.forEach(([key, value]) => {
          if (value) {
            this.memoryStorage[key] = value;
          }
        });
      }
    } catch (error) {
      console.error('Error syncing from AsyncStorage:', error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    // First check memory storage
    const memoryValue = this.memoryStorage[key];
    if (memoryValue) return memoryValue;
    
    // If not in memory and AsyncStorage is available, try to get from there
    if (this.isAsyncStorageAvailable && typeof window !== 'undefined') {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          // Update memory cache
          this.memoryStorage[key] = value;
          return value;
        }
      } catch (error) {
        console.error('Error reading from AsyncStorage:', error);
      }
    }
    
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    // Always update memory storage
    this.memoryStorage[key] = value;
    
    // If AsyncStorage is available, also persist there
    if (this.isAsyncStorageAvailable && typeof window !== 'undefined') {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error('Error writing to AsyncStorage:', error);
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    // Remove from memory storage
    delete this.memoryStorage[key];
    
    // If AsyncStorage is available, also remove from there
    if (this.isAsyncStorageAvailable && typeof window !== 'undefined') {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from AsyncStorage:', error);
      }
    }
  }
}

// Create a singleton instance
const hybridStorage = new HybridStorageService();

export default hybridStorage;
