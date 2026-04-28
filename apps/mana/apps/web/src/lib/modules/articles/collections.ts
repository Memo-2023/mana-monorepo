/**
 * Articles module — Dexie accessors.
 *
 * No guest seed: articles are by definition URLs the user chose to save,
 * so an empty state is the honest first-run experience. The ListView's
 * empty-state hints the user toward /articles/add instead.
 */

import { db } from '$lib/data/database';
import type {
	LocalArticle,
	LocalArticleExtractPickup,
	LocalArticleImportItem,
	LocalArticleImportJob,
	LocalArticleTag,
	LocalHighlight,
} from './types';

export const articleTable = db.table<LocalArticle>('articles');
export const articleHighlightTable = db.table<LocalHighlight>('articleHighlights');
export const articleTagTable = db.table<LocalArticleTag>('articleTags');
export const articleImportJobTable = db.table<LocalArticleImportJob>('articleImportJobs');
export const articleImportItemTable = db.table<LocalArticleImportItem>('articleImportItems');
export const articleExtractPickupTable =
	db.table<LocalArticleExtractPickup>('articleExtractPickup');
