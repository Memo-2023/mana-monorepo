import Parser from 'rss-parser';
import { DEFAULT_USER_AGENT, type NormalizedFeedItem } from './types';

type CustomItem = {
	'media:content'?: { $: { url: string } };
	'media:thumbnail'?: { $: { url: string } };
	enclosure?: { url?: string };
};

const parser: Parser<unknown, CustomItem> = new Parser({
	timeout: 15_000,
	headers: { 'User-Agent': DEFAULT_USER_AGENT },
	customFields: {
		item: ['media:content', 'media:thumbnail', 'enclosure'],
	},
});

function mapItem(item: unknown): NormalizedFeedItem {
	const i = item as CustomItem & {
		link?: string;
		title?: string;
		content?: string;
		contentSnippet?: string;
		creator?: string;
		author?: string;
		isoDate?: string;
	};

	const imageUrl =
		i['media:content']?.$?.url ?? i['media:thumbnail']?.$?.url ?? i.enclosure?.url ?? null;

	return {
		url: i.link ?? '',
		title: i.title ?? '',
		excerpt: i.contentSnippet ?? null,
		content: i.contentSnippet ?? null,
		htmlContent: i.content ?? null,
		author: i.creator ?? i.author ?? null,
		imageUrl,
		publishedAt: i.isoDate ? new Date(i.isoDate) : null,
	};
}

export async function parseFeedUrl(url: string): Promise<NormalizedFeedItem[]> {
	const feed = await parser.parseURL(url);
	return (feed.items ?? []).map(mapItem);
}

export async function parseFeedXml(xml: string): Promise<NormalizedFeedItem[]> {
	const feed = await parser.parseString(xml);
	return (feed.items ?? []).map(mapItem);
}

export interface ParsedFeed {
	title: string | null;
	items: NormalizedFeedItem[];
}

export async function parseFeedMeta(url: string): Promise<ParsedFeed> {
	const feed = await parser.parseURL(url);
	return {
		title: feed.title ?? null,
		items: (feed.items ?? []).map(mapItem),
	};
}
