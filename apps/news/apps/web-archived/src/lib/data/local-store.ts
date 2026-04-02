import { createLocalStore, type BaseRecord } from '@manacore/local-store';

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export interface LocalArticle extends BaseRecord {
	type: 'feed' | 'summary' | 'in_depth' | 'saved';
	sourceOrigin: 'ai' | 'user_saved';
	title: string;
	content?: string | null;
	htmlContent?: string | null;
	excerpt?: string | null;
	originalUrl?: string | null;
	author?: string | null;
	siteName?: string | null;
	imageUrl?: string | null;
	wordCount?: number | null;
	readingTimeMinutes?: number | null;
	categoryId?: string | null;
	isArchived: boolean;
	publishedAt?: string | null;
}

export interface LocalCategory extends BaseRecord {
	name: string;
	slug: string;
	color?: string | null;
	order: number;
}

import { guestArticles, guestCategories } from './guest-seed';

export const newsStore = createLocalStore({
	appId: 'news',
	collections: [
		{
			name: 'articles',
			indexes: ['type', 'sourceOrigin', 'isArchived', 'categoryId', '[type+isArchived]'],
			guestSeed: guestArticles,
		},
		{
			name: 'categories',
			indexes: ['slug', 'order'],
			guestSeed: guestCategories,
		},
	],
	sync: { serverUrl: SYNC_SERVER_URL },
});

export const articleCollection = newsStore.collection<LocalArticle>('articles');
export const categoryCollection = newsStore.collection<LocalCategory>('categories');
