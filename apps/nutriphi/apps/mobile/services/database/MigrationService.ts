import * as SQLite from 'expo-sqlite';

export interface Migration {
	version: number;
	name: string;
	up: (db: SQLite.SQLiteDatabase) => Promise<void>;
	down?: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

export class MigrationService {
	private static instance: MigrationService;
	private db: SQLite.SQLiteDatabase | null = null;

	private constructor() {}

	public static getInstance(): MigrationService {
		if (!MigrationService.instance) {
			MigrationService.instance = new MigrationService();
		}
		return MigrationService.instance;
	}

	public setDatabase(db: SQLite.SQLiteDatabase): void {
		this.db = db;
	}

	private migrations: Migration[] = [
		{
			version: 1,
			name: 'Initial Schema',
			up: async (db: SQLite.SQLiteDatabase) => {
				// Diese Migration ist bereits in SQLiteService.createTables() implementiert
				// Hier nur als Referenz für zukünftige Migrationen
			},
		},
		{
			version: 2,
			name: 'Add indexes for performance',
			up: async (db: SQLite.SQLiteDatabase) => {
				await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_meals_analysis_status ON meals(analysis_status);
          CREATE INDEX IF NOT EXISTS idx_meals_health_category ON meals(health_category);
          CREATE INDEX IF NOT EXISTS idx_food_items_confidence ON food_items(confidence DESC);
        `);
			},
		},
		{
			version: 3,
			name: 'Add user preferences table',
			up: async (db: SQLite.SQLiteDatabase) => {
				await db.execAsync(`
          CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            type TEXT DEFAULT 'string',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
          );
        `);
			},
		},
		{
			version: 4,
			name: 'Add GPS location fields to meals',
			up: async (db: SQLite.SQLiteDatabase) => {
				await db.execAsync(`
          ALTER TABLE meals ADD COLUMN latitude REAL;
          ALTER TABLE meals ADD COLUMN longitude REAL;
          ALTER TABLE meals ADD COLUMN location_accuracy REAL;
        `);

				// Create index for geo queries
				await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_meals_location ON meals(latitude, longitude);
        `);
			},
		},
	];

	public async initializeMigrationTable(): Promise<void> {
		if (!this.db) throw new Error('Database not set');

		await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `);
	}

	public async getCurrentVersion(): Promise<number> {
		if (!this.db) throw new Error('Database not set');

		try {
			const result = await this.db.getFirstAsync<{ version: number }>(
				'SELECT MAX(version) as version FROM schema_migrations'
			);
			return result?.version || 0;
		} catch {
			// Tabelle existiert noch nicht
			return 0;
		}
	}

	public async runMigrations(): Promise<void> {
		if (!this.db) throw new Error('Database not set');

		await this.initializeMigrationTable();
		const currentVersion = await this.getCurrentVersion();

		console.log(`Current database version: ${currentVersion}`);

		const pendingMigrations = this.migrations.filter(
			(migration) => migration.version > currentVersion
		);

		if (pendingMigrations.length === 0) {
			console.log('No pending migrations');
			return;
		}

		console.log(`Running ${pendingMigrations.length} migrations...`);

		for (const migration of pendingMigrations) {
			try {
				console.log(`Applying migration ${migration.version}: ${migration.name}`);

				await this.db.execAsync('BEGIN TRANSACTION;');
				await migration.up(this.db);

				await this.db.runAsync('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [
					migration.version,
					migration.name,
				]);

				await this.db.execAsync('COMMIT;');

				console.log(`Migration ${migration.version} completed successfully`);
			} catch (err) {
				console.error(`Migration ${migration.version} failed:`, err);
				await this.db.execAsync('ROLLBACK;');
				throw err;
			}
		}

		console.log('All migrations completed successfully');
	}

	public async rollbackToVersion(targetVersion: number): Promise<void> {
		if (!this.db) throw new Error('Database not set');

		const currentVersion = await this.getCurrentVersion();

		if (targetVersion >= currentVersion) {
			console.log('Target version is not lower than current version');
			return;
		}

		const migrationsToRollback = this.migrations
			.filter((m) => m.version > targetVersion && m.version <= currentVersion)
			.sort((a, b) => b.version - a.version); // Descending order

		console.log(`Rolling back ${migrationsToRollback.length} migrations...`);

		for (const migration of migrationsToRollback) {
			if (!migration.down) {
				console.warn(`No rollback defined for migration ${migration.version}`);
				continue;
			}

			try {
				console.log(`Rolling back migration ${migration.version}: ${migration.name}`);

				await this.db.execAsync('BEGIN TRANSACTION;');
				await migration.down(this.db);

				await this.db.runAsync('DELETE FROM schema_migrations WHERE version = ?', [
					migration.version,
				]);

				await this.db.execAsync('COMMIT;');

				console.log(`Migration ${migration.version} rolled back successfully`);
			} catch (err) {
				console.error(`Rollback of migration ${migration.version} failed:`, err);
				await this.db.execAsync('ROLLBACK;');
				throw err;
			}
		}

		console.log(`Rollback to version ${targetVersion} completed`);
	}

	public async addMigration(migration: Migration): Promise<void> {
		// Überprüfe, ob die Version bereits existiert
		const existingMigration = this.migrations.find((m) => m.version === migration.version);
		if (existingMigration) {
			throw new Error(`Migration version ${migration.version} already exists`);
		}

		this.migrations.push(migration);
		this.migrations.sort((a, b) => a.version - b.version);
	}

	public getAppliedMigrations(): Promise<{ version: number; name: string; applied_at: string }[]> {
		if (!this.db) throw new Error('Database not set');

		return this.db.getAllAsync(
			'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
		);
	}
}
