/**
 * News module — barrel exports.
 */

export {
	articleTable,
	categoryTable,
	preferencesTable,
	reactionTable,
	cachedFeedTable,
	DEFAULT_PREFERENCES,
} from './collections';

export {
	useSavedArticles,
	useArticle,
	useCategories,
	usePreferences,
	useReactions,
	useCachedFeed,
	toArticle,
	toCategory,
	toPreferences,
	toReaction,
	formatRelativeTime,
} from './queries';

export {
	rankFeed,
	scoreArticle,
	buildReactedIds,
	buildReactionSets,
	applyReaction,
	TOPIC_WEIGHT_DEFAULT,
} from './feed-engine';

export type { ScoredArticle, ScoreContext, WeightDiff } from './feed-engine';

export { articlesStore } from './stores/articles.svelte';
export { categoriesStore } from './stores/categories.svelte';
export { preferencesStore } from './stores/preferences.svelte';
export { reactionsStore } from './stores/reactions.svelte';
export { feedCacheStore } from './stores/feed-cache.svelte';

export { fetchFeed } from './api';
export type { FeedArticleDto, FeedQuery } from './api';

export { SOURCES_META, SOURCE_META_BY_SLUG, sourcesForTopic, TOPIC_LABELS } from './sources-meta';
export type { SourceMeta } from './sources-meta';

export { ALL_TOPICS, PREFERENCES_ID } from './types';
export type {
	Article,
	Category,
	LocalArticle,
	LocalCachedArticle,
	LocalCategory,
	LocalPreferences,
	LocalReaction,
	Language,
	Preferences,
	Reaction,
	ReactionKind,
	Topic,
} from './types';
