export default () => ({
	port: parseInt(process.env.PORT || '3317', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	zitare: {
		backendUrl: process.env.ZITARE_BACKEND_URL || 'http://localhost:3007',
		apiPrefix: process.env.ZITARE_API_PREFIX || '/api/v1',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
	stt: {
		url: process.env.STT_URL || 'http://localhost:3020',
	},
});

export const HELP_MESSAGE = `**Zitare Bot - Tagliche Inspiration**

**Zitate:**
- \`!zitat\` - Zufalliges Zitat
- \`!heute\` - Zitat des Tages
- \`!suche [text]\` - Zitate suchen
- \`!kategorie [name]\` - Zitate nach Kategorie
- \`!kategorien\` - Alle Kategorien

**Favoriten:** (Login erforderlich)
- \`!login email passwort\` - Anmelden
- \`!logout\` - Abmelden
- \`!favorit\` - Letztes Zitat speichern
- \`!favoriten\` - Alle Favoriten anzeigen

**Listen:** (Login erforderlich)
- \`!listen\` - Alle Listen anzeigen
- \`!liste [name]\` - Neue Liste erstellen
- \`!addliste [nr] [zitat-nr]\` - Zitat zur Liste hinzufugen

**Sonstiges:**
- \`!status\` - Bot-Status
- \`!help\` - Diese Hilfe

**Sprachnotizen:**
Sende eine Sprachnotiz mit Befehlen wie "Zitat", "Motivation" oder einem Suchbegriff.

**Naturliche Sprache:**
- "zitat", "inspiration" -> Zufalliges Zitat
- "motiviere mich" -> Motivation-Zitat
- "guten morgen" -> Morgenzitat`;

// Quote categories
export const CATEGORIES = [
	'motivation',
	'weisheit',
	'liebe',
	'leben',
	'erfolg',
	'glueck',
	'freundschaft',
	'mut',
	'hoffnung',
	'natur',
] as const;

export type Category = (typeof CATEGORIES)[number];

// German inspirational quotes collection
export interface Quote {
	id: string;
	text: string;
	author: string;
	category: Category;
}

export const QUOTES: Quote[] = [
	// Motivation
	{
		id: 'mot-1',
		text: 'Der einzige Weg, grossartige Arbeit zu leisten, ist zu lieben, was man tut.',
		author: 'Steve Jobs',
		category: 'motivation',
	},
	{
		id: 'mot-2',
		text: 'Erfolg ist nicht endgultig, Misserfolg ist nicht fatal: Was zahlt, ist der Mut weiterzumachen.',
		author: 'Winston Churchill',
		category: 'motivation',
	},
	{
		id: 'mot-3',
		text: 'Die Zukunft gehort denen, die an die Schonheit ihrer Traume glauben.',
		author: 'Eleanor Roosevelt',
		category: 'motivation',
	},
	{
		id: 'mot-4',
		text: 'Es ist nie zu spat, das zu werden, was man hatte sein konnen.',
		author: 'George Eliot',
		category: 'motivation',
	},
	{
		id: 'mot-5',
		text: 'Gib jedem Tag die Chance, der schonste deines Lebens zu werden.',
		author: 'Mark Twain',
		category: 'motivation',
	},
	// Weisheit
	{
		id: 'weis-1',
		text: 'Der Weg ist das Ziel.',
		author: 'Konfuzius',
		category: 'weisheit',
	},
	{
		id: 'weis-2',
		text: 'Wer kampft, kann verlieren. Wer nicht kampft, hat schon verloren.',
		author: 'Bertolt Brecht',
		category: 'weisheit',
	},
	{
		id: 'weis-3',
		text: 'Man sieht nur mit dem Herzen gut. Das Wesentliche ist fur die Augen unsichtbar.',
		author: 'Antoine de Saint-Exupery',
		category: 'weisheit',
	},
	{
		id: 'weis-4',
		text: 'Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer.',
		author: 'Seneca',
		category: 'weisheit',
	},
	{
		id: 'weis-5',
		text: 'Wissen ist Macht.',
		author: 'Francis Bacon',
		category: 'weisheit',
	},
	// Liebe
	{
		id: 'liebe-1',
		text: 'Wo Liebe ist, da ist auch Leben.',
		author: 'Mahatma Gandhi',
		category: 'liebe',
	},
	{
		id: 'liebe-2',
		text: 'Die Liebe allein versteht das Geheimnis, andere zu beschenken und dabei selbst reich zu werden.',
		author: 'Clemens Brentano',
		category: 'liebe',
	},
	{
		id: 'liebe-3',
		text: 'Es gibt nur ein Gluck in diesem Leben: zu lieben und geliebt zu werden.',
		author: 'George Sand',
		category: 'liebe',
	},
	// Leben
	{
		id: 'leben-1',
		text: 'Das Leben ist wie Fahrrad fahren. Um die Balance zu halten, musst du in Bewegung bleiben.',
		author: 'Albert Einstein',
		category: 'leben',
	},
	{
		id: 'leben-2',
		text: 'Leben ist das, was passiert, wahrend du damit beschaftigt bist, andere Plane zu machen.',
		author: 'John Lennon',
		category: 'leben',
	},
	{
		id: 'leben-3',
		text: 'Das Leben ist zu kurz fur spater.',
		author: 'Alexandra Reinwarth',
		category: 'leben',
	},
	{
		id: 'leben-4',
		text: 'Lebe jeden Tag, als ware es dein letzter.',
		author: 'Marcus Aurelius',
		category: 'leben',
	},
	// Erfolg
	{
		id: 'erfolg-1',
		text: 'Erfolg besteht darin, dass man genau die Fahigkeiten hat, die im Moment gefragt sind.',
		author: 'Henry Ford',
		category: 'erfolg',
	},
	{
		id: 'erfolg-2',
		text: 'Der Preis des Erfolges ist Hingabe, harte Arbeit und unablassiger Einsatz.',
		author: 'Frank Lloyd Wright',
		category: 'erfolg',
	},
	{
		id: 'erfolg-3',
		text: 'Ich habe nicht versagt. Ich habe nur 10.000 Wege gefunden, die nicht funktionieren.',
		author: 'Thomas Edison',
		category: 'erfolg',
	},
	// Glueck
	{
		id: 'glueck-1',
		text: 'Gluck ist das Einzige, das sich verdoppelt, wenn man es teilt.',
		author: 'Albert Schweitzer',
		category: 'glueck',
	},
	{
		id: 'glueck-2',
		text: 'Gluck ist kein Ziel, sondern ein Weg.',
		author: 'Buddha',
		category: 'glueck',
	},
	{
		id: 'glueck-3',
		text: 'Nicht die Glucklichen sind dankbar. Es sind die Dankbaren, die glucklich sind.',
		author: 'Francis Bacon',
		category: 'glueck',
	},
	// Freundschaft
	{
		id: 'freund-1',
		text: 'Ein wahrer Freund ist jemand, der die Melodie deines Herzens kennt und sie dir vorsingt, wenn du sie vergessen hast.',
		author: 'Albert Einstein',
		category: 'freundschaft',
	},
	{
		id: 'freund-2',
		text: 'Freundschaft ist eine Seele in zwei Korpern.',
		author: 'Aristoteles',
		category: 'freundschaft',
	},
	// Mut
	{
		id: 'mut-1',
		text: 'Mut steht am Anfang des Handelns, Gluck am Ende.',
		author: 'Demokrit',
		category: 'mut',
	},
	{
		id: 'mut-2',
		text: 'Wer wagt, gewinnt.',
		author: 'Deutsches Sprichwort',
		category: 'mut',
	},
	{
		id: 'mut-3',
		text: 'Der Mutige hat nicht weniger Angst, er handelt trotzdem.',
		author: 'Mark Twain',
		category: 'mut',
	},
	// Hoffnung
	{
		id: 'hoff-1',
		text: 'Hoffnung ist ein Vogel, der singt, wenn die Nacht noch dunkel ist.',
		author: 'Rabindranath Tagore',
		category: 'hoffnung',
	},
	{
		id: 'hoff-2',
		text: 'Nach jedem Sturm scheint auch wieder die Sonne.',
		author: 'Deutsches Sprichwort',
		category: 'hoffnung',
	},
	// Natur
	{
		id: 'natur-1',
		text: 'In der Natur ist nichts isoliert; alles hangt mit allem zusammen.',
		author: 'Johann Wolfgang von Goethe',
		category: 'natur',
	},
	{
		id: 'natur-2',
		text: 'Schau tief in die Natur, und dann wirst du alles besser verstehen.',
		author: 'Albert Einstein',
		category: 'natur',
	},
];

// Category labels in German
export const CATEGORY_LABELS: Record<Category, string> = {
	motivation: 'Motivation',
	weisheit: 'Weisheit',
	liebe: 'Liebe',
	leben: 'Leben',
	erfolg: 'Erfolg',
	glueck: 'Gluck',
	freundschaft: 'Freundschaft',
	mut: 'Mut',
	hoffnung: 'Hoffnung',
	natur: 'Natur',
};
