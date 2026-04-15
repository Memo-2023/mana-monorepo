/**
 * Hacker News firebase API parser.
 *
 * The HN top-stories endpoint returns ~500 IDs; we take the first 30 and
 * fetch each item. External-link stories are kept (their `url` field is
 * the article); Ask-HN / job posts (no `url`) are skipped because the
 * "article" lives at the HN discussion page itself, which Readability
 * struggles with and which isn't the user's expectation for a news feed.
 */

import type { NormalizedFeedItem } from '@mana/shared-rss';

interface HnItem {
	id: number;
	type?: string;
	by?: string;
	time?: number;
	title?: string;
	url?: string;
	text?: string;
}

const TOP_LIMIT = 30;

export async function fetchHackerNews(topStoriesUrl: string): Promise<NormalizedFeedItem[]> {
	const idsResp = await fetch(topStoriesUrl, { signal: AbortSignal.timeout(15_000) });
	if (!idsResp.ok) return [];
	const ids = (await idsResp.json()) as number[];
	const slice = ids.slice(0, TOP_LIMIT);

	const items = await Promise.all(
		slice.map(async (id) => {
			try {
				const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
					signal: AbortSignal.timeout(10_000),
				});
				if (!r.ok) return null;
				return (await r.json()) as HnItem;
			} catch {
				return null;
			}
		})
	);

	return items
		.filter((it): it is HnItem => !!it && it.type === 'story' && !!it.url && !!it.title)
		.map((it) => ({
			url: it.url!,
			title: it.title!,
			excerpt: null,
			content: null,
			htmlContent: null,
			author: it.by ?? null,
			imageUrl: null,
			publishedAt: it.time ? new Date(it.time * 1000) : null,
		}));
}
