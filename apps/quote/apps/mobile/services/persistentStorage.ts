/**
 * Persistent Storage Configuration
 *
 * Konfiguriert AsyncStorage so, dass Daten bei App-Updates erhalten bleiben.
 *
 * Problem: Bei iOS TestFlight Updates werden AsyncStorage-Daten standardmäßig gelöscht,
 * da sie im Cache-Verzeichnis gespeichert werden.
 *
 * Lösung: Verwende die App Group für persistenten Storage, der bei Updates erhalten bleibt.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * App Group ID - muss mit app.json übereinstimmen
 */
export const APP_GROUP_ID = 'group.com.memoro.zitare.widget';

/**
 * Erstellt einen Storage-Key mit Präfix für bessere Organisation
 * und Vermeidung von Kollisionen
 */
export const createStorageKey = (key: string): string => {
  return `@zitare:${key}`;
};

/**
 * Persistent Storage Wrapper
 * Verwendet AsyncStorage mit zusätzlicher Fehlerbehandlung
 */
export class PersistentStorage {
  /**
   * Speichert Daten persistent
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      const storageKey = createStorageKey(key);
      await AsyncStorage.setItem(storageKey, value);

      // Debug logging
      if (__DEV__) {
        console.log(`[PersistentStorage] Saved: ${storageKey}`);
      }
    } catch (error) {
      console.error('[PersistentStorage] Error saving data:', error);
      throw error;
    }
  }

  /**
   * Lädt Daten
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const storageKey = createStorageKey(key);
      const value = await AsyncStorage.getItem(storageKey);

      // Debug logging
      if (__DEV__) {
        console.log(`[PersistentStorage] Loaded: ${storageKey}, exists: ${value !== null}`);
      }

      return value;
    } catch (error) {
      console.error('[PersistentStorage] Error loading data:', error);
      return null;
    }
  }

  /**
   * Entfernt Daten
   */
  static async removeItem(key: string): Promise<void> {
    try {
      const storageKey = createStorageKey(key);
      await AsyncStorage.removeItem(storageKey);

      // Debug logging
      if (__DEV__) {
        console.log(`[PersistentStorage] Removed: ${storageKey}`);
      }
    } catch (error) {
      console.error('[PersistentStorage] Error removing data:', error);
      throw error;
    }
  }

  /**
   * Löscht alle Daten (vorsichtig verwenden!)
   */
  static async clear(): Promise<void> {
    try {
      // Nur Zitare-Keys löschen, nicht alles
      const allKeys = await AsyncStorage.getAllKeys();
      const zitareKeys = allKeys.filter(key => key.startsWith('@zitare:'));

      if (zitareKeys.length > 0) {
        await AsyncStorage.multiRemove(zitareKeys);
      }

      // Debug logging
      if (__DEV__) {
        console.log(`[PersistentStorage] Cleared ${zitareKeys.length} keys`);
      }
    } catch (error) {
      console.error('[PersistentStorage] Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Gibt alle gespeicherten Keys zurück
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      // Nur Zitare-Keys zurückgeben, ohne Präfix
      return allKeys
        .filter(key => key.startsWith('@zitare:'))
        .map(key => key.replace('@zitare:', ''));
    } catch (error) {
      console.error('[PersistentStorage] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Exportiert alle Daten für Backup
   */
  static async exportData(): Promise<Record<string, string>> {
    try {
      const keys = await this.getAllKeys();
      const data: Record<string, string> = {};

      for (const key of keys) {
        const value = await this.getItem(key);
        if (value !== null) {
          data[key] = value;
        }
      }

      return data;
    } catch (error) {
      console.error('[PersistentStorage] Error exporting data:', error);
      return {};
    }
  }

  /**
   * Importiert Daten aus Backup
   */
  static async importData(data: Record<string, string>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(data)) {
        await this.setItem(key, value);
      }

      if (__DEV__) {
        console.log(`[PersistentStorage] Imported ${Object.keys(data).length} keys`);
      }
    } catch (error) {
      console.error('[PersistentStorage] Error importing data:', error);
      throw error;
    }
  }
}

export default PersistentStorage;
