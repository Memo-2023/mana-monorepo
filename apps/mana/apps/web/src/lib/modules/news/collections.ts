/**
 * News module — Dexie table accessors and seed data.
 */

import { db } from '$lib/data/database';
import type {
	LocalArticle,
	LocalCachedArticle,
	LocalCategory,
	LocalPreferences,
	LocalReaction,
} from './types';
import { PREFERENCES_ID } from './types';

export const articleTable = db.table<LocalArticle>('newsArticles');
export const categoryTable = db.table<LocalCategory>('newsCategories');
export const preferencesTable = db.table<LocalPreferences>('newsPreferences');
export const reactionTable = db.table<LocalReaction>('newsReactions');
export const cachedFeedTable = db.table<LocalCachedArticle>('newsCachedFeed');

/**
 * Default preferences row written on first launch (before the user runs
 * the onboarding flow). `onboardingCompleted: false` is what triggers
 * the onboarding view to render instead of the feed.
 */
export const DEFAULT_PREFERENCES: LocalPreferences = {
	id: PREFERENCES_ID,
	selectedTopics: [],
	blockedSources: [],
	preferredLanguages: ['de', 'en'],
	topicWeights: {},
	sourceWeights: {},
	onboardingCompleted: false,
	customFeeds: [],
};
