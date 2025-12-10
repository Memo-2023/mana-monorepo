/**
 * Content Loader
 * Utilities for loading help content from various sources
 */

import type {
	HelpContent,
	FAQItem,
	FeatureItem,
	ShortcutsItem,
	GettingStartedItem,
	ChangelogItem,
	ContactInfo,
	SupportedLanguage,
} from '@manacore/shared-help-types';
import {
	faqFrontmatterSchema,
	featureFrontmatterSchema,
	shortcutsFrontmatterSchema,
	gettingStartedFrontmatterSchema,
	changelogFrontmatterSchema,
	contactFrontmatterSchema,
} from '@manacore/shared-help-types';
import { parseMarkdown } from './parser.js';
import { createEmptyContent } from './merger.js';

export interface LoaderOptions {
	/** Locale to load */
	locale: SupportedLanguage;
	/** Fallback locale if content not found */
	fallbackLocale?: SupportedLanguage;
}

/**
 * Parse FAQ content from raw Markdown
 */
export function parseFAQContent(rawContent: string): FAQItem {
	const parsed = parseMarkdown(rawContent, faqFrontmatterSchema);
	const fm = parsed.frontmatter as Record<string, unknown>;
	return {
		id: fm.id as string,
		language: fm.language as SupportedLanguage,
		order: fm.order as number | undefined,
		appSpecific: fm.appSpecific as boolean | undefined,
		apps: fm.apps as string[] | undefined,
		lastUpdated: fm.lastUpdated as Date | undefined,
		question: fm.question as string,
		category: fm.category as FAQItem['category'],
		featured: fm.featured as boolean | undefined,
		tags: fm.tags as string[] | undefined,
		relatedFaqs: fm.relatedFaqs as string[] | undefined,
		answer: parsed.html,
	};
}

/**
 * Parse Feature content from raw Markdown
 */
export function parseFeatureContent(rawContent: string): FeatureItem {
	const parsed = parseMarkdown(rawContent, featureFrontmatterSchema);
	const fm = parsed.frontmatter as Record<string, unknown>;
	return {
		id: fm.id as string,
		language: fm.language as SupportedLanguage,
		order: fm.order as number | undefined,
		appSpecific: fm.appSpecific as boolean | undefined,
		apps: fm.apps as string[] | undefined,
		lastUpdated: fm.lastUpdated as Date | undefined,
		title: fm.title as string,
		description: fm.description as string,
		icon: fm.icon as string | undefined,
		category: fm.category as FeatureItem['category'],
		available: fm.available as boolean | undefined,
		comingSoon: fm.comingSoon as boolean | undefined,
		highlights: fm.highlights as string[] | undefined,
		learnMoreUrl: fm.learnMoreUrl as string | undefined,
		content: parsed.html,
	};
}

/**
 * Parse Shortcuts content from raw Markdown
 */
export function parseShortcutsContent(rawContent: string): ShortcutsItem {
	const parsed = parseMarkdown(rawContent, shortcutsFrontmatterSchema);
	const fm = parsed.frontmatter as Record<string, unknown>;

	// Parse markdown table to extract shortcuts
	const shortcuts = parseShortcutsTable(parsed.content);

	return {
		id: fm.id as string,
		language: fm.language as SupportedLanguage,
		order: fm.order as number | undefined,
		appSpecific: fm.appSpecific as boolean | undefined,
		apps: fm.apps as string[] | undefined,
		lastUpdated: fm.lastUpdated as Date | undefined,
		category: fm.category as ShortcutsItem['category'],
		title: fm.title as string | undefined,
		shortcuts,
	};
}

/**
 * Parse a markdown table into keyboard shortcuts
 */
function parseShortcutsTable(
	content: string
): Array<{ shortcut: string; action: string; description?: string }> {
	const shortcuts: Array<{ shortcut: string; action: string; description?: string }> = [];
	const lines = content.split('\n');

	let inTable = false;
	for (const line of lines) {
		const trimmed = line.trim();

		// Skip header separator
		if (trimmed.match(/^\|[-:\s|]+\|$/)) {
			inTable = true;
			continue;
		}

		// Parse table row
		if (inTable && trimmed.startsWith('|') && trimmed.endsWith('|')) {
			const cells = trimmed
				.slice(1, -1)
				.split('|')
				.map((cell) => cell.trim());

			if (cells.length >= 2) {
				shortcuts.push({
					shortcut: cells[0],
					action: cells[1],
					description: cells[2] || undefined,
				});
			}
		} else if (inTable && !trimmed.startsWith('|')) {
			// End of table
			break;
		}
	}

	return shortcuts;
}

/**
 * Parse Getting Started guide content from raw Markdown
 */
export function parseGettingStartedContent(rawContent: string): GettingStartedItem {
	const parsed = parseMarkdown(rawContent, gettingStartedFrontmatterSchema);
	const fm = parsed.frontmatter as Record<string, unknown>;

	// Extract steps from content (h2 headers)
	const steps = parseGuideSteps(parsed.content);

	return {
		id: fm.id as string,
		language: fm.language as SupportedLanguage,
		order: fm.order as number | undefined,
		appSpecific: fm.appSpecific as boolean | undefined,
		apps: fm.apps as string[] | undefined,
		lastUpdated: fm.lastUpdated as Date | undefined,
		title: fm.title as string,
		description: fm.description as string,
		difficulty: fm.difficulty as GettingStartedItem['difficulty'],
		estimatedTime: fm.estimatedTime as string | undefined,
		prerequisites: fm.prerequisites as string[] | undefined,
		content: parsed.html,
		steps,
	};
}

/**
 * Parse guide steps from markdown content (h2 headers)
 */
function parseGuideSteps(content: string): Array<{ title: string; content: string }> {
	const steps: Array<{ title: string; content: string }> = [];
	const sections = content.split(/^## /m);

	for (let i = 1; i < sections.length; i++) {
		const section = sections[i];
		const newlineIndex = section.indexOf('\n');
		const title = section.substring(0, newlineIndex).trim();
		const stepContent = section.substring(newlineIndex + 1).trim();

		steps.push({ title, content: stepContent });
	}

	return steps;
}

/**
 * Parse Changelog content from raw Markdown
 */
export function parseChangelogContent(rawContent: string): ChangelogItem {
	const parsed = parseMarkdown(rawContent, changelogFrontmatterSchema);
	const fm = parsed.frontmatter as Record<string, unknown>;
	return {
		id: fm.id as string,
		language: fm.language as SupportedLanguage,
		order: fm.order as number | undefined,
		appSpecific: fm.appSpecific as boolean | undefined,
		apps: fm.apps as string[] | undefined,
		lastUpdated: fm.lastUpdated as Date | undefined,
		version: fm.version as string,
		title: fm.title as string,
		releaseDate: fm.releaseDate as Date,
		type: fm.type as ChangelogItem['type'],
		summary: fm.summary as string | undefined,
		highlighted: fm.highlighted as boolean | undefined,
		changes: fm.changes as ChangelogItem['changes'],
		platforms: fm.platforms as string[] | undefined,
		content: parsed.html,
	};
}

/**
 * Parse Contact content from raw Markdown
 */
export function parseContactContent(rawContent: string): ContactInfo {
	const parsed = parseMarkdown(rawContent, contactFrontmatterSchema);
	const fm = parsed.frontmatter as Record<string, unknown>;
	return {
		id: fm.id as string,
		language: fm.language as SupportedLanguage,
		order: fm.order as number | undefined,
		appSpecific: fm.appSpecific as boolean | undefined,
		apps: fm.apps as string[] | undefined,
		lastUpdated: fm.lastUpdated as Date | undefined,
		title: fm.title as string,
		supportEmail: fm.supportEmail as string | undefined,
		supportUrl: fm.supportUrl as string | undefined,
		discordUrl: fm.discordUrl as string | undefined,
		twitterUrl: fm.twitterUrl as string | undefined,
		documentationUrl: fm.documentationUrl as string | undefined,
		responseTime: fm.responseTime as string | undefined,
		content: parsed.html,
	};
}

/**
 * Load help content from a map of file paths to content
 * This is the main entry point for content loading
 */
export function loadHelpContentFromFiles(
	files: Record<string, string>,
	options: LoaderOptions
): HelpContent {
	const content = createEmptyContent();
	const { locale, fallbackLocale = 'en' } = options;

	for (const [path, rawContent] of Object.entries(files)) {
		try {
			// Determine content type from path
			if (path.includes('/faq/')) {
				const faq = parseFAQContent(rawContent);
				if (faq.language === locale || faq.language === fallbackLocale) {
					content.faq.push(faq);
				}
			} else if (path.includes('/features/')) {
				const feature = parseFeatureContent(rawContent);
				if (feature.language === locale || feature.language === fallbackLocale) {
					content.features.push(feature);
				}
			} else if (path.includes('/shortcuts/')) {
				const shortcuts = parseShortcutsContent(rawContent);
				if (shortcuts.language === locale || shortcuts.language === fallbackLocale) {
					content.shortcuts.push(shortcuts);
				}
			} else if (path.includes('/getting-started/')) {
				const guide = parseGettingStartedContent(rawContent);
				if (guide.language === locale || guide.language === fallbackLocale) {
					content.gettingStarted.push(guide);
				}
			} else if (path.includes('/changelog/')) {
				const changelog = parseChangelogContent(rawContent);
				if (changelog.language === locale || changelog.language === fallbackLocale) {
					content.changelog.push(changelog);
				}
			} else if (path.includes('/contact/')) {
				const contact = parseContactContent(rawContent);
				if (contact.language === locale || contact.language === fallbackLocale) {
					content.contact = contact;
				}
			}
		} catch {
			// Skip files that fail to parse
		}
	}

	return content;
}
