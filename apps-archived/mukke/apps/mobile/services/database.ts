import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (db) return db;
	db = await SQLite.openDatabaseAsync('mukke.db');
	await initializeDatabase(db);
	return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
	await database.execAsync(`
		PRAGMA journal_mode = WAL;
		PRAGMA foreign_keys = ON;

		CREATE TABLE IF NOT EXISTS songs (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			artist TEXT,
			album TEXT,
			albumArtist TEXT,
			genre TEXT,
			trackNumber INTEGER,
			discNumber INTEGER,
			year INTEGER,
			duration REAL,
			filePath TEXT NOT NULL,
			fileSize INTEGER,
			coverArtPath TEXT,
			addedAt TEXT NOT NULL,
			lastPlayedAt TEXT,
			playCount INTEGER DEFAULT 0,
			favorite INTEGER DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS playlists (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			coverArtPath TEXT,
			createdAt TEXT NOT NULL,
			updatedAt TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS playlist_songs (
			id TEXT PRIMARY KEY,
			playlistId TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
			songId TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
			sortOrder INTEGER NOT NULL,
			addedAt TEXT NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
		CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album);
		CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
		CREATE INDEX IF NOT EXISTS idx_songs_favorite ON songs(favorite);
		CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlistId);
	`);
}

export async function closeDatabase(): Promise<void> {
	if (db) {
		await db.closeAsync();
		db = null;
	}
}
