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
	type FAQFrontmatter,
	type FeatureFrontmatter,
	type ShortcutsFrontmatter,
	type GettingStartedFrontmatter,
	type ChangelogFrontmatter,
	type ContactFrontmatter,
} from '@manacore/shared-help-types';
import { parseMarkdown } from './parser.js';
import { createEmptyContent } from './merger.js';

export interface LoaderOptions {
	/** Locale to load */
	locale: SupportedLanguage;
	/** Fallback locale if content not found */
	fallbackLocale?: SupportedLanguage;
	/** Optional error callback */
	onError?: (path: string, error: unknown) => void;
}

/**
 * Parse FAQ content from raw Markdown
 */
export function parseFAQContent(rawContent: string): FAQItem {
	const parsed = parseMarkdown<FAQFrontmatter>(rawContent, faqFrontmatterSchema);
	const fm = parsed.frontmatter;
	return {
		id: fm.id,
		language: fm.language,
		order: fm.order,
		appSpecific: fm.appSpecific,
		apps: fm.apps,
		lastUpdated: fm.lastUpdated,
		question: fm.question,
		category: fm.category,
		featured: fm.featured,
		tags: fm.tags,
		relatedFaqs: fm.relatedFaqs,
		answer: parsed.html,
	};
}

/**
 * Parse Feature content from raw Markdown
 */
export function parseFeatureContent(rawContent: string): FeatureItem {
	const parsed = parseMarkdown<FeatureFrontmatter>(rawContent, featureFrontmatterSchema);
	const fm = parsed.frontmatter;
	return {
		id: fm.id,
		language: fm.language,
		order: fm.order,
		appSpecific: fm.appSpecific,
		apps: fm.apps,
		lastUpdated: fm.lastUpdated,
		title: fm.title,
		description: fm.description,
		icon: fm.icon,
		category: fm.category,
		available: fm.available,
		comingSoon: fm.comingSoon,
		highlights: fm.highlights,
		learnMoreUrl: fm.learnMoreUrl,
		content: parsed.html,
	};
}

/**
 * Parse Shortcuts content from raw Markdown
 */
export function parseShortcutsContent(rawContent: string): ShortcutsItem {
	const parsed = parseMarkdown<ShortcutsFrontmatter>(rawContent, shortcutsFrontmatterSchema);
	const fm = parsed.frontmatter;

	// Parse markdown table to extract shortcuts
	const shortcuts = parseShortcutsTable(parsed.content);

	return {
		id: fm.id,
		language: fm.language,
		order: fm.order,
		appSpecific: fm.appSpecific,
		apps: fm.apps,
		lastUpdated: fm.lastUpdated,
		category: fm.category,
		title: fm.title,
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

		// Skip header separator (flexible: allows spaces around dashes)
		if (trimmed.match(/^\|[\s\-:|]+\|$/)) {
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
	const parsed = parseMarkdown<GettingStartedFrontmatter>(
		rawContent,
		gettingStartedFrontmatterSchema
	);
	const fm = parsed.frontmatter;

	// Extract steps from content (h2 headers)
	const steps = parseGuideSteps(parsed.content);

	return {
		id: fm.id,
		language: fm.language,
		order: fm.order,
		appSpecific: fm.appSpecific,
		apps: fm.apps,
		lastUpdated: fm.lastUpdated,
		title: fm.title,
		description: fm.description,
		difficulty: fm.difficulty,
		estimatedTime: fm.estimatedTime,
		prerequisites: fm.prerequisites,
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
		if (newlineIndex === -1) {
			steps.push({ title: section.trim(), content: '' });
			continue;
		}
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
	const parsed = parseMarkdown<ChangelogFrontmatter>(rawContent, changelogFrontmatterSchema);
	const fm = parsed.frontmatter;
	return {
		id: fm.id,
		language: fm.language,
		order: fm.order,
		appSpecific: fm.appSpecific,
		apps: fm.apps,
		lastUpdated: fm.lastUpdated,
		version: fm.version,
		title: fm.title,
		releaseDate: fm.releaseDate,
		type: fm.type,
		summary: fm.summary,
		highlighted: fm.highlighted,
		changes: fm.changes,
		platforms: fm.platforms,
		content: parsed.html,
	};
}

/**
 * Parse Contact content from raw Markdown
 */
export function parseContactContent(rawContent: string): ContactInfo {
	const parsed = parseMarkdown<ContactFrontmatter>(rawContent, contactFrontmatterSchema);
	const fm = parsed.frontmatter;
	return {
		id: fm.id,
		language: fm.language,
		order: fm.order,
		appSpecific: fm.appSpecific,
		apps: fm.apps,
		lastUpdated: fm.lastUpdated,
		title: fm.title,
		supportEmail: fm.supportEmail,
		supportUrl: fm.supportUrl,
		discordUrl: fm.discordUrl,
		twitterUrl: fm.twitterUrl,
		documentationUrl: fm.documentationUrl,
		responseTime: fm.responseTime,
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
	const { locale, fallbackLocale = 'en', onError } = options;

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
		} catch (error) {
			if (onError) {
				onError(path, error);
			} else {
				console.warn('[shared-help] Failed to parse:', path, error);
			}
		}
	}

	return content;
}
