import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	gameStatsCollection,
	generatedGameCollection,
	favoriteCollection,
	type LocalGameStats,
	type LocalGeneratedGame,
	type LocalFavorite,
} from './local-store';

export function useAllGameStats() {
	return useLiveQueryWithDefault(async () => gameStatsCollection.getAll(), [] as LocalGameStats[]);
}

export function useAllGeneratedGames() {
	return useLiveQueryWithDefault(async () => {
		const games = await generatedGameCollection.getAll();
		return games.reverse();
	}, [] as LocalGeneratedGame[]);
}

export function useAllFavorites() {
	return useLiveQueryWithDefault(async () => favoriteCollection.getAll(), [] as LocalFavorite[]);
}
