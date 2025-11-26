import { useEffect, useState, useCallback } from 'react';
import { SQLiteService } from '../services/database/SQLiteService';
import { MigrationService } from '../services/database/MigrationService';
import { PhotoService } from '../services/storage/PhotoService';
import { UserPreferencesService } from '../services/UserPreferencesService';
import { useAppStore } from '../store/AppStore';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setInitialized = useAppStore((state) => state.setInitialized);

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  const initializeDatabase = useCallback(async () => {
    try {
      console.log('Initializing database...');

      // Initialize SQLite service
      const dbService = SQLiteService.getInstance();
      await dbService.initialize();

      // Get database instance for migrations
      const db = (dbService as any).db; // Access private db property
      if (db) {
        const migrationService = MigrationService.getInstance();
        migrationService.setDatabase(db);
        await migrationService.runMigrations();
      }

      console.log('Database initialized successfully');

      // Initialize user preferences
      const prefsService = UserPreferencesService.getInstance();
      await prefsService.initialize();
      console.log('User preferences initialized');

      // Clean up temporary photos on app start
      const photoService = PhotoService.getInstance();
      await photoService.cleanupTempPhotos();
      console.log('Temporary photos cleaned up');

      setIsReady(true);
      setInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database initialization failed';
      console.error('Database initialization error:', errorMessage);
      setError(errorMessage);
    }
  }, [setInitialized]);

  const resetDatabase = async () => {
    try {
      setIsReady(false);
      setError(null);

      const dbService = SQLiteService.getInstance();
      await dbService.close();

      // Reinitialize
      await initializeDatabase();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database reset failed';
      setError(errorMessage);
    }
  };

  return {
    isReady,
    error,
    resetDatabase,
    retryInitialization: initializeDatabase,
  };
}
