export interface Game {
	id: string;
	title: string;
	description: string;
	slug: string;
	htmlFile: string;
	thumbnail?: string;
	tags: string[];
	difficulty: 'Einfach' | 'Mittel' | 'Schwer';
	complexity: 'Minimal' | 'Einfach' | 'Mittel' | 'Komplex';
	controls: string;
	codeStats?: {
		total: number;
		code: number;
		comments: number;
	};
	community?: boolean;
	author?: string;
	submittedAt?: string;
}

export const games: Game[] = [
	{
		id: '1',
		title: 'Snake',
		description:
			'Der Klassiker! Steuere die Schlange und sammle Nahrung, aber vermeide die roten Felder!',
		slug: 'snake',
		htmlFile: '/games/snake_game.html',
		thumbnail: '/screenshots/snake.jpg',
		tags: ['Arcade', 'Klassiker', 'Retro'],
		difficulty: 'Einfach',
		complexity: 'Komplex',
		controls: 'Pfeiltasten oder WASD zum Steuern',
		codeStats: { total: 604, code: 338, comments: 192 },
	},
	{
		id: '2',
		title: 'Space Defender',
		description:
			'Verteidige dein Raumschiff gegen Wellen von Aliens. Die Schwierigkeit steigt mit der Zeit!',
		slug: 'space-defender',
		htmlFile: '/games/space_defender_game.html',
		thumbnail: '/screenshots/space-defenders.jpg',
		tags: ['Shooter', 'Arcade', 'Action'],
		difficulty: 'Mittel',
		complexity: 'Mittel',
		controls: 'A/D oder Pfeiltasten zum Bewegen, Leertaste zum Schießen',
		codeStats: { total: 436, code: 348, comments: 32 },
	},
	{
		id: '3',
		title: 'Gravity Painter',
		description:
			'Ein kreatives Physik-Puzzle! Setze Gravitationspunkte und lenke Partikel zu den Zielen.',
		slug: 'gravity-painter',
		htmlFile: '/games/gravity_painter.html',
		thumbnail: '/screenshots/gravity-painter.jpg',
		tags: ['Puzzle', 'Physik', 'Kreativ'],
		difficulty: 'Schwer',
		complexity: 'Mittel',
		controls: 'Klicke für Gravitationspunkte, Leertaste für Partikel',
		codeStats: { total: 426, code: 348, comments: 21 },
	},
	{
		id: '4',
		title: 'Bounce & Catch Tutorial',
		description:
			'Ein einfaches Lernspiel, das die Grundlagen der Spieleentwicklung zeigt. Perfekt für Anfänger!',
		slug: 'bounce-catch-tutorial',
		htmlFile: '/games/bounce_catch_tutorial.html',
		thumbnail: '/screenshots/bounce-catch.jpg',
		tags: ['Tutorial', 'Lernspiel', 'Arcade'],
		difficulty: 'Einfach',
		complexity: 'Einfach',
		controls: 'Mausbewegung zum Steuern des Paddles',
		codeStats: { total: 437, code: 289, comments: 87 },
	},
	{
		id: '5',
		title: 'Neon Maze Runner',
		description:
			'Navigiere durch prozedural generierte Labyrinthe! Sammle Diamanten, nutze Power-ups und finde den Ausgang.',
		slug: 'neon-maze-runner',
		htmlFile: '/games/neon_maze_runner.html',
		thumbnail: '/screenshots/neon-maze-runner.jpg',
		tags: ['Puzzle', 'Labyrinth', 'Arcade'],
		difficulty: 'Mittel',
		complexity: 'Komplex',
		controls: 'WASD oder Pfeiltasten zum Bewegen',
		codeStats: { total: 832, code: 644, comments: 69 },
	},
	{
		id: '6',
		title: 'Rhythm Defender',
		description:
			'Verteidige dich im Takt der Musik! Drücke die richtigen Tasten im perfekten Timing für maximale Combos.',
		slug: 'rhythm-defender',
		htmlFile: '/games/rhythm_defender.html',
		thumbnail: '/screenshots/rhythm-defender.jpg',
		tags: ['Rhythmus', 'Musik', 'Arcade'],
		difficulty: 'Mittel',
		complexity: 'Komplex',
		controls: 'A, S, D, F Tasten im Rhythmus drücken',
		codeStats: { total: 741, code: 584, comments: 56 },
	},
	{
		id: '7',
		title: 'Click Race',
		description: 'Das schnellste Spiel! Klicke 30 mal so schnell du kannst. Wie schnell bist du?',
		slug: 'click-race',
		htmlFile: '/games/click_race.html',
		thumbnail: '/screenshots/click-race.jpg',
		tags: ['Geschwindigkeit', 'Minimal', 'Arcade'],
		difficulty: 'Einfach',
		complexity: 'Minimal',
		controls: 'Klicke auf das rote Quadrat',
		codeStats: { total: 111, code: 88, comments: 23 },
	},
	{
		id: '8',
		title: 'Color Memory',
		description:
			'Merke dir die Farbreihenfolge! Ein klassisches Gedächtnisspiel das immer schwerer wird.',
		slug: 'color-memory',
		htmlFile: '/games/color_memory.html',
		thumbnail: '/screenshots/color-memory.jpg',
		tags: ['Gedächtnis', 'Minimal', 'Puzzle'],
		difficulty: 'Einfach',
		complexity: 'Minimal',
		controls: 'Klicke die Farben in der richtigen Reihenfolge',
		codeStats: { total: 86, code: 86, comments: 0 },
	},
	{
		id: '9',
		title: 'Reaction Test',
		description:
			'Wie schnell sind deine Reflexe? Klicke so schnell wie möglich wenn der Bildschirm grün wird!',
		slug: 'reaction-test',
		htmlFile: '/games/reaction_test.html',
		thumbnail: '/screenshots/reaction-test.jpg',
		tags: ['Reaktion', 'Minimal', 'Test'],
		difficulty: 'Einfach',
		complexity: 'Minimal',
		controls: 'Klicke wenn der Bildschirm grün wird',
		codeStats: { total: 78, code: 78, comments: 0 },
	},
	{
		id: '10',
		title: 'Asteroid Dash',
		description:
			'Fliege durch gefährliche Asteroidenfelder! Sammle Energie-Kristalle, nutze Power-ups und weiche den rotierenden Asteroiden aus.',
		slug: 'asteroid-dash',
		htmlFile: '/games/asteroid_dash.html',
		thumbnail: '/screenshots/asteroid-dash.jpg',
		tags: ['Action', 'Arcade', 'Weltraum'],
		difficulty: 'Mittel',
		complexity: 'Mittel',
		controls: 'WASD oder Pfeiltasten zum Fliegen, Leertaste für Boost',
		codeStats: { total: 485, code: 428, comments: 57 },
	},
	{
		id: '11',
		title: 'Fish Catcher',
		description:
			'Fange Fische mit deinem Boot! Verschiedene Fischarten bringen unterschiedliche Punkte.',
		slug: 'fish-catcher',
		htmlFile: '/games/fish_catcher.html',
		thumbnail: '/screenshots/fish-catcher.jpg',
		tags: ['Arcade', 'Familie', 'Entspannend'],
		difficulty: 'Einfach',
		complexity: 'Einfach',
		controls: 'A/D oder Pfeiltasten zum Bewegen',
		codeStats: { total: 362, code: 321, comments: 41 },
	},
	{
		id: '12',
		title: 'Balloon Pop',
		description:
			'Platze bunte Ballons bevor sie entkommen! Verschiedene Ballonarten, Power-ups und Combo-System.',
		slug: 'balloon-pop',
		htmlFile: '/games/balloon_pop.html',
		thumbnail: '/screenshots/balloon-pop.jpg',
		tags: ['Geschicklichkeit', 'Familie', 'Bunt'],
		difficulty: 'Einfach',
		complexity: 'Einfach',
		controls: 'Maus zum Klicken auf Ballons',
		codeStats: { total: 398, code: 351, comments: 47 },
	},
	{
		id: '13',
		title: 'Word Scramble',
		description:
			'Entschlüssele durcheinandergewürfelte Wörter! Mit 5 Kategorien, Combo-System und steigender Schwierigkeit.',
		slug: 'word-scramble',
		htmlFile: '/games/word_scramble.html',
		tags: ['Puzzle', 'Wortspiel', 'Bildung'],
		difficulty: 'Mittel',
		complexity: 'Mittel',
		controls: 'Tastatur zum Eingeben, Maus zum Klicken auf Buchstaben',
		codeStats: { total: 850, code: 720, comments: 130 },
	},
	{
		id: '14',
		title: 'Memory Card Match',
		description:
			'Das klassische Memory-Spiel! Finde alle Kartenpaare mit Emojis. Drei Schwierigkeitsstufen.',
		slug: 'memory-card-match',
		htmlFile: '/games/memory_card_match.html',
		tags: ['Gedächtnis', 'Kartenspiel', 'Familie'],
		difficulty: 'Einfach',
		complexity: 'Einfach',
		controls: 'Maus zum Aufdecken der Karten',
		codeStats: { total: 415, code: 350, comments: 0 },
	},
	{
		id: '15',
		title: 'Turbo Racer',
		description:
			'Drift durch die Kurven und stelle Bestzeiten auf! Mit realistischer Drift-Physik und Nitro-Boost.',
		slug: 'turbo-racer',
		htmlFile: '/games/turbo_racer.html',
		tags: ['Rennen', 'Action', 'Arcade'],
		difficulty: 'Mittel',
		complexity: 'Mittel',
		controls: 'WASD oder Pfeiltasten zum Fahren, Leertaste für Boost',
		codeStats: { total: 680, code: 620, comments: 60 },
	},
	{
		id: '16',
		title: 'Card Stack Rush',
		description:
			'Sortiere Karten blitzschnell auf die richtigen Stapel! Mit wechselnden Regeln und Combo-System.',
		slug: 'card-stack-rush',
		htmlFile: '/games/card_stack_rush.html',
		tags: ['Kartenspiel', 'Geschwindigkeit', 'Arcade'],
		difficulty: 'Mittel',
		complexity: 'Einfach',
		controls: 'Drag & Drop oder Klicken zum Platzieren',
		codeStats: { total: 520, code: 480, comments: 0 },
	},
	{
		id: '17',
		title: 'Flappy Mana',
		description:
			'Fliege durch Röhren und sammle Punkte! Ein Flappy Bird Klon mit Partikeleffekten.',
		slug: 'flappy-mana',
		htmlFile: '/games/flappy_mana.html',
		tags: ['Arcade', 'Geschicklichkeit', 'Endless'],
		difficulty: 'Mittel',
		complexity: 'Einfach',
		controls: 'Klick oder Leertaste zum Fliegen',
		codeStats: { total: 450, code: 430, comments: 20 },
	},
	{
		id: '18',
		title: 'Mana Runner',
		description:
			'Laufe und springe durch magische Welten! Sammle Mana-Kristalle und weiche Hindernissen aus.',
		slug: 'mana-runner',
		htmlFile: '/games/mana_runner.html',
		tags: ['Jump n Run', 'Arcade', 'Endless'],
		difficulty: 'Mittel',
		complexity: 'Mittel',
		controls: 'Leertaste zum Springen, Doppelsprung nach 10 Kristallen',
		codeStats: { total: 600, code: 580, comments: 20 },
	},
	{
		id: '19',
		title: 'Mana Defense',
		description:
			'Verteidige deinen Mana-Kristall! Baue Türme, plane deine Strategie und überlebe 20 Wellen.',
		slug: 'mana-defense',
		htmlFile: '/games/mana_defense.html',
		tags: ['Tower Defense', 'Strategie', 'Aufbau'],
		difficulty: 'Schwer',
		complexity: 'Komplex',
		controls: 'Maus zum Platzieren, 1-3 für Turmauswahl, S zum Verkaufen',
		codeStats: { total: 900, code: 850, comments: 50 },
	},
	{
		id: '20',
		title: 'Mana Factory',
		description:
			'Baue die größte Mana-Produktionsanlage! Ein Idle-Game mit Upgrades und Prestige-System.',
		slug: 'mana-factory',
		htmlFile: '/games/mana_factory.html',
		tags: ['Idle', 'Incremental', 'Aufbau'],
		difficulty: 'Einfach',
		complexity: 'Mittel',
		controls: 'Maus zum Klicken und Kaufen',
		codeStats: { total: 800, code: 750, comments: 50 },
	},
	{
		id: '21',
		title: 'Puzzle Blocks',
		description:
			'Klassisches Tetris-Gameplay! Stapele fallende Blöcke, vervollständige Reihen und erreiche den höchsten Score.',
		slug: 'puzzle-blocks',
		htmlFile: '/games/puzzle_blocks.html',
		tags: ['Puzzle', 'Klassiker', 'Arcade'],
		difficulty: 'Mittel',
		complexity: 'Einfach',
		controls: '← → zum Bewegen, ↑ zum Drehen, ↓ schneller fallen, Space für Harddrop',
		codeStats: { total: 450, code: 420, comments: 30 },
	},
];

export function getGameBySlug(slug: string): Game | undefined {
	return games.find((g) => g.slug === slug);
}

export function getGamesByTag(tag: string): Game[] {
	return games.filter((g) => g.tags.includes(tag));
}

export function getAllTags(): string[] {
	const tagSet = new Set<string>();
	for (const game of games) {
		for (const tag of game.tags) {
			tagSet.add(tag);
		}
	}
	return [...tagSet].sort();
}
