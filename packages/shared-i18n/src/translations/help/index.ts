/**
 * Help translations exports
 */

import en from './en.json';
import de from './de.json';
import it from './it.json';
import fr from './fr.json';
import es from './es.json';

export { en, de, it, fr, es };

/**
 * Help translations type structure
 */
export interface HelpTranslations {
	title: string;
	subtitle: string;
	searchPlaceholder: string;
	sections: {
		faq: string;
		features: string;
		shortcuts: string;
		gettingStarted: string;
		changelog: string;
		contact: string;
	};
	search: {
		noResults: string;
		resultsCount: string;
		searching: string;
	};
	faq: {
		noItems: string;
		categories: {
			general: string;
			account: string;
			billing: string;
			features: string;
			technical: string;
			privacy: string;
		};
	};
	features: {
		noItems: string;
		comingSoon: string;
		learnMore: string;
	};
	shortcuts: {
		noItems: string;
	};
	gettingStarted: {
		noItems: string;
		estimatedTime: string;
		difficulty: {
			beginner: string;
			intermediate: string;
			advanced: string;
		};
	};
	changelog: {
		noItems: string;
		types: {
			major: string;
			minor: string;
			patch: string;
			beta: string;
		};
	};
	contact: {
		noInfo: string;
		email: string;
		responseTime: string;
	};
	common: {
		back: string;
		showMore: string;
		showLess: string;
	};
}

/**
 * Supported help locales
 */
export type HelpLocale = 'en' | 'de' | 'it' | 'fr' | 'es';

/**
 * All help translations by locale
 */
export const helpTranslations: Record<HelpLocale, HelpTranslations> = {
	en,
	de,
	it,
	fr,
	es,
};

/**
 * Get help translations by locale
 */
export function getHelpTranslations(locale: string): HelpTranslations {
	const supportedLocale = locale as HelpLocale;
	if (supportedLocale in helpTranslations) {
		return helpTranslations[supportedLocale];
	}
	// Default to English
	return helpTranslations.en;
}
