/**
 * Common translations exports
 */

import en from './en.json';
import de from './de.json';
import es from './es.json';
import fr from './fr.json';
import it from './it.json';

export { en, de, es, fr, it };

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
		case 'es':
			return es;
		case 'fr':
			return fr;
		case 'it':
			return it;
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
