import type { ModuleConfig } from '$lib/data/module-registry';

/**
 * Articles module — saved web articles + highlights + tag links + bulk-
 * import jobs.
 *
 * `articleTags` is a pure junction into globalTags (the core `tags`
 * appId). The junction itself syncs under `articles` appId with its
 * owning rows, the same pattern every other tagged module uses
 * (noteTags, eventTags, contactTags, placeTags, …).
 *
 * `articleImportJobs` + `articleImportItems` + `articleExtractPickup`
 * implement the durable bulk-import pipeline (docs/plans/articles-bulk-
 * import.md). All three sync under the articles appId so multi-device
 * progress and server-worker state-transitions ride the standard
 * sync_changes channel.
 */
export const articlesModuleConfig: ModuleConfig = {
	appId: 'articles',
	tables: [
		{ name: 'articles' },
		{ name: 'articleHighlights', syncName: 'highlights' },
		{ name: 'articleTags' },
		{ name: 'articleImportJobs', syncName: 'importJobs' },
		{ name: 'articleImportItems', syncName: 'importItems' },
		{ name: 'articleExtractPickup', syncName: 'extractPickup' },
	],
};
