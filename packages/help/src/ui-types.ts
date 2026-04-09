/**
 * Component Props and Translation Types
 */

import type { HelpContent } from './content';
import type { SearchResult } from './search-types';

// ============================================================================
// Translation Types
// ============================================================================

export interface HelpPageTranslations {
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
		searching: string;
	};
	faq: {
		noItems: string;
		allCategories: string;
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
		columns: {
			shortcut: string;
			action: string;
			description: string;
		};
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
		showAll: string;
		types: {
			major: string;
			minor: string;
			patch: string;
			beta: string;
		};
		labels: {
			features: string;
			improvements: string;
			bugFixes: string;
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

// ============================================================================
// Component Props
// ============================================================================

export type HelpSection =
	| 'faq'
	| 'features'
	| 'shortcuts'
	| 'getting-started'
	| 'changelog'
	| 'contact';

export interface HelpPageProps {
	content: HelpContent;
	appName: string;
	appId: string;
	translations: HelpPageTranslations;
	searchEnabled?: boolean;
	showFAQ?: boolean;
	showFeatures?: boolean;
	showShortcuts?: boolean;
	showGettingStarted?: boolean;
	showChangelog?: boolean;
	showContact?: boolean;
	defaultSection?: HelpSection;
	showBackButton?: boolean;
	onBack?: () => void;
	onSectionChange?: (section: HelpSection) => void;
	onSearch?: (query: string, results: SearchResult[]) => void;
}

export interface FAQSectionProps {
	items: HelpContent['faq'];
	translations: Pick<HelpPageTranslations, 'faq' | 'common'>;
	showCategories?: boolean;
	maxItems?: number;
	expandFirst?: boolean;
}

export interface ChangelogEntryProps {
	item: HelpContent['changelog'][number];
	translations: Pick<HelpPageTranslations, 'changelog'>;
}

export interface FeaturesOverviewProps {
	items: HelpContent['features'];
	translations: Pick<HelpPageTranslations, 'features'>;
}

export interface KeyboardShortcutsProps {
	items: HelpContent['shortcuts'];
	translations: Pick<HelpPageTranslations, 'shortcuts'>;
}

export interface GettingStartedGuideProps {
	items: HelpContent['gettingStarted'];
	translations: Pick<HelpPageTranslations, 'gettingStarted'>;
}

export interface ChangelogSectionProps {
	items: HelpContent['changelog'];
	translations: Pick<HelpPageTranslations, 'changelog'>;
	maxItems?: number;
}

export interface ContactSectionProps {
	contact: HelpContent['contact'];
	translations: Pick<HelpPageTranslations, 'contact'>;
}

export interface HelpSearchProps {
	content: HelpContent;
	translations: Pick<HelpPageTranslations, 'search'>;
	placeholder?: string;
	onResultSelect: (result: SearchResult) => void;
}
