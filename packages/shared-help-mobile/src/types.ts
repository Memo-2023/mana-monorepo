/**
 * Mobile-specific types for Help components
 */

import type { HelpContent, SearchResult, SupportedLanguage } from '@manacore/shared-help-types';

export type HelpSection =
	| 'faq'
	| 'features'
	| 'shortcuts'
	| 'getting-started'
	| 'changelog'
	| 'contact';

export interface HelpScreenProps {
	content: HelpContent;
	appName: string;
	appId: string;
	translations: HelpTranslations;
	onBack?: () => void;
	defaultSection?: HelpSection;
}

export interface HelpTranslations {
	title: string;
	subtitle?: string;
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
	};
	faq: {
		noItems: string;
	};
	features: {
		noItems: string;
		comingSoon: string;
	};
	shortcuts: {
		noItems: string;
	};
	gettingStarted: {
		noItems: string;
	};
	changelog: {
		noItems: string;
	};
	contact: {
		noInfo: string;
		email: string;
	};
}

export interface UseHelpContentOptions {
	appId: string;
	locale: SupportedLanguage;
	centralContent?: HelpContent;
	appContent?: Partial<HelpContent>;
}

export interface UseHelpContentResult {
	content: HelpContent;
	loading: boolean;
	error: Error | null;
}

export interface FAQListProps {
	items: HelpContent['faq'];
	translations: Pick<HelpTranslations, 'faq'>;
}

export interface FeaturesListProps {
	items: HelpContent['features'];
	translations: Pick<HelpTranslations, 'features'>;
}

export interface HelpSearchBarProps {
	placeholder?: string;
	onSearch: (query: string) => void;
	onClear: () => void;
}

export interface HelpSearchResultsProps {
	results: SearchResult[];
	onResultPress: (result: SearchResult) => void;
	translations: Pick<HelpTranslations, 'search'>;
}
