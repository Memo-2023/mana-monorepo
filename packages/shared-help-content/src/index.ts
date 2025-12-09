/**
 * @manacore/shared-help-content
 * Central help content and utilities for loading, parsing, and searching
 */

// Parser utilities
export {
	parseMarkdown,
	parseMarkdownFiles,
	stripHtml,
	generateExcerpt,
	type ParsedContent,
	type ParseOptions,
} from './parser.js';

// Content loader
export {
	parseFAQContent,
	parseFeatureContent,
	parseShortcutsContent,
	parseGettingStartedContent,
	parseChangelogContent,
	parseContactContent,
	loadHelpContentFromFiles,
	type LoaderOptions,
} from './loader.js';

// Content merger
export { mergeContent, createEmptyContent } from './merger.js';

// Search functionality
export { buildSearchIndex, search, createSearcher, flattenContentForSearch } from './search.js';

// Re-export types for convenience
export type {
	HelpContent,
	FAQItem,
	FeatureItem,
	ShortcutsItem,
	GettingStartedItem,
	ChangelogItem,
	ContactInfo,
	SupportedLanguage,
	MergeContentOptions,
} from '@manacore/shared-help-types';

export type {
	SearchResult,
	SearchOptions,
	SearchIndexConfig,
	SearchableItem,
} from '@manacore/shared-help-types';
