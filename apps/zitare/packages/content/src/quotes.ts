import type { Quote } from './types';

/**
 * German inspirational quotes collection
 */
export const QUOTES: Quote[] = [
	// ============================================
	// MOTIVATION
	// ============================================
	{
		id: 'mot-1',
		text: 'Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.',
		author: 'Steve Jobs',
		category: 'motivation',
	},
	{
		id: 'mot-2',
		text: 'Erfolg ist nicht endgültig, Misserfolg ist nicht fatal: Was zählt, ist der Mut weiterzumachen.',
		author: 'Winston Churchill',
		category: 'motivation',
	},
	{
		id: 'mot-3',
		text: 'Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.',
		author: 'Eleanor Roosevelt',
		category: 'motivation',
	},
	{
		id: 'mot-4',
		text: 'Es ist nie zu spät, das zu werden, was man hätte sein können.',
		author: 'George Eliot',
		category: 'motivation',
	},
	{
		id: 'mot-5',
		text: 'Gib jedem Tag die Chance, der schönste deines Lebens zu werden.',
		author: 'Mark Twain',
		category: 'motivation',
	},
	{
		id: 'mot-6',
		text: 'Der Anfang ist die Hälfte des Ganzen.',
		author: 'Aristoteles',
		category: 'motivation',
	},
	{
		id: 'mot-7',
		text: 'Tue heute etwas, wofür dein zukünftiges Ich dir danken wird.',
		author: 'Sean Patrick Flanery',
		category: 'motivation',
	},
	{
		id: 'mot-8',
		text: 'Der beste Zeitpunkt einen Baum zu pflanzen war vor 20 Jahren. Der zweitbeste ist jetzt.',
		author: 'Chinesisches Sprichwort',
		category: 'motivation',
	},

	// ============================================
	// WEISHEIT
	// ============================================
	{
		id: 'weis-1',
		text: 'Der Weg ist das Ziel.',
		author: 'Konfuzius',
		category: 'weisheit',
	},
	{
		id: 'weis-2',
		text: 'Wer kämpft, kann verlieren. Wer nicht kämpft, hat schon verloren.',
		author: 'Bertolt Brecht',
		category: 'weisheit',
	},
	{
		id: 'weis-3',
		text: 'Man sieht nur mit dem Herzen gut. Das Wesentliche ist für die Augen unsichtbar.',
		author: 'Antoine de Saint-Exupéry',
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
	{
		id: 'weis-6',
		text: 'Ich weiß, dass ich nichts weiß.',
		author: 'Sokrates',
		category: 'weisheit',
	},
	{
		id: 'weis-7',
		text: 'Die einzige Konstante im Leben ist die Veränderung.',
		author: 'Heraklit',
		category: 'weisheit',
	},
	{
		id: 'weis-8',
		text: 'Handle nur nach derjenigen Maxime, durch die du zugleich wollen kannst, dass sie ein allgemeines Gesetz werde.',
		author: 'Immanuel Kant',
		category: 'weisheit',
	},

	// ============================================
	// LIEBE
	// ============================================
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
		text: 'Es gibt nur ein Glück in diesem Leben: zu lieben und geliebt zu werden.',
		author: 'George Sand',
		category: 'liebe',
	},
	{
		id: 'liebe-4',
		text: 'Liebe ist das einzige, was wächst, wenn wir es verschwenden.',
		author: 'Ricarda Huch',
		category: 'liebe',
	},
	{
		id: 'liebe-5',
		text: 'Die größte Sache der Welt ist es, zu wissen, wie man sich selbst gehört.',
		author: 'Michel de Montaigne',
		category: 'liebe',
	},

	// ============================================
	// LEBEN
	// ============================================
	{
		id: 'leben-1',
		text: 'Das Leben ist wie Fahrrad fahren. Um die Balance zu halten, musst du in Bewegung bleiben.',
		author: 'Albert Einstein',
		category: 'leben',
	},
	{
		id: 'leben-2',
		text: 'Leben ist das, was passiert, während du damit beschäftigt bist, andere Pläne zu machen.',
		author: 'John Lennon',
		category: 'leben',
	},
	{
		id: 'leben-3',
		text: 'Das Leben ist zu kurz für später.',
		author: 'Alexandra Reinwarth',
		category: 'leben',
	},
	{
		id: 'leben-4',
		text: 'Lebe jeden Tag, als wäre es dein letzter.',
		author: 'Marcus Aurelius',
		category: 'leben',
	},
	{
		id: 'leben-5',
		text: 'Das Leben ist kein Problem, das gelöst werden muss, sondern eine Wirklichkeit, die erfahren werden will.',
		author: 'Søren Kierkegaard',
		category: 'leben',
	},
	{
		id: 'leben-6',
		text: 'Wer sein Leben so einrichtet, dass er niemals auf die Nase fallen kann, der kann nur auf dem Bauch kriechen.',
		author: 'Heinz Riesenhuber',
		category: 'leben',
	},

	// ============================================
	// ERFOLG
	// ============================================
	{
		id: 'erfolg-1',
		text: 'Erfolg besteht darin, dass man genau die Fähigkeiten hat, die im Moment gefragt sind.',
		author: 'Henry Ford',
		category: 'erfolg',
	},
	{
		id: 'erfolg-2',
		text: 'Der Preis des Erfolges ist Hingabe, harte Arbeit und unablässiger Einsatz.',
		author: 'Frank Lloyd Wright',
		category: 'erfolg',
	},
	{
		id: 'erfolg-3',
		text: 'Ich habe nicht versagt. Ich habe nur 10.000 Wege gefunden, die nicht funktionieren.',
		author: 'Thomas Edison',
		category: 'erfolg',
	},
	{
		id: 'erfolg-4',
		text: 'Der Erfolg ist nicht das Endergebnis, das Scheitern ist nicht tödlich: Was zählt, ist der Mut, weiterzumachen.',
		author: 'Winston Churchill',
		category: 'erfolg',
	},
	{
		id: 'erfolg-5',
		text: 'Erfolg hat drei Buchstaben: TUN.',
		author: 'Johann Wolfgang von Goethe',
		category: 'erfolg',
	},

	// ============================================
	// GLÜCK
	// ============================================
	{
		id: 'glueck-1',
		text: 'Glück ist das Einzige, das sich verdoppelt, wenn man es teilt.',
		author: 'Albert Schweitzer',
		category: 'glueck',
	},
	{
		id: 'glueck-2',
		text: 'Glück ist kein Ziel, sondern ein Weg.',
		author: 'Buddha',
		category: 'glueck',
	},
	{
		id: 'glueck-3',
		text: 'Nicht die Glücklichen sind dankbar. Es sind die Dankbaren, die glücklich sind.',
		author: 'Francis Bacon',
		category: 'glueck',
	},
	{
		id: 'glueck-4',
		text: 'Das Vergleichen ist das Ende des Glücks und der Anfang der Unzufriedenheit.',
		author: 'Søren Kierkegaard',
		category: 'glueck',
	},
	{
		id: 'glueck-5',
		text: 'Glück entsteht oft durch Aufmerksamkeit in kleinen Dingen, Unglück oft durch Vernachlässigung kleiner Dinge.',
		author: 'Wilhelm Busch',
		category: 'glueck',
	},

	// ============================================
	// FREUNDSCHAFT
	// ============================================
	{
		id: 'freund-1',
		text: 'Ein wahrer Freund ist jemand, der die Melodie deines Herzens kennt und sie dir vorsingt, wenn du sie vergessen hast.',
		author: 'Albert Einstein',
		category: 'freundschaft',
	},
	{
		id: 'freund-2',
		text: 'Freundschaft ist eine Seele in zwei Körpern.',
		author: 'Aristoteles',
		category: 'freundschaft',
	},
	{
		id: 'freund-3',
		text: 'Ein Freund ist ein Mensch, vor dem man laut denken kann.',
		author: 'Ralph Waldo Emerson',
		category: 'freundschaft',
	},
	{
		id: 'freund-4',
		text: 'Die Freundschaft gehört zum Notwendigsten in unserem Leben.',
		author: 'Aristoteles',
		category: 'freundschaft',
	},

	// ============================================
	// MUT
	// ============================================
	{
		id: 'mut-1',
		text: 'Mut steht am Anfang des Handelns, Glück am Ende.',
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
	{
		id: 'mut-4',
		text: 'Mut ist nicht die Abwesenheit von Angst, sondern die Erkenntnis, dass etwas anderes wichtiger ist als Angst.',
		author: 'Ambrose Redmoon',
		category: 'mut',
	},
	{
		id: 'mut-5',
		text: 'Inmitten der Schwierigkeit liegt die Möglichkeit.',
		author: 'Albert Einstein',
		category: 'mut',
	},

	// ============================================
	// HOFFNUNG
	// ============================================
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
	{
		id: 'hoff-3',
		text: 'Auch aus Steinen, die einem in den Weg gelegt werden, kann man Schönes bauen.',
		author: 'Johann Wolfgang von Goethe',
		category: 'hoffnung',
	},
	{
		id: 'hoff-4',
		text: 'Das Licht am Ende des Tunnels ist kein Zug.',
		author: 'Deutsches Sprichwort',
		category: 'hoffnung',
	},

	// ============================================
	// NATUR
	// ============================================
	{
		id: 'natur-1',
		text: 'In der Natur ist nichts isoliert; alles hängt mit allem zusammen.',
		author: 'Johann Wolfgang von Goethe',
		category: 'natur',
	},
	{
		id: 'natur-2',
		text: 'Schau tief in die Natur, und dann wirst du alles besser verstehen.',
		author: 'Albert Einstein',
		category: 'natur',
	},
	{
		id: 'natur-3',
		text: 'Die Natur macht keine Sprünge.',
		author: 'Carl von Linné',
		category: 'natur',
	},
	{
		id: 'natur-4',
		text: 'Vergiss nicht, dass die Erde sich freut, deine nackten Füße zu fühlen, und die Winde sich danach sehnen, mit deinem Haar zu spielen.',
		author: 'Khalil Gibran',
		category: 'natur',
	},
];

/**
 * Total number of quotes
 */
export const QUOTE_COUNT = QUOTES.length;
