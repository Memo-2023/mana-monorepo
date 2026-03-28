/**
 * Search Functionality using Fuse.js
 * Provides full-text search across help content
 */

import Fuse, { type IFuseOptions } from 'fuse.js';
import type {
	HelpContent,
	FAQItem,
	FeatureItem,
	GettingStartedItem,
	ChangelogItem,
} from './content';
import type {
	SearchableItem,
	SearchResult,
	SearchOptions,
	SearchIndexConfig,
} from './content';
import { generateExcerpt, stripHtml } from './parser.js';
import { sanitizeHtml } from './sanitize.js';

const DEFAULT_CONFIG: SearchIndexConfig = {
	titleWeight: 2,
	contentWeight: 1,
	tagsWeight: 1.5,
	threshold: 0.3,
	minMatchCharLength: 2,
};

/**
 * Convert HelpContent to searchable items
 */
export function flattenContentForSearch(content: HelpContent): SearchableItem[] {
	const items: SearchableItem[] = [];

	// FAQs
	for (const faq of content.faq) {
		items.push({
			id: faq.id,
			type: 'faq',
			title: faq.question,
			question: faq.question,
			content: stripHtml(faq.answer),
			tags: faq.tags,
		});
	}

	// Features
	for (const feature of content.features) {
		items.push({
			id: feature.id,
			type: 'feature',
			title: feature.title,
			description: feature.description,
			content: stripHtml(feature.content),
			tags: feature.highlights,
		});
	}

	// Getting Started Guides
	for (const guide of content.gettingStarted) {
		items.push({
			id: guide.id,
			type: 'guide',
			title: guide.title,
			description: guide.description,
			content: stripHtml(guide.content),
		});
	}

	// Changelog
	for (const log of content.changelog) {
		items.push({
			id: log.id,
			type: 'changelog',
			title: `${log.version} - ${log.title}`,
			content: stripHtml(log.content),
			description: log.summary,
		});
	}

	return items;
}

/**
 * Build a Fuse.js search index from help content
 */
export function buildSearchIndex(
	content: HelpContent,
	config: SearchIndexConfig = DEFAULT_CONFIG
): Fuse<SearchableItem> {
	const items = flattenContentForSearch(content);

	const fuseOptions: IFuseOptions<SearchableItem> = {
		keys: [
			{ name: 'title', weight: config.titleWeight ?? 2 },
			{ name: 'question', weight: config.titleWeight ?? 2 },
			{ name: 'content', weight: config.contentWeight ?? 1 },
			{ name: 'description', weight: config.contentWeight ?? 1 },
			{ name: 'tags', weight: config.tagsWeight ?? 1.5 },
		],
		threshold: config.threshold ?? 0.3,
		includeScore: true,
		minMatchCharLength: config.minMatchCharLength ?? 2,
		ignoreLocation: true,
	};

	return new Fuse(items, fuseOptions);
}

/**
 * Find the original item from content
 */
function findOriginalItem(
	id: string,
	type: string,
	content: HelpContent
): FAQItem | FeatureItem | GettingStartedItem | ChangelogItem | null {
	switch (type) {
		case 'faq':
			return content.faq.find((item) => item.id === id) ?? null;
		case 'feature':
			return content.features.find((item) => item.id === id) ?? null;
		case 'guide':
			return content.gettingStarted.find((item) => item.id === id) ?? null;
		case 'changelog':
			return content.changelog.find((item) => item.id === id) ?? null;
		default:
			return null;
	}
}

/**
 * Highlight matching text in content
 */
function highlightMatch(text: string, query: string): string {
	if (!query.trim()) return text;
	// Sanitize text first, then apply highlighting
	const safeText = sanitizeHtml(text);
	const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
	return safeText.replace(regex, '<mark>$1</mark>');
}

/**
 * Search help content
 */
export function search(
	index: Fuse<SearchableItem>,
	query: string,
	content: HelpContent,
	options: SearchOptions = {}
): SearchResult[] {
	const { limit = 10, threshold, types, appId } = options;

	if (!query.trim()) {
		return [];
	}

	let results = index.search(query, { limit: limit * 2 });

	// Filter by type if specified
	if (types && types.length > 0) {
		results = results.filter((r) => types.includes(r.item.type));
	}

	// Filter by app if specified
	if (appId) {
		results = results.filter((r) => {
			const originalItem = findOriginalItem(r.item.id, r.item.type, content);
			if (!originalItem) return true;
			if (!originalItem.appSpecific) return true;
			return originalItem.apps?.includes(appId);
		});
	}

	// Apply threshold filter if specified
	if (threshold !== undefined) {
		results = results.filter((r) => (r.score ?? 1) <= threshold);
	}

	// Limit results
	results = results.slice(0, limit);

	const mappedResults: SearchResult[] = [];

	for (const result of results) {
		const originalItem = findOriginalItem(result.item.id, result.item.type, content);
		if (!originalItem) continue;

		mappedResults.push({
			id: result.item.id,
			type: result.item.type,
			title: result.item.title,
			excerpt: generateExcerpt(result.item.content, 150),
			score: result.score ?? 1,
			highlight: highlightMatch(result.item.title, query),
			item: originalItem,
		});
	}

	return mappedResults;
}

/**
 * Create a search function with pre-built index
 */
export function createSearcher(content: HelpContent, config?: SearchIndexConfig) {
	const index = buildSearchIndex(content, config);

	return (query: string, options?: SearchOptions) => search(index, query, content, options);
}
