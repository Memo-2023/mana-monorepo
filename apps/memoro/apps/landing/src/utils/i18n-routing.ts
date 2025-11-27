/**
 * i18n Routing Utilities
 * Handles the generation of static paths for multilingual routes
 * German (de) routes have no prefix, English (en) routes have /en/ prefix
 */

import type { GetStaticPathsResult } from 'astro';

export interface LangParam {
	lang: 'de' | 'en';
}

/**
 * Generate static paths for language routes
 * Creates paths with correct structure:
 * - German: /path (no prefix)
 * - English: /en/path
 */
export function getI18nStaticPaths(): GetStaticPathsResult {
	return [
		{ params: { lang: 'de' as const }, props: { lang: 'de' as const } },
		{ params: { lang: 'en' as const }, props: { lang: 'en' as const } },
	];
}

/**
 * Generate static paths for dynamic content with language support
 * @param items Array of items with slug and lang properties
 * @param additionalProps Additional props to pass to each page
 */
export function getI18nStaticPathsWithSlug<T extends { slug: string; lang: 'de' | 'en' }>(
	items: T[],
	additionalProps?: (item: T) => Record<string, any>
): GetStaticPathsResult {
	return items.map((item) => ({
		params: {
			lang: item.lang,
			slug: item.slug,
		},
		props: {
			lang: item.lang,
			...additionalProps?.(item),
		},
	}));
}

/**
 * Check if we're in the build process
 */
export function isBuild(): boolean {
	return import.meta.env.PROD || process.env.NODE_ENV === 'production';
}
