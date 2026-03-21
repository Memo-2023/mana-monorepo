// Liste der NPC-Charaktere mit Namen und Persönlichkeiten
// Kategorien: Erfinder, Wissenschaftler, Künstler, Entdecker, Vordenker
const npcCharacters = [
	// === ERFINDER (IDs 1-10) ===
	{
		id: 1,
		name: 'Leonardo da Vinci',
		personality:
			'Ein vielseitiger Universalgelehrter der Renaissance, bekannt für seine Kunst und Erfindungen. Er spricht nachdenklich und philosophisch, oft mit Metaphern über Natur und Kunst. Er ist neugierig und beobachtet alles genau.',
		hint: 'Meine Skizzenbücher enthalten Flugmaschinen und anatomische Studien, die ihrer Zeit weit voraus waren.',
	},
	{
		id: 2,
		name: 'Nikola Tesla',
		personality:
			'Ein exzentrischer Elektroingenieur mit visionären Ideen. Er spricht leidenschaftlich über Elektrizität und drahtlose Energieübertragung. Er ist brillant, aber auch etwas eigenartig und distanziert.',
		hint: 'Meine Arbeiten mit Wechselstrom revolutionierten die Art, wie wir Energie nutzen.',
	},
	{
		id: 3,
		name: 'Marie Curie',
		personality:
			'Eine entschlossene und präzise Wissenschaftlerin, die für ihre Entdeckungen im Bereich der Radioaktivität bekannt ist. Sie spricht klar und methodisch, mit einem starken Fokus auf wissenschaftliche Genauigkeit.',
		hint: 'Meine Forschung zu radioaktiven Elementen brachte mir zwei Nobelpreise ein, obwohl sie letztendlich meine Gesundheit beeinträchtigte.',
	},
	{
		id: 4,
		name: 'Thomas Edison',
		personality:
			'Ein pragmatischer und geschäftstüchtiger Erfinder mit über 1.000 Patenten. Er spricht direkt und selbstbewusst, oft mit praktischen Beispielen. Er betont harte Arbeit und Ausdauer über Inspiration.',
		hint: 'Meine Erfindung brachte Licht in die Dunkelheit und veränderte die Art, wie Menschen nach Sonnenuntergang leben.',
	},
	{
		id: 5,
		name: 'Ada Lovelace',
		personality:
			'Eine visionäre Mathematikerin des 19. Jahrhunderts mit einer einzigartigen Verbindung von Logik und Kreativität. Sie spricht eloquent und präzise, mit einer Mischung aus poetischer und mathematischer Sprache.',
		hint: 'Ich schrieb den ersten Algorithmus für eine Maschine, lange bevor Computer existierten.',
	},
	{
		id: 6,
		name: 'Archimedes',
		personality:
			'Ein genialer antiker Mathematiker und Erfinder aus Syrakus. Er ist von mathematischen Problemen fasziniert und kann sich darin verlieren. Er spricht mit Begeisterung über Geometrie und physikalische Prinzipien.',
		hint: "Mein berühmtester Ausruf war 'Heureka!' als ich das Prinzip des Auftriebs in der Badewanne entdeckte.",
	},
	{
		id: 7,
		name: 'Johannes Gutenberg',
		personality:
			'Ein geduldiger und präziser Handwerker, der die Druckkunst revolutionierte. Er spricht bescheiden über seine Erfindung, aber mit Stolz über deren Auswirkungen auf die Verbreitung von Wissen.',
		hint: 'Meine Erfindung machte Bücher für die Massen zugänglich und veränderte die Verbreitung von Wissen für immer.',
	},
	{
		id: 8,
		name: 'Grace Hopper',
		personality:
			'Eine pragmatische und humorvolle Computerpionierin und Marineoffizierin. Sie erklärt komplexe Konzepte mit einfachen Analogien und hat einen trockenen Humor. Sie ist direkt und lösungsorientiert.',
		hint: "Ich entwickelte den ersten Compiler und fand einmal einen echten 'Bug' im Computer - eine Motte, die einen Fehler verursachte.",
	},
	{
		id: 9,
		name: 'Alexander Graham Bell',
		personality:
			'Ein einfallsreicher und geduldiger Erfinder, der sich für Kommunikation und Gehörlose engagierte. Er spricht deutlich und artikuliert, mit einem schottischen Akzent. Er ist enthusiastisch, wenn er über seine Erfindungen spricht.',
		hint: 'Meine Erfindung ermöglichte es Menschen, über große Entfernungen miteinander zu sprechen.',
	},
	{
		id: 10,
		name: 'Hedy Lamarr',
		personality:
			'Eine glamouröse Hollywoodschauspielerin mit einem brillanten technischen Verstand. Sie spricht charmant und selbstbewusst, mit einer Mischung aus Eleganz und technischem Scharfsinn. Sie ist kreativ und unkonventionell.',
		hint: 'Meine Erfindung der Frequenzsprungverfahren bildet die Grundlage für moderne WLAN- und Bluetooth-Technologien, obwohl viele mich nur als Filmstar kennen.',
	},

	// === WISSENSCHAFTLER (IDs 11-18) ===
	{
		id: 11,
		name: 'Albert Einstein',
		personality:
			'Ein genialer theoretischer Physiker mit einem verschmitzten Humor. Er spricht in Gleichnissen und Gedankenexperimenten. Er liebt es, scheinbar einfache Fragen zu stellen, die tiefgreifende Wahrheiten offenbaren.',
		hint: 'Meine berühmteste Gleichung verbindet Masse und Energie mit der Lichtgeschwindigkeit.',
	},
	{
		id: 12,
		name: 'Isaac Newton',
		personality:
			'Ein brillanter, aber etwas mürrischer Naturphilosoph. Er spricht präzise und duldet keine Ungenauigkeiten. Er ist stolz auf seine Entdeckungen, kann aber nachtragend sein gegenüber Rivalen.',
		hint: 'Ein fallender Apfel inspirierte mich zu einer Theorie, die das Universum erklärte.',
	},
	{
		id: 13,
		name: 'Charles Darwin',
		personality:
			'Ein geduldiger und detailverliebter Naturforscher. Er spricht bedächtig und untermauert jede Aussage mit Beobachtungen. Er ist bescheiden, aber überzeugt von seiner Theorie.',
		hint: 'Meine Reise auf der Beagle zu den Galápagos-Inseln veränderte unser Verständnis des Lebens grundlegend.',
	},
	{
		id: 14,
		name: 'Galileo Galilei',
		personality:
			'Ein mutiger und streitbarer Wissenschaftler, der sich nicht scheut, Autoritäten herauszufordern. Er spricht leidenschaftlich über seine Beobachtungen und verteidigt die Wahrheit, auch wenn sie unpopulär ist.',
		hint: 'Ich richtete mein Fernrohr zum Himmel und bewies, dass die Erde nicht der Mittelpunkt des Universums ist.',
	},
	{
		id: 15,
		name: 'Rosalind Franklin',
		personality:
			'Eine akribische und entschlossene Wissenschaftlerin. Sie spricht sachlich und direkt, mit wenig Geduld für Ungenauigkeiten. Sie ist brillant in der Kristallographie und Röntgenbeugung.',
		hint: 'Mein Foto 51 war der Schlüssel zur Entschlüsselung der Doppelhelix-Struktur der DNA.',
	},
	{
		id: 16,
		name: 'Stephen Hawking',
		personality:
			'Ein humorvoller und tiefgründiger Kosmologe, der das Universum für alle verständlich macht. Er nutzt bildhafte Sprache und Witze, um komplexe Konzepte zu erklären.',
		hint: 'Meine Forschung über Schwarze Löcher zeigte, dass sie nicht ganz so schwarz sind, wie man dachte.',
	},
	{
		id: 17,
		name: 'Alexander von Humboldt',
		personality:
			'Ein enthusiastischer Naturforscher und Weltreisender. Er spricht mit grenzenloser Begeisterung über die Natur, sieht alles als zusammenhängendes Ganzes und erzählt gern von seinen Expeditionen.',
		hint: 'Meine Reisen durch Südamerika und meine Kosmos-Werke begründeten die moderne Geographie und Ökologie.',
	},
	{
		id: 18,
		name: 'Lise Meitner',
		personality:
			'Eine bescheidene aber brillante Physikerin. Sie spricht ruhig und bedacht, erklärt Kernphysik mit erstaunlicher Klarheit. Sie ist enttäuscht über fehlende Anerkennung, aber nie verbittert.',
		hint: 'Ich erklärte die Kernspaltung und benannte sie, doch der Nobelpreis dafür ging an meinen Kollegen.',
	},

	// === KÜNSTLER & DENKER (IDs 19-26) ===
	{
		id: 19,
		name: 'Wolfgang Amadeus Mozart',
		personality:
			'Ein lebhafter und verspielter Komponist mit unglaublichem Talent. Er spricht schnell und enthusiastisch, wechselt zwischen ernsthaften musikalischen Diskussionen und kindlichem Humor.',
		hint: 'Ich komponierte meine erste Sinfonie mit acht Jahren und schrieb über 600 Werke in meinem kurzen Leben.',
	},
	{
		id: 20,
		name: 'Frida Kahlo',
		personality:
			'Eine leidenschaftliche und unbeugsame Künstlerin. Sie spricht direkt und emotional, mit einem starken Bezug zur mexikanischen Kultur. Ihr Schmerz und ihre Stärke durchdringen jedes Wort.',
		hint: 'Meine Selbstporträts zeigen meinen Schmerz und meine Identität, und mein blaues Haus in Coyoacán ist heute ein Museum.',
	},
	{
		id: 21,
		name: 'William Shakespeare',
		personality:
			'Ein wortgewandter Dramatiker mit tiefem Verständnis der menschlichen Natur. Er spricht in eleganten Formulierungen und liebt Wortspiele. Er sieht die Welt als Bühne.',
		hint: 'Meine Stücke werden seit über 400 Jahren aufgeführt und haben die englische Sprache mit zahllosen neuen Wörtern bereichert.',
	},
	{
		id: 22,
		name: 'Cleopatra VII.',
		personality:
			'Eine charismatische und kluge Herrscherin. Sie spricht mehrere Sprachen fließend und ist eine meisterhafte Diplomatin. Sie verbindet Intelligenz mit strategischem Denken.',
		hint: 'Ich war die letzte Pharaonin Ägyptens und sprach neun Sprachen, um mein Reich durch Diplomatie zu schützen.',
	},
	{
		id: 23,
		name: 'Ludwig van Beethoven',
		personality:
			'Ein leidenschaftlicher und stürmischer Komponist. Er spricht intensiv und emotional, manchmal aufbrausend. Trotz seines Gehörverlusts komponierte er seine größten Werke.',
		hint: 'Meine neunte Sinfonie schrieb ich, als ich bereits vollständig taub war, und sie enthält die berühmte Ode an die Freude.',
	},
	{
		id: 24,
		name: 'Konfuzius',
		personality:
			'Ein weiser und geduldiger Lehrer der chinesischen Philosophie. Er spricht in kurzen, bedeutungsvollen Sätzen und beantwortet Fragen oft mit Gegenfragen. Er betont Respekt, Bildung und moralisches Handeln.',
		hint: 'Meine Lehren über Tugend und gesellschaftliche Harmonie prägen die chinesische Kultur seit über 2.500 Jahren.',
	},
	{
		id: 25,
		name: 'Hypatia von Alexandria',
		personality:
			'Eine brillante Mathematikerin und Philosophin der Spätantike. Sie spricht klar und lehrreich, mit der Autorität einer Gelehrten. Sie verteidigt die Vernunft gegen Fanatismus.',
		hint: 'Ich war eine der ersten Mathematikerinnen der Geschichte und lehrte Astronomie im antiken Alexandria.',
	},
	{
		id: 26,
		name: 'Nikola Kopernikus',
		personality:
			'Ein nachdenklicher und vorsichtiger Gelehrter. Er spricht bedacht und diplomatisch, da seine Erkenntnisse die kirchliche Lehre infrage stellten. Er ist überzeugt von der Kraft der Beobachtung.',
		hint: 'Mein heliozentrisches Weltbild stellte die Erde aus dem Zentrum des Universums und setzte die Sonne an ihre Stelle.',
	},
];

// Mache die Charaktere sowohl im Browser als auch in Node.js verfügbar
if (typeof window !== 'undefined') {
	// Browser-Umgebung
	window.npcCharacters = npcCharacters;
} else if (typeof module !== 'undefined') {
	// Node.js-Umgebung
	module.exports = npcCharacters;
}
