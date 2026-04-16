/**
 * HTTP client for the mana-api news-research endpoints.
 *
 * Called by the pre-planning research step in the tick loop: when a
 * mission's objective matches research keywords, we discover RSS feeds
 * + search them for relevant articles BEFORE the Planner prompt is
 * built. The results go into the Planner's resolved-inputs so the LLM
 * can reference real sources in its plan — instead of hallucinating
 * URLs.
 *
 * Endpoints called:
 *   POST /api/v1/news-research/discover — find RSS feeds for a query
 *   POST /api/v1/news-research/search   — rank articles from those feeds
 *
 * Both live on mana-api (Hono/Bun, port 3060 internally). Service-to-
 * service auth is not required on this internal path (same trust
 * boundary as mana-llm calls).
 */

export interface DiscoveredFeed {
	url: string;
	title: string;
	description: string;
}

export interface ScoredArticle {
	url: string;
	title: string;
	excerpt: string | null;
	publishedAt: string | null;
	feedUrl: string;
	score: number;
}

export interface NewsResearchResult {
	articles: ScoredArticle[];
	feedCount: number;
	/** Markdown-formatted context string ready for injection into the
	 *  Planner prompt as a ResolvedInput. */
	contextMarkdown: string;
}

export class NewsResearchClient {
	constructor(private manaApiUrl: string) {}

	/**
	 * Full pipeline: discover feeds for the query, then search + rank
	 * articles. Returns a ready-to-inject context blob.
	 *
	 * Gracefully returns null on any error (network, parse, timeout) so
	 * a failing mana-api doesn't crash the tick.
	 */
	async research(
		query: string,
		opts: { language?: string; limit?: number } = {}
	): Promise<NewsResearchResult | null> {
		try {
			const feeds = await this.discover(query, opts.language ?? 'de');
			if (!feeds || feeds.length === 0) return null;

			const feedUrls = feeds.map((f) => f.url);
			const articles = await this.search(feedUrls, query, opts.limit ?? 10);
			if (!articles || articles.length === 0) return null;

			const contextMarkdown = formatContext(query, feeds, articles);
			return {
				articles,
				feedCount: feeds.length,
				contextMarkdown,
			};
		} catch (err) {
			console.error(
				'[news-research-client] research failed:',
				err instanceof Error ? err.message : String(err)
			);
			return null;
		}
	}

	private async discover(query: string, language: string): Promise<DiscoveredFeed[] | null> {
		try {
			const res = await fetch(`${this.manaApiUrl}/api/v1/news-research/discover`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, language, limit: 5 }),
				signal: AbortSignal.timeout(15_000),
			});
			if (!res.ok) {
				console.warn(`[news-research-client] discover ${res.status}: ${res.statusText}`);
				return null;
			}
			const body = (await res.json()) as { feeds: DiscoveredFeed[] };
			return body.feeds;
		} catch (err) {
			console.warn(
				'[news-research-client] discover error:',
				err instanceof Error ? err.message : String(err)
			);
			return null;
		}
	}

	private async search(
		feedUrls: string[],
		query: string,
		limit: number
	): Promise<ScoredArticle[] | null> {
		try {
			const res = await fetch(`${this.manaApiUrl}/api/v1/news-research/search`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ feeds: feedUrls, query, limit }),
				signal: AbortSignal.timeout(30_000),
			});
			if (!res.ok) {
				console.warn(`[news-research-client] search ${res.status}: ${res.statusText}`);
				return null;
			}
			const body = (await res.json()) as { articles: ScoredArticle[] };
			return body.articles;
		} catch (err) {
			console.warn(
				'[news-research-client] search error:',
				err instanceof Error ? err.message : String(err)
			);
			return null;
		}
	}
}

/**
 * Turn discover + search results into a markdown block the Planner
 * prompt can reference. Mirrors the webapp's
 * `modules/news-research/tools.ts` formatting.
 */
function formatContext(query: string, feeds: DiscoveredFeed[], articles: ScoredArticle[]): string {
	const lines: string[] = [
		`# Web-Research: "${query}"`,
		'',
		`${feeds.length} Quellen durchsucht, ${articles.length} relevante Artikel gefunden:`,
		'',
	];

	for (const a of articles) {
		lines.push(`## ${a.title}`);
		if (a.excerpt) lines.push(`> ${a.excerpt}`);
		lines.push(`URL: ${a.url}`);
		if (a.publishedAt) lines.push(`Datum: ${a.publishedAt}`);
		lines.push('');
	}

	lines.push(
		'---',
		'Nutze diese Quellen fuer deinen Plan. Verwende nur URLs die oben stehen; erfinde keine.'
	);

	return lines.join('\n');
}
