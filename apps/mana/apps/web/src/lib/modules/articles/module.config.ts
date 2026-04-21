import type { ModuleConfig } from '$lib/data/module-registry';

/**
 * Articles module — saved web articles + highlights + tag links.
 *
 * `articleTags` is a pure junction into globalTags (the core `tags`
 * appId). The junction itself syncs under `articles` appId with its
 * owning rows, the same pattern every other tagged module uses
 * (noteTags, eventTags, contactTags, placeTags, …).
 */
export const articlesModuleConfig: ModuleConfig = {
	appId: 'articles',
	tables: [
		{ name: 'articles' },
		{ name: 'articleHighlights', syncName: 'highlights' },
		{ name: 'articleTags' },
	],
};
