/**
 * Natural Language Parsers
 *
 * Base parser with common patterns, extended by app-specific parsers.
 * Supports locales: de, en, fr, es, it
 */

export {
	// Types
	type BaseParsedInput,
	type ExtractResult,
	type ParserLocale,
	type DateRange,
	type ExtractionStep,
	// Extraction functions
	extractDate,
	extractDateRange,
	extractTime,
	extractTimezone,
	extractTags,
	extractAtReference,
	extractAtReferences,
	extractRecurrence,
	extractRelativeTime,
	// Combination
	combineDateAndTime,
	// Preview formatting
	formatDatePreview,
	formatTimePreview,
	formatDateTimePreview,
	// Main parser
	parseBaseInput,
	// Compose helper
	createAppParser,
	// Utilities
	cleanTitle,
	fuzzyMatchDateKeyword,
} from './base-parser';
