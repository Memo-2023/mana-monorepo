import type { ModuleConfig } from '$lib/data/module-registry';

/**
 * News module — five Dexie tables, four of them synced.
 *
 * `newsCachedFeed` is intentionally absent: it mirrors the public
 * server pool, refreshes on a 10-minute poll, and would chew through
 * sync bandwidth + storage quota for zero benefit (the same data is
 * just an HTTP fetch away).
 */
export const newsModuleConfig: ModuleConfig = {
	appId: 'news',
	tables: [
		{ name: 'newsArticles', syncName: 'articles' },
		{ name: 'newsCategories', syncName: 'categories' },
		{ name: 'newsPreferences', syncName: 'preferences' },
		{ name: 'newsReactions', syncName: 'reactions' },
	],
};
