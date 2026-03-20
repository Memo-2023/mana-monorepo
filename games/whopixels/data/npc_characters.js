// Liste der NPC-Charaktere mit Namen und Persönlichkeiten
// NPC-Charaktere: Berühmte Erfinder durch die Historie
const npcCharacters = [
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
];

// Mache die Charaktere sowohl im Browser als auch in Node.js verfügbar
if (typeof window !== 'undefined') {
	// Browser-Umgebung
	window.npcCharacters = npcCharacters;
} else if (typeof module !== 'undefined') {
	// Node.js-Umgebung
	module.exports = npcCharacters;
}
