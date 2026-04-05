import { createLocalStore, type BaseRecord } from '@mana/local-store';

// ─── Types ──────────────────────────────────────────────────

export interface LocalGameStats extends BaseRecord {
	gameId: string;
	highScore: number;
	lastScore: number;
	gamesPlayed: number;
	totalPlayTime: number;
	lastPlayed: string;
}

export interface LocalGeneratedGame extends BaseRecord {
	title: string;
	description: string;
	htmlCode: string;
	prompt: string;
	model: string;
	iterationCount: number;
}

export interface LocalFavorite extends BaseRecord {
	gameId: string;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const gamesStore = createLocalStore({
	appId: 'arcade',
	collections: [
		{
			name: 'gameStats',
			indexes: ['gameId', 'highScore'],
		},
		{
			name: 'generatedGames',
			indexes: ['title'],
		},
		{
			name: 'favorites',
			indexes: ['gameId'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const gameStatsCollection = gamesStore.collection<LocalGameStats>('gameStats');
export const generatedGameCollection = gamesStore.collection<LocalGeneratedGame>('generatedGames');
export const favoriteCollection = gamesStore.collection<LocalFavorite>('favorites');
