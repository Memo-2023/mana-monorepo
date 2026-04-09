/**
 * Default translations for the HelpPage component.
 * Apps can use these directly or override individual fields.
 */

import type { HelpPageTranslations } from './ui-types';

export const defaultTranslationsDE: HelpPageTranslations = {
	title: 'Hilfe & Support',
	subtitle: 'Finde Antworten und lerne die App kennen',
	searchPlaceholder: 'Hilfe durchsuchen...',
	sections: {
		faq: 'FAQ',
		features: 'Features',
		shortcuts: 'Tastenkürzel',
		gettingStarted: 'Erste Schritte',
		changelog: 'Änderungen',
		contact: 'Kontakt',
	},
	search: {
		noResults: 'Keine Ergebnisse für "{query}"',
		resultsCount: '{count} Ergebnisse',
		searching: 'Suche...',
	},
	faq: {
		noItems: 'Keine häufigen Fragen verfügbar.',
		allCategories: 'Alle',
		categories: {
			general: 'Allgemein',
			account: 'Konto',
			billing: 'Abrechnung',
			features: 'Funktionen',
			technical: 'Technisch',
			privacy: 'Datenschutz',
		},
	},
	features: {
		noItems: 'Keine Features verfügbar.',
		comingSoon: 'Demnächst',
		learnMore: 'Mehr erfahren',
	},
	shortcuts: {
		noItems: 'Keine Tastenkürzel verfügbar.',
		columns: {
			shortcut: 'Kürzel',
			action: 'Aktion',
			description: 'Beschreibung',
		},
	},
	gettingStarted: {
		noItems: 'Keine Anleitungen verfügbar.',
		estimatedTime: 'Geschätzte Zeit',
		difficulty: {
			beginner: 'Einsteiger',
			intermediate: 'Fortgeschritten',
			advanced: 'Experte',
		},
	},
	changelog: {
		noItems: 'Keine Änderungen verfügbar.',
		showAll: 'Alle Versionen anzeigen',
		types: {
			major: 'Hauptversion',
			minor: 'Nebenversion',
			patch: 'Patch',
			beta: 'Beta',
		},
		labels: {
			features: 'Neue Funktionen',
			improvements: 'Verbesserungen',
			bugFixes: 'Fehlerbehebungen',
		},
	},
	contact: {
		noInfo: 'Keine Kontaktinformationen verfügbar.',
		email: 'E-Mail senden',
		responseTime: 'Antwortzeit',
	},
	common: {
		back: 'Zurück',
		showMore: 'Mehr anzeigen',
		showLess: 'Weniger anzeigen',
	},
};

export const defaultTranslationsEN: HelpPageTranslations = {
	title: 'Help & Support',
	subtitle: 'Find answers and learn how to use the app',
	searchPlaceholder: 'Search help...',
	sections: {
		faq: 'FAQ',
		features: 'Features',
		shortcuts: 'Shortcuts',
		gettingStarted: 'Getting Started',
		changelog: 'Changelog',
		contact: 'Contact',
	},
	search: {
		noResults: 'No results for "{query}"',
		resultsCount: '{count} results',
		searching: 'Searching...',
	},
	faq: {
		noItems: 'No frequently asked questions available.',
		allCategories: 'All',
		categories: {
			general: 'General',
			account: 'Account',
			billing: 'Billing',
			features: 'Features',
			technical: 'Technical',
			privacy: 'Privacy',
		},
	},
	features: {
		noItems: 'No features available.',
		comingSoon: 'Coming Soon',
		learnMore: 'Learn More',
	},
	shortcuts: {
		noItems: 'No keyboard shortcuts available.',
		columns: {
			shortcut: 'Shortcut',
			action: 'Action',
			description: 'Description',
		},
	},
	gettingStarted: {
		noItems: 'No guides available.',
		estimatedTime: 'Estimated time',
		difficulty: {
			beginner: 'Beginner',
			intermediate: 'Intermediate',
			advanced: 'Advanced',
		},
	},
	changelog: {
		noItems: 'No changelog available.',
		showAll: 'Show all releases',
		types: {
			major: 'Major',
			minor: 'Minor',
			patch: 'Patch',
			beta: 'Beta',
		},
		labels: {
			features: 'New Features',
			improvements: 'Improvements',
			bugFixes: 'Bug Fixes',
		},
	},
	contact: {
		noInfo: 'No contact information available.',
		email: 'Send email',
		responseTime: 'Response time',
	},
	common: {
		back: 'Back',
		showMore: 'Show more',
		showLess: 'Show less',
	},
};

/**
 * Get default translations for a locale, with optional overrides.
 * Use this to customize only the fields that differ per app (e.g. subtitle).
 */
export function getHelpTranslations(
	locale: string,
	overrides?: Partial<HelpPageTranslations>
): HelpPageTranslations {
	const base = locale === 'de' ? defaultTranslationsDE : defaultTranslationsEN;
	if (!overrides) return base;
	return { ...base, ...overrides };
}
