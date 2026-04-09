/**
 * Curated source list — single source of truth for the news ingester.
 *
 * Each source declares its parser type (`rss` or `hn`), the topic it
 * belongs to, and the language. The `slug` MUST be stable across deploys
 * because user blocklists reference it from client-side storage.
 *
 * Adding a source = append a row here, redeploy. The unified Mana app
 * mirrors a sanitized subset (slug + name + topic + language) in
 * `apps/mana/apps/web/src/lib/modules/news/sources-meta.ts` for the
 * onboarding picker — keep both files in sync when editing.
 */

export type SourceParserType = 'rss' | 'hn';

export type Topic =
	| 'tech'
	| 'wissenschaft'
	| 'weltgeschehen'
	| 'wirtschaft'
	| 'kultur'
	| 'gesundheit'
	| 'politik';

export interface NewsSource {
	slug: string;
	name: string;
	type: SourceParserType;
	url: string;
	topic: Topic;
	language: 'de' | 'en';
}

export const SOURCES: NewsSource[] = [
	// ─── Tech ──────────────────────────────────────────────────
	{
		slug: 'hacker-news',
		name: 'Hacker News',
		type: 'hn',
		url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
		topic: 'tech',
		language: 'en',
	},
	{
		slug: 'arstechnica',
		name: 'Ars Technica',
		type: 'rss',
		url: 'https://feeds.arstechnica.com/arstechnica/index',
		topic: 'tech',
		language: 'en',
	},
	{
		slug: 'theverge',
		name: 'The Verge',
		type: 'rss',
		url: 'https://www.theverge.com/rss/index.xml',
		topic: 'tech',
		language: 'en',
	},
	{
		slug: 'heise',
		name: 'heise online',
		type: 'rss',
		url: 'https://www.heise.de/rss/heise-atom.xml',
		topic: 'tech',
		language: 'de',
	},

	// ─── Wissenschaft ──────────────────────────────────────────
	{
		slug: 'quanta-magazine',
		name: 'Quanta Magazine',
		type: 'rss',
		url: 'https://api.quantamagazine.org/feed/',
		topic: 'wissenschaft',
		language: 'en',
	},
	{
		slug: 'spektrum',
		name: 'Spektrum',
		type: 'rss',
		url: 'https://www.spektrum.de/alias/rss/spektrum-de-rss-feed/996406',
		topic: 'wissenschaft',
		language: 'de',
	},
	{
		slug: 'nature-news',
		name: 'Nature News',
		type: 'rss',
		url: 'https://www.nature.com/nature.rss',
		topic: 'wissenschaft',
		language: 'en',
	},
	{
		slug: 'phys-org',
		name: 'Phys.org',
		type: 'rss',
		url: 'https://phys.org/rss-feed/',
		topic: 'wissenschaft',
		language: 'en',
	},

	// ─── Weltgeschehen ─────────────────────────────────────────
	// Note: Reuters and AP both block automated feed fetchers as of
	// 2026-04 (Reuters returns 406, AP refuses connection). Replaced
	// with Al Jazeera and DW which both publish open RSS.
	{
		slug: 'tagesschau',
		name: 'Tagesschau',
		type: 'rss',
		url: 'https://www.tagesschau.de/xml/rss2/',
		topic: 'weltgeschehen',
		language: 'de',
	},
	{
		slug: 'bbc-world',
		name: 'BBC World',
		type: 'rss',
		url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
		topic: 'weltgeschehen',
		language: 'en',
	},
	{
		slug: 'aljazeera',
		name: 'Al Jazeera',
		type: 'rss',
		url: 'https://www.aljazeera.com/xml/rss/all.xml',
		topic: 'weltgeschehen',
		language: 'en',
	},
	{
		slug: 'dw-top',
		name: 'Deutsche Welle',
		type: 'rss',
		url: 'https://rss.dw.com/rdf/rss-en-top',
		topic: 'weltgeschehen',
		language: 'en',
	},

	// ─── Wirtschaft ────────────────────────────────────────────
	{
		slug: 'handelsblatt',
		name: 'Handelsblatt',
		type: 'rss',
		url: 'https://www.handelsblatt.com/contentexport/feed/schlagzeilen',
		topic: 'wirtschaft',
		language: 'de',
	},
	{
		slug: 'ft-world',
		name: 'Financial Times',
		type: 'rss',
		url: 'https://www.ft.com/world?format=rss',
		topic: 'wirtschaft',
		language: 'en',
	},
	{
		slug: 'bloomberg-markets',
		name: 'Bloomberg Markets',
		type: 'rss',
		url: 'https://feeds.bloomberg.com/markets/news.rss',
		topic: 'wirtschaft',
		language: 'en',
	},
	{
		slug: 'economist-finance',
		name: 'The Economist — Finance',
		type: 'rss',
		url: 'https://www.economist.com/finance-and-economics/rss.xml',
		topic: 'wirtschaft',
		language: 'en',
	},

	// ─── Kultur ────────────────────────────────────────────────
	// Perlentaucher and ZEIT Kultur both 404'd in testing (2026-04);
	// replaced with NPR Arts and Guardian Books which are stable.
	{
		slug: 'guardian-culture',
		name: 'The Guardian Culture',
		type: 'rss',
		url: 'https://www.theguardian.com/culture/rss',
		topic: 'kultur',
		language: 'en',
	},
	{
		slug: 'guardian-books',
		name: 'The Guardian Books',
		type: 'rss',
		url: 'https://www.theguardian.com/books/rss',
		topic: 'kultur',
		language: 'en',
	},
	{
		slug: 'npr-arts',
		name: 'NPR Arts',
		type: 'rss',
		url: 'https://feeds.npr.org/1008/rss.xml',
		topic: 'kultur',
		language: 'en',
	},

	// ─── Gesundheit ────────────────────────────────────────────
	// Ärzteblatt and NIH both 404'd; STAT News still works. Added
	// BBC Health and ScienceDaily as reliable replacements.
	{
		slug: 'stat-news',
		name: 'STAT News',
		type: 'rss',
		url: 'https://www.statnews.com/feed/',
		topic: 'gesundheit',
		language: 'en',
	},
	{
		slug: 'bbc-health',
		name: 'BBC Health',
		type: 'rss',
		url: 'https://feeds.bbci.co.uk/news/health/rss.xml',
		topic: 'gesundheit',
		language: 'en',
	},
	{
		slug: 'sciencedaily-health',
		name: 'ScienceDaily Health',
		type: 'rss',
		url: 'https://www.sciencedaily.com/rss/health_medicine.xml',
		topic: 'gesundheit',
		language: 'en',
	},

	// ─── Politik ───────────────────────────────────────────────
	{
		slug: 'spiegel-politik',
		name: 'Spiegel Politik',
		type: 'rss',
		url: 'https://www.spiegel.de/politik/index.rss',
		topic: 'politik',
		language: 'de',
	},
	{
		slug: 'politico-eu',
		name: 'Politico EU',
		type: 'rss',
		url: 'https://www.politico.eu/feed/',
		topic: 'politik',
		language: 'en',
	},
	{
		slug: 'atlantic-politics',
		name: 'The Atlantic — Politics',
		type: 'rss',
		url: 'https://www.theatlantic.com/feed/channel/politics/',
		topic: 'politik',
		language: 'en',
	},
];

/** Build a quick lookup by slug. */
export const SOURCE_BY_SLUG: Record<string, NewsSource> = Object.fromEntries(
	SOURCES.map((s) => [s.slug, s])
);
