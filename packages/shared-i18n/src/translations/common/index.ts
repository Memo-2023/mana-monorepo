/**
 * Common translations exports
 */

import en from './en.json';
import de from './de.json';

export { en, de };

/**
 * Common translations type
 */
export type CommonTranslations = typeof en;

/**
 * Get common translations by locale
 */
export function getCommonTranslations(locale: string): CommonTranslations {
	switch (locale) {
		case 'de':
			return de;
		case 'en':
		default:
			return en;
	}
}

/**
 * Merge common translations with app-specific translations
 */
export function mergeWithCommon<T extends Record<string, unknown>>(
	locale: string,
	appTranslations: T
): T & CommonTranslations {
	const common = getCommonTranslations(locale);
	return { ...common, ...appTranslations } as T & CommonTranslations;
}
