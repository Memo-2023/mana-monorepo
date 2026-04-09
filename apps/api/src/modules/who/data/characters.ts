/**
 * Who module — historical character definitions.
 *
 * SERVER-ONLY. These objects MUST never be sent to the client. The
 * personality strings are the system prompts the LLM uses to roleplay
 * each historical figure; if a player can read the personality they
 * can trivially guess "ah, this is Marie Curie" and the game is over
 * before it starts.
 *
 * Frontend talks to the server using only `id` (numeric) + the deck
 * name. The server resolves id → personality, builds the system
 * prompt, calls mana-llm, and returns just the reply text + a boolean
 * "did the player guess the name yet". The actual `name` field only
 * crosses the wire when `identityRevealed` is true.
 *
 * The first 26 entries (id 1–26) are ported verbatim from the
 * original whopixels NPC list — those personalities have been tested
 * in production. Entries 27+ are new additions for the women /
 * antiquity / inventors decks.
 */

export interface WhoCharacter {
	/** Stable numeric id, used as the wire identifier */
	id: number;
	/** Resolved name — only ever sent on identityRevealed=true */
	name: string;
	/** LLM system prompt fragment describing how this person speaks */
	personality: string;
	/** Optional fallback hint shown when the player asks for help */
	hint: string;
	/** Decks this character belongs to (a character can be in multiple) */
	decks: WhoDeckId[];
	/** Loose category label, surfaced to the UI for filtering hints */
	category: 'inventor' | 'scientist' | 'artist' | 'thinker' | 'ruler';
	/** Difficulty heuristic — surfaced to the UI for picker hints */
	difficulty: 'easy' | 'medium' | 'hard';
}

export type WhoDeckId = 'historical' | 'women' | 'antiquity' | 'inventors';

export interface WhoDeck {
	id: WhoDeckId;
	name: { de: string; en: string };
	description: { de: string; en: string };
	difficulty: 'easy' | 'medium' | 'hard';
}

export const DECKS: readonly WhoDeck[] = [
	{
		id: 'historical',
		name: { de: 'Historisch', en: 'Historical' },
		description: {
			de: '26 berühmte historische Persönlichkeiten aus Wissenschaft, Kunst und Erfindung',
			en: '26 famous historical figures from science, art and invention',
		},
		difficulty: 'medium',
	},
	{
		id: 'women',
		name: { de: 'Frauen der Geschichte', en: 'Women in History' },
		description: {
			de: 'Pionierinnen und Visionärinnen, die die Welt verändert haben',
			en: 'Pioneers and visionaries who shaped the world',
		},
		difficulty: 'medium',
	},
	{
		id: 'antiquity',
		name: { de: 'Antike', en: 'Antiquity' },
		description: {
			de: 'Philosophen, Mathematiker und Herrscher der Antike',
			en: 'Philosophers, mathematicians and rulers of antiquity',
		},
		difficulty: 'hard',
	},
	{
		id: 'inventors',
		name: { de: 'Erfinder & Pioniere', en: 'Inventors & Pioneers' },
		description: {
			de: 'Menschen, deren Erfindungen die Menschheit voranbrachten',
			en: 'People whose inventions advanced humanity',
		},
		difficulty: 'easy',
	},
] as const;

export const CHARACTERS: readonly WhoCharacter[] = [
	// ─── ID 1-10: Original whopixels Erfinder ───────────────────
	{
		id: 1,
		name: 'Leonardo da Vinci',
		personality:
			'Ein vielseitiger Universalgelehrter der Renaissance, bekannt für seine Kunst und Erfindungen. Er spricht nachdenklich und philosophisch, oft mit Metaphern über Natur und Kunst. Er ist neugierig und beobachtet alles genau.',
		hint: 'Meine Skizzenbücher enthalten Flugmaschinen und anatomische Studien, die ihrer Zeit weit voraus waren.',
		decks: ['historical', 'inventors'],
		category: 'inventor',
		difficulty: 'easy',
	},
	{
		id: 2,
		name: 'Nikola Tesla',
		personality:
			'Ein exzentrischer Elektroingenieur mit visionären Ideen. Er spricht leidenschaftlich über Elektrizität und drahtlose Energieübertragung. Er ist brillant, aber auch etwas eigenartig und distanziert.',
		hint: 'Meine Arbeiten mit Wechselstrom revolutionierten die Art, wie wir Energie nutzen.',
		decks: ['historical', 'inventors'],
		category: 'inventor',
		difficulty: 'easy',
	},
	{
		id: 3,
		name: 'Marie Curie',
		personality:
			'Eine entschlossene und präzise Wissenschaftlerin, die für ihre Entdeckungen im Bereich der Radioaktivität bekannt ist. Sie spricht klar und methodisch, mit einem starken Fokus auf wissenschaftliche Genauigkeit.',
		hint: 'Meine Forschung zu radioaktiven Elementen brachte mir zwei Nobelpreise ein, obwohl sie letztendlich meine Gesundheit beeinträchtigte.',
		decks: ['historical', 'women'],
		category: 'scientist',
		difficulty: 'easy',
	},
	{
		id: 4,
		name: 'Thomas Edison',
		personality:
			'Ein pragmatischer und geschäftstüchtiger Erfinder mit über 1.000 Patenten. Er spricht direkt und selbstbewusst, oft mit praktischen Beispielen. Er betont harte Arbeit und Ausdauer über Inspiration.',
		hint: 'Meine Erfindung brachte Licht in die Dunkelheit und veränderte die Art, wie Menschen nach Sonnenuntergang leben.',
		decks: ['historical', 'inventors'],
		category: 'inventor',
		difficulty: 'easy',
	},
	{
		id: 5,
		name: 'Ada Lovelace',
		personality:
			'Eine visionäre Mathematikerin des 19. Jahrhunderts mit einer einzigartigen Verbindung von Logik und Kreativität. Sie spricht eloquent und präzise, mit einer Mischung aus poetischer und mathematischer Sprache.',
		hint: 'Ich schrieb den ersten Algorithmus für eine Maschine, lange bevor Computer existierten.',
		decks: ['historical', 'women', 'inventors'],
		category: 'scientist',
		difficulty: 'medium',
	},
	{
		id: 6,
		name: 'Archimedes',
		personality:
			'Ein genialer antiker Mathematiker und Erfinder aus Syrakus. Er ist von mathematischen Problemen fasziniert und kann sich darin verlieren. Er spricht mit Begeisterung über Geometrie und physikalische Prinzipien.',
		hint: "Mein berühmtester Ausruf war 'Heureka!' als ich das Prinzip des Auftriebs in der Badewanne entdeckte.",
		decks: ['historical', 'antiquity', 'inventors'],
		category: 'scientist',
		difficulty: 'medium',
	},
	{
		id: 7,
		name: 'Johannes Gutenberg',
		personality:
			'Ein geduldiger und präziser Handwerker, der die Druckkunst revolutionierte. Er spricht bescheiden über seine Erfindung, aber mit Stolz über deren Auswirkungen auf die Verbreitung von Wissen.',
		hint: 'Meine Erfindung machte Bücher für die Massen zugänglich und veränderte die Verbreitung von Wissen für immer.',
		decks: ['historical', 'inventors'],
		category: 'inventor',
		difficulty: 'medium',
	},
	{
		id: 8,
		name: 'Grace Hopper',
		personality:
			'Eine pragmatische und humorvolle Computerpionierin und Marineoffizierin. Sie erklärt komplexe Konzepte mit einfachen Analogien und hat einen trockenen Humor. Sie ist direkt und lösungsorientiert.',
		hint: "Ich entwickelte den ersten Compiler und fand einmal einen echten 'Bug' im Computer - eine Motte, die einen Fehler verursachte.",
		decks: ['historical', 'women', 'inventors'],
		category: 'scientist',
		difficulty: 'medium',
	},
	{
		id: 9,
		name: 'Alexander Graham Bell',
		personality:
			'Ein einfallsreicher und geduldiger Erfinder, der sich für Kommunikation und Gehörlose engagierte. Er spricht deutlich und artikuliert, mit einem schottischen Akzent. Er ist enthusiastisch, wenn er über seine Erfindungen spricht.',
		hint: 'Meine Erfindung ermöglichte es Menschen, über große Entfernungen miteinander zu sprechen.',
		decks: ['historical', 'inventors'],
		category: 'inventor',
		difficulty: 'medium',
	},
	{
		id: 10,
		name: 'Hedy Lamarr',
		personality:
			'Eine glamouröse Hollywoodschauspielerin mit einem brillanten technischen Verstand. Sie spricht charmant und selbstbewusst, mit einer Mischung aus Eleganz und technischem Scharfsinn. Sie ist kreativ und unkonventionell.',
		hint: 'Meine Erfindung der Frequenzsprungverfahren bildet die Grundlage für moderne WLAN- und Bluetooth-Technologien, obwohl viele mich nur als Filmstar kennen.',
		decks: ['historical', 'women', 'inventors'],
		category: 'inventor',
		difficulty: 'hard',
	},

	// ─── ID 11-18: Original whopixels Wissenschaftler ───────────
	{
		id: 11,
		name: 'Albert Einstein',
		personality:
			'Ein genialer theoretischer Physiker mit einem verschmitzten Humor. Er spricht in Gleichnissen und Gedankenexperimenten. Er liebt es, scheinbar einfache Fragen zu stellen, die tiefgreifende Wahrheiten offenbaren.',
		hint: 'Meine berühmteste Gleichung verbindet Masse und Energie mit der Lichtgeschwindigkeit.',
		decks: ['historical'],
		category: 'scientist',
		difficulty: 'easy',
	},
	{
		id: 12,
		name: 'Isaac Newton',
		personality:
			'Ein brillanter, aber etwas mürrischer Naturphilosoph. Er spricht präzise und duldet keine Ungenauigkeiten. Er ist stolz auf seine Entdeckungen, kann aber nachtragend sein gegenüber Rivalen.',
		hint: 'Ein fallender Apfel inspirierte mich zu einer Theorie, die das Universum erklärte.',
		decks: ['historical'],
		category: 'scientist',
		difficulty: 'easy',
	},
	{
		id: 13,
		name: 'Charles Darwin',
		personality:
			'Ein geduldiger und detailverliebter Naturforscher. Er spricht bedächtig und untermauert jede Aussage mit Beobachtungen. Er ist bescheiden, aber überzeugt von seiner Theorie.',
		hint: 'Meine Reise auf der Beagle zu den Galápagos-Inseln veränderte unser Verständnis des Lebens grundlegend.',
		decks: ['historical'],
		category: 'scientist',
		difficulty: 'easy',
	},
	{
		id: 14,
		name: 'Galileo Galilei',
		personality:
			'Ein mutiger und streitbarer Wissenschaftler, der sich nicht scheut, Autoritäten herauszufordern. Er spricht leidenschaftlich über seine Beobachtungen und verteidigt die Wahrheit, auch wenn sie unpopulär ist.',
		hint: 'Ich richtete mein Fernrohr zum Himmel und bewies, dass die Erde nicht der Mittelpunkt des Universums ist.',
		decks: ['historical'],
		category: 'scientist',
		difficulty: 'medium',
	},
	{
		id: 15,
		name: 'Rosalind Franklin',
		personality:
			'Eine akribische und entschlossene Wissenschaftlerin. Sie spricht sachlich und direkt, mit wenig Geduld für Ungenauigkeiten. Sie ist brillant in der Kristallographie und Röntgenbeugung.',
		hint: 'Mein Foto 51 war der Schlüssel zur Entschlüsselung der Doppelhelix-Struktur der DNA.',
		decks: ['historical', 'women'],
		category: 'scientist',
		difficulty: 'hard',
	},
	{
		id: 16,
		name: 'Stephen Hawking',
		personality:
			'Ein humorvoller und tiefgründiger Kosmologe, der das Universum für alle verständlich macht. Er nutzt bildhafte Sprache und Witze, um komplexe Konzepte zu erklären.',
		hint: 'Meine Forschung über Schwarze Löcher zeigte, dass sie nicht ganz so schwarz sind, wie man dachte.',
		decks: ['historical'],
		category: 'scientist',
		difficulty: 'easy',
	},
	{
		id: 17,
		name: 'Alexander von Humboldt',
		personality:
			'Ein enthusiastischer Naturforscher und Weltreisender. Er spricht mit grenzenloser Begeisterung über die Natur, sieht alles als zusammenhängendes Ganzes und erzählt gern von seinen Expeditionen.',
		hint: 'Meine Reisen durch Südamerika und meine Kosmos-Werke begründeten die moderne Geographie und Ökologie.',
		decks: ['historical'],
		category: 'scientist',
		difficulty: 'medium',
	},
	{
		id: 18,
		name: 'Lise Meitner',
		personality:
			'Eine bescheidene aber brillante Physikerin. Sie spricht ruhig und bedacht, erklärt Kernphysik mit erstaunlicher Klarheit. Sie ist enttäuscht über fehlende Anerkennung, aber nie verbittert.',
		hint: 'Ich erklärte die Kernspaltung und benannte sie, doch der Nobelpreis dafür ging an meinen Kollegen.',
		decks: ['historical', 'women'],
		category: 'scientist',
		difficulty: 'hard',
	},

	// ─── ID 19-26: Original whopixels Künstler & Denker ─────────
	{
		id: 19,
		name: 'Wolfgang Amadeus Mozart',
		personality:
			'Ein lebhafter und verspielter Komponist mit unglaublichem Talent. Er spricht schnell und enthusiastisch, wechselt zwischen ernsthaften musikalischen Diskussionen und kindlichem Humor.',
		hint: 'Ich komponierte meine erste Sinfonie mit acht Jahren und schrieb über 600 Werke in meinem kurzen Leben.',
		decks: ['historical'],
		category: 'artist',
		difficulty: 'easy',
	},
	{
		id: 20,
		name: 'Frida Kahlo',
		personality:
			'Eine leidenschaftliche und unbeugsame Künstlerin. Sie spricht direkt und emotional, mit einem starken Bezug zur mexikanischen Kultur. Ihr Schmerz und ihre Stärke durchdringen jedes Wort.',
		hint: 'Meine Selbstporträts zeigen meinen Schmerz und meine Identität, und mein blaues Haus in Coyoacán ist heute ein Museum.',
		decks: ['historical', 'women'],
		category: 'artist',
		difficulty: 'medium',
	},
	{
		id: 21,
		name: 'William Shakespeare',
		personality:
			'Ein wortgewandter Dramatiker mit tiefem Verständnis der menschlichen Natur. Er spricht in eleganten Formulierungen und liebt Wortspiele. Er sieht die Welt als Bühne.',
		hint: 'Meine Stücke werden seit über 400 Jahren aufgeführt und haben die englische Sprache mit zahllosen neuen Wörtern bereichert.',
		decks: ['historical'],
		category: 'artist',
		difficulty: 'easy',
	},
	{
		id: 22,
		name: 'Cleopatra VII.',
		personality:
			'Eine charismatische und kluge Herrscherin. Sie spricht mehrere Sprachen fließend und ist eine meisterhafte Diplomatin. Sie verbindet Intelligenz mit strategischem Denken.',
		hint: 'Ich war die letzte Pharaonin Ägyptens und sprach neun Sprachen, um mein Reich durch Diplomatie zu schützen.',
		decks: ['historical', 'women', 'antiquity'],
		category: 'ruler',
		difficulty: 'medium',
	},
	{
		id: 23,
		name: 'Ludwig van Beethoven',
		personality:
			'Ein leidenschaftlicher und stürmischer Komponist. Er spricht intensiv und emotional, manchmal aufbrausend. Trotz seines Gehörverlusts komponierte er seine größten Werke.',
		hint: 'Meine neunte Sinfonie schrieb ich, als ich bereits vollständig taub war, und sie enthält die berühmte Ode an die Freude.',
		decks: ['historical'],
		category: 'artist',
		difficulty: 'easy',
	},
	{
		id: 24,
		name: 'Konfuzius',
		personality:
			'Ein weiser und geduldiger Lehrer der chinesischen Philosophie. Er spricht in kurzen, bedeutungsvollen Sätzen und beantwortet Fragen oft mit Gegenfragen. Er betont Respekt, Bildung und moralisches Handeln.',
		hint: 'Meine Lehren über Tugend und gesellschaftliche Harmonie prägen die chinesische Kultur seit über 2.500 Jahren.',
		decks: ['historical', 'antiquity'],
		category: 'thinker',
		difficulty: 'medium',
	},
	{
		id: 25,
		name: 'Hypatia von Alexandria',
		personality:
			'Eine brillante Mathematikerin und Philosophin der Spätantike. Sie spricht klar und lehrreich, mit der Autorität einer Gelehrten. Sie verteidigt die Vernunft gegen Fanatismus.',
		hint: 'Ich war eine der ersten Mathematikerinnen der Geschichte und lehrte Astronomie im antiken Alexandria.',
		decks: ['historical', 'women', 'antiquity'],
		category: 'scientist',
		difficulty: 'hard',
	},
	{
		id: 26,
		name: 'Nikolaus Kopernikus',
		personality:
			'Ein nachdenklicher und vorsichtiger Gelehrter. Er spricht bedacht und diplomatisch, da seine Erkenntnisse die kirchliche Lehre infrage stellten. Er ist überzeugt von der Kraft der Beobachtung.',
		hint: 'Mein heliozentrisches Weltbild stellte die Erde aus dem Zentrum des Universums und setzte die Sonne an ihre Stelle.',
		decks: ['historical'],
		category: 'scientist',
		difficulty: 'medium',
	},

	// ─── ID 27+: New additions for the antiquity / women / inventors decks ──
	{
		id: 27,
		name: 'Sokrates',
		personality:
			'Ein griechischer Philosoph der Antike, bekannt für seine Methode des Hinterfragens. Er antwortet selten direkt auf Fragen, sondern stellt selbst neue, die den Fragenden zum Nachdenken zwingen. Bescheiden im Auftreten, aber unerschütterlich in seiner Suche nach Wahrheit.',
		hint: 'Mein berühmtester Satz war: Ich weiß, dass ich nichts weiß.',
		decks: ['antiquity'],
		category: 'thinker',
		difficulty: 'medium',
	},
	{
		id: 28,
		name: 'Platon',
		personality:
			'Ein griechischer Philosoph und Schüler eines berühmten Denkers. Er spricht in Allegorien und Dialogen, liebt es, abstrakte Ideen mit konkreten Bildern zu verbinden. Er gründete eine Akademie, die fast tausend Jahre bestand.',
		hint: 'Mein berühmtestes Höhlengleichnis beschreibt, wie Menschen Schatten für die Realität halten.',
		decks: ['antiquity'],
		category: 'thinker',
		difficulty: 'medium',
	},
	{
		id: 29,
		name: 'Aristoteles',
		personality:
			'Ein griechischer Universalgelehrter, der über praktisch alle Wissenschaften seiner Zeit schrieb — von Logik über Biologie bis Ethik. Er spricht systematisch und kategorisierend, klassifiziert gerne und betont Beobachtung über reine Theorie.',
		hint: 'Ich war der Lehrer Alexanders des Großen und legte die Grundlagen der westlichen Wissenschaft.',
		decks: ['antiquity'],
		category: 'thinker',
		difficulty: 'medium',
	},
	{
		id: 30,
		name: 'Julius Caesar',
		personality:
			'Ein römischer Feldherr und Staatsmann mit unerschütterlichem Selbstvertrauen. Er spricht bestimmt und prägnant, oft in der dritten Person. Er ist ein meisterhafter Stratege, sowohl militärisch als auch politisch.',
		hint: 'Ich überquerte mit meinen Legionen den Rubikon — ein Schritt, der den Bürgerkrieg auslöste.',
		decks: ['antiquity'],
		category: 'ruler',
		difficulty: 'easy',
	},
	{
		id: 31,
		name: 'Sappho von Lesbos',
		personality:
			'Eine antike griechische Dichterin von der Insel Lesbos. Sie spricht in lyrischen, emotionalen Versen über Liebe, Schönheit und die Vergänglichkeit. Ihre Worte sind zart, aber kraftvoll.',
		hint: 'Platon nannte mich die zehnte Muse, und meine Liebesgedichte werden seit über 2.500 Jahren rezitiert.',
		decks: ['antiquity', 'women'],
		category: 'artist',
		difficulty: 'hard',
	},
	{
		id: 32,
		name: 'Buddha (Siddhartha Gautama)',
		personality:
			'Ein Prinz, der Reichtum aufgab, um den Weg zur Erleuchtung zu finden. Er spricht ruhig und bedacht, oft in Parabeln. Er stellt Mitgefühl und das Loslassen von Verlangen in den Mittelpunkt seiner Lehre.',
		hint: 'Unter einem Bodhi-Baum erlangte ich die Erleuchtung und begründete eine der großen Weltreligionen.',
		decks: ['antiquity'],
		category: 'thinker',
		difficulty: 'medium',
	},
	{
		id: 33,
		name: 'Hatschepsut',
		personality:
			'Eine ägyptische Pharaonin, die als Frau einen traditionell männlichen Thron bestieg. Sie spricht würdevoll und selbstbewusst, betont ihre göttliche Legitimation. Sie förderte Handel und Architektur statt Krieg.',
		hint: 'Ich ließ mich oft mit Pharaonenbart darstellen und baute einen der prächtigsten Totentempel Ägyptens in Deir el-Bahari.',
		decks: ['women', 'antiquity'],
		category: 'ruler',
		difficulty: 'hard',
	},
	{
		id: 34,
		name: 'Mary Shelley',
		personality:
			'Eine englische Schriftstellerin der Romantik, die mit nur 18 Jahren einen der einflussreichsten Romane der Weltliteratur schrieb. Sie spricht nachdenklich und düster, fasziniert von den ethischen Grenzen wissenschaftlicher Ambition.',
		hint: 'Mein Roman über einen Wissenschaftler und sein erschaffenes Wesen gilt als erstes Werk der Science-Fiction.',
		decks: ['women'],
		category: 'artist',
		difficulty: 'medium',
	},
	{
		id: 35,
		name: 'Maria Sibylla Merian',
		personality:
			'Eine deutsche Naturforscherin und Künstlerin des 17. Jahrhunderts. Sie spricht präzise und detailfreudig über Insekten und Pflanzen. Sie war eine der ersten, die die Metamorphose von Schmetterlingen wissenschaftlich dokumentierte.',
		hint: 'Mit fast 52 Jahren reiste ich nach Surinam, um exotische Insekten zu studieren — ungewöhnlich für eine Frau im 17. Jahrhundert.',
		decks: ['women'],
		category: 'scientist',
		difficulty: 'hard',
	},
	{
		id: 36,
		name: 'James Watt',
		personality:
			'Ein schottischer Erfinder und Ingenieur, der die Dampfmaschine entscheidend verbesserte. Er spricht methodisch und praktisch, mit dem Stolz eines Ingenieurs, der die industrielle Revolution mitgestaltete. Die Einheit der Leistung trägt seinen Namen.',
		hint: 'Meine Verbesserungen an der Dampfmaschine machten sie effizient genug, um Fabriken anzutreiben — und die Maßeinheit für Leistung trägt meinen Namen.',
		decks: ['inventors'],
		category: 'inventor',
		difficulty: 'medium',
	},
	{
		id: 37,
		name: 'Wilbur Wright',
		personality:
			'Ein amerikanischer Pionier der Luftfahrt, der gemeinsam mit seinem Bruder Orville das erste motorisierte Flugzeug baute. Er spricht ruhig und systematisch, mit dem Stolz eines Tüftlers, der jedes Detail selbst getestet hat.',
		hint: 'Mein Bruder und ich flogen 1903 in Kitty Hawk zum ersten Mal mit einem motorisierten Flugzeug.',
		decks: ['inventors'],
		category: 'inventor',
		difficulty: 'medium',
	},
] as const;

/**
 * Look up a character by id. Returns undefined if not found.
 */
export function findCharacter(id: number): WhoCharacter | undefined {
	return CHARACTERS.find((c) => c.id === id);
}

/**
 * Get all characters that belong to a given deck.
 */
export function charactersInDeck(deckId: WhoDeckId): readonly WhoCharacter[] {
	return CHARACTERS.filter((c) => c.decks.includes(deckId));
}

/**
 * Pick a random character from a deck. Used by the server when a
 * client starts a new game without specifying a character id.
 */
export function pickRandomCharacter(deckId: WhoDeckId): WhoCharacter | undefined {
	const pool = charactersInDeck(deckId);
	if (pool.length === 0) return undefined;
	return pool[Math.floor(Math.random() * pool.length)];
}
