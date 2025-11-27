/**
 * Automatic Data Backup Service
 *
 * Erstellt automatische Backups von AsyncStorage-Daten, um Datenverlust
 * bei TestFlight-Updates zu vermeiden.
 *
 * Das Problem: Bei iOS TestFlight Updates kann AsyncStorage manchmal gelöscht werden.
 * Die Lösung: Automatisches Backup in einem persistenten Verzeichnis.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const BACKUP_FILENAME = 'zitare-data-backup.json';
const BACKUP_PATH = `${FileSystem.documentDirectory}${BACKUP_FILENAME}`;

export class DataBackupService {
  /**
   * Erstellt ein Backup aller AsyncStorage-Daten
   */
  static async createBackup(): Promise<boolean> {
    try {
      console.log('[DataBackup] Creating backup...');

      // Hole alle Keys
      const allKeys = await AsyncStorage.getAllKeys();

      if (allKeys.length === 0) {
        console.log('[DataBackup] No data to backup');
        return false;
      }

      // Hole alle Werte
      const allData = await AsyncStorage.multiGet(allKeys);

      // Konvertiere zu Objekt
      const backup: Record<string, string> = {};
      allData.forEach(([key, value]) => {
        if (value !== null) {
          backup[key] = value;
        }
      });

      // Speichere als JSON im Documents-Verzeichnis
      // Dieses Verzeichnis wird bei Updates NICHT gelöscht
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        data: backup
      };

      await FileSystem.writeAsStringAsync(
        BACKUP_PATH,
        JSON.stringify(backupData)
      );

      console.log(`[DataBackup] Backup created successfully: ${allKeys.length} keys`);
      return true;
    } catch (error) {
      console.error('[DataBackup] Error creating backup:', error);
      return false;
    }
  }

  /**
   * Stellt Daten aus dem Backup wieder her
   * Wird nur aufgerufen, wenn AsyncStorage leer ist
   */
  static async restoreFromBackup(): Promise<boolean> {
    try {
      console.log('[DataBackup] Checking for backup...');

      // Prüfe ob Backup existiert
      const fileInfo = await FileSystem.getInfoAsync(BACKUP_PATH);

      if (!fileInfo.exists) {
        console.log('[DataBackup] No backup found');
        return false;
      }

      console.log('[DataBackup] Backup found, restoring...');

      // Lade Backup
      const backupContent = await FileSystem.readAsStringAsync(BACKUP_PATH);

      const backup = JSON.parse(backupContent);

      // Validiere Backup-Format
      if (!backup.data || typeof backup.data !== 'object') {
        console.error('[DataBackup] Invalid backup format');
        return false;
      }

      // Restore alle Daten
      const entries = Object.entries(backup.data);

      if (entries.length === 0) {
        console.log('[DataBackup] Backup is empty');
        return false;
      }

      // Verwende multiSet für bessere Performance
      await AsyncStorage.multiSet(entries as [string, string][]);

      console.log(`[DataBackup] Restored ${entries.length} keys from backup`);
      console.log(`[DataBackup] Backup was created: ${backup.timestamp}`);

      return true;
    } catch (error) {
      console.error('[DataBackup] Error restoring from backup:', error);
      return false;
    }
  }

  /**
   * Prüft ob AsyncStorage leer ist (möglicherweise nach Update gelöscht)
   */
  static async isStorageEmpty(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.length === 0;
    } catch (error) {
      console.error('[DataBackup] Error checking storage:', error);
      return true;
    }
  }

  /**
   * Automatischer Check und Restore beim App-Start
   * Sollte SEHR FRÜH beim App-Start aufgerufen werden
   */
  static async checkAndRestoreIfNeeded(): Promise<void> {
    try {
      console.log('[DataBackup] Auto-check on app start...');

      // Prüfe ob Storage leer ist
      const isEmpty = await this.isStorageEmpty();

      if (isEmpty) {
        console.log('[DataBackup] Storage is empty, attempting restore...');
        const restored = await this.restoreFromBackup();

        if (restored) {
          console.log('[DataBackup] ✅ Data successfully restored from backup!');
        } else {
          console.log('[DataBackup] ⚠️ No backup available or restore failed');
        }
      } else {
        console.log('[DataBackup] Storage has data, creating new backup...');
        await this.createBackup();
      }
    } catch (error) {
      console.error('[DataBackup] Error in auto-check:', error);
    }
  }

  /**
   * Gibt Backup-Info zurück
   */
  static async getBackupInfo(): Promise<{
    exists: boolean;
    timestamp?: string;
    keyCount?: number;
    size?: number;
  } | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(BACKUP_PATH);

      if (!fileInfo.exists) {
        return { exists: false };
      }

      // Lade Backup-Metadata
      const backupContent = await FileSystem.readAsStringAsync(BACKUP_PATH);

      const backup = JSON.parse(backupContent);

      return {
        exists: true,
        timestamp: backup.timestamp,
        keyCount: Object.keys(backup.data).length,
        size: fileInfo.size
      };
    } catch (error) {
      console.error('[DataBackup] Error getting backup info:', error);
      return null;
    }
  }

  /**
   * Löscht das Backup (z.B. beim Reset)
   */
  static async deleteBackup(): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(BACKUP_PATH);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(BACKUP_PATH);
        console.log('[DataBackup] Backup deleted');
      }
    } catch (error) {
      console.error('[DataBackup] Error deleting backup:', error);
    }
  }
}

export default DataBackupService;
