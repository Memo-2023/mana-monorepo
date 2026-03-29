// Template für Stats-Integration in Spiele
// Dieses Template zeigt, wie man die Stats-Integration in ein Spiel einbaut

// 1. Game ID definieren (muss mit dem Slug in games.ts übereinstimmen)
const GAME_ID = 'dein-spiel-slug';

// 2. Beim Spielstart senden
window.addEventListener('load', () => {
	window.parent.postMessage(
		{
			type: 'GAME_LOADED',
			gameId: GAME_ID,
		},
		'*'
	);
});

// 3. Bei Score-Updates senden
function updateScore(newScore) {
	score = newScore;
	// UI Update...

	window.parent.postMessage(
		{
			type: 'GAME_EVENT',
			gameId: GAME_ID,
			event: 'SCORE_UPDATE',
			data: { score: score },
		},
		'*'
	);
}

// 4. Bei Game Over senden
function gameOver() {
	// Game Over Logik...

	window.parent.postMessage(
		{
			type: 'GAME_EVENT',
			gameId: GAME_ID,
			event: 'GAME_OVER',
			data: { score: finalScore },
		},
		'*'
	);

	// Achievement Beispiele
	if (score >= 100) {
		window.parent.postMessage(
			{
				type: 'GAME_EVENT',
				gameId: GAME_ID,
				event: 'ACHIEVEMENT_UNLOCKED',
				data: {
					achievement: {
						id: 'first-100',
						name: 'Erste 100',
						description: '100 Punkte erreicht!',
					},
				},
			},
			'*'
		);
	}
}

// 5. Optional: Bei Spielende/Verlassen
window.addEventListener('beforeunload', () => {
	window.parent.postMessage(
		{
			type: 'GAME_ENDED',
			gameId: GAME_ID,
		},
		'*'
	);
});
