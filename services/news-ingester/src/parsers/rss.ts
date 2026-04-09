/**
 * RSS/Atom parser wrapper. Returns a normalized shape so the ingest loop
 * doesn't have to know about feed-format quirks.
 *
 * `rss-parser` handles both RSS 2.0 and Atom transparently. We pull out
 * the bits we need (link, title, content/snippet, image, date) and let
 * the ingester decide whether to call Readability for full-text.
 */

import Parser from 'rss-parser';

export interface NormalizedFeedItem {
	url: string;
	title: string;
	excerpt: string | null;
	content: string | null;
	htmlContent: string | null;
	author: string | null;
	imageUrl: string | null;
	publishedAt: Date | null;
}

type CustomItem = {
	'media:content'?: { $: { url: string } };
	'media:thumbnail'?: { $: { url: string } };
	enclosure?: { url?: string };
};

const parser: Parser<unknown, CustomItem> = new Parser({
	timeout: 15_000,
	headers: {
		'User-Agent': 'Mozilla/5.0 (compatible; ManaNewsIngester/1.0; +https://mana.how/news)',
	},
	customFields: {
		item: ['media:content', 'media:thumbnail', 'enclosure'],
	},
});

export async function fetchFeed(url: string): Promise<NormalizedFeedItem[]> {
	const feed = await parser.parseURL(url);

	return (feed.items ?? []).map((item) => {
		// rss-parser stuffs full HTML in `content` for Atom, plain in `contentSnippet`.
		const html = (item as { content?: string }).content ?? null;
		const text = (item as { contentSnippet?: string }).contentSnippet ?? null;

		// Image: try a few common locations.
		const mediaContent = item['media:content']?.$?.url;
		const mediaThumb = item['media:thumbnail']?.$?.url;
		const enclosureUrl = item.enclosure?.url;
		const imageUrl = mediaContent ?? mediaThumb ?? enclosureUrl ?? null;

		const link = (item as { link?: string }).link ?? '';
		const title = (item as { title?: string }).title ?? '';
		const author =
			(item as { creator?: string; author?: string }).creator ??
			(item as { author?: string }).author ??
			null;
		const isoDate = (item as { isoDate?: string }).isoDate ?? null;

		return {
			url: link,
			title,
			excerpt: text,
			content: text,
			htmlContent: html,
			author,
			imageUrl,
			publishedAt: isoDate ? new Date(isoDate) : null,
		};
	});
}
