import { gameStatsCollection, type LocalGameStats } from '$lib/data/local-store';

export interface GameMessage {
	type: 'GAME_EVENT' | 'GAME_LOADED' | 'GAME_ENDED';
	gameId: string;
	event?: string;
	data?: Record<string, unknown>;
}

export function initGameCommunication(gameSlug: string) {
	let gameStartTime: number | null = null;

	async function getOrCreateStats(gameId: string): Promise<LocalGameStats | null> {
		const all = await gameStatsCollection.getAll();
		return all.find((s) => s.gameId === gameId) || null;
	}

	async function updateGameStats(gameId: string, update: Partial<LocalGameStats>) {
		const existing = await getOrCreateStats(gameId);

		if (existing) {
			await gameStatsCollection.update(existing.id, {
				...update,
				lastPlayed: new Date().toISOString(),
			});
		} else {
			await gameStatsCollection.insert({
				gameId,
				highScore: 0,
				lastScore: 0,
				gamesPlayed: 0,
				totalPlayTime: 0,
				lastPlayed: new Date().toISOString(),
				...update,
			});
		}
	}

	function handleMessage(event: MessageEvent) {
		if (event.origin !== window.location.origin) return;

		const message = event.data as GameMessage;
		if (!message.type || message.gameId !== gameSlug) return;

		switch (message.type) {
			case 'GAME_LOADED':
				gameStartTime = Date.now();
				getOrCreateStats(gameSlug).then((stats) => {
					updateGameStats(gameSlug, {
						gamesPlayed: (stats?.gamesPlayed || 0) + 1,
					});
				});
				break;

			case 'GAME_EVENT':
				handleGameEvent(gameSlug, message.event!, message.data);
				break;

			case 'GAME_ENDED':
				if (gameStartTime) {
					const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
					getOrCreateStats(gameSlug).then((stats) => {
						updateGameStats(gameSlug, {
							totalPlayTime: (stats?.totalPlayTime || 0) + playTime,
						});
					});
					gameStartTime = null;
				}
				break;
		}
	}

	function handleBeforeUnload() {
		if (gameStartTime) {
			const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
			getOrCreateStats(gameSlug).then((stats) => {
				updateGameStats(gameSlug, {
					totalPlayTime: (stats?.totalPlayTime || 0) + playTime,
				});
			});
		}
	}

	window.addEventListener('message', handleMessage);
	window.addEventListener('beforeunload', handleBeforeUnload);

	return () => {
		window.removeEventListener('message', handleMessage);
		window.removeEventListener('beforeunload', handleBeforeUnload);
	};

	async function handleGameEvent(
		gameId: string,
		event: string,
		data: Record<string, unknown> | undefined
	) {
		if (!data) return;

		switch (event) {
			case 'SCORE_UPDATE':
			case 'GAME_OVER': {
				const score = data.score as number;
				if (score) {
					const stats = await getOrCreateStats(gameId);
					await updateGameStats(gameId, {
						lastScore: score,
						highScore: Math.max(score, stats?.highScore || 0),
					});
				}
				break;
			}
		}
	}
}
