/**
 * Articles module — barrel exports.
 */

export { articlesStore } from './stores/articles.svelte';
export { highlightsStore } from './stores/highlights.svelte';
export { articleTagOps } from './stores/tags.svelte';

export {
	useAllArticles,
	useArticle,
	useArticleHighlights,
	useAllHighlights,
	useArticleTagIds,
	useArticleTagMap,
	useStats,
	toArticle,
	toHighlight,
	filterByStatus,
	searchArticles,
} from './queries';

export type { ArticlesStats, SiteCount, HighlightWithArticle } from './queries';

export { articleTable, articleHighlightTable, articleTagTable } from './collections';

export type {
	LocalArticle,
	LocalHighlight,
	LocalArticleTag,
	Article,
	Highlight,
	ArticleStatus,
	HighlightColor,
} from './types';
