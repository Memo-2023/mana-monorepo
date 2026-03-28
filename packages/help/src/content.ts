/**
 * Help Content Type Definitions
 * Defines the structure for all help content types
 */

// ============================================================================
// Base Types
// ============================================================================

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'it' | 'es';

export type FAQCategory = 'general' | 'account' | 'billing' | 'features' | 'technical' | 'privacy';

export type FeatureCategory = 'getting-started' | 'core' | 'advanced' | 'integration';

export type GuideDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ChangelogType = 'major' | 'minor' | 'patch' | 'beta';

export type ShortcutCategory = 'navigation' | 'editing' | 'general' | 'app-specific';

// ============================================================================
// Content Item Types
// ============================================================================

export interface BaseContentItem {
	id: string;
	language: SupportedLanguage;
	order?: number;
	appSpecific?: boolean;
	apps?: string[];
	lastUpdated?: Date;
}

export interface FAQItem extends BaseContentItem {
	question: string;
	answer: string;
	category: FAQCategory;
	featured?: boolean;
	tags?: string[];
	relatedFaqs?: string[];
}

export interface FeatureItem extends BaseContentItem {
	title: string;
	description: string;
	content: string;
	icon?: string;
	category: FeatureCategory;
	available?: boolean;
	comingSoon?: boolean;
	highlights?: string[];
	learnMoreUrl?: string;
}

export interface KeyboardShortcut {
	shortcut: string;
	action: string;
	description?: string;
}

export interface ShortcutsItem extends BaseContentItem {
	category: ShortcutCategory;
	title?: string;
	shortcuts: KeyboardShortcut[];
}

export interface GuideStep {
	title: string;
	content: string;
	duration?: string;
}

export interface GettingStartedItem extends BaseContentItem {
	title: string;
	description: string;
	content: string;
	difficulty: GuideDifficulty;
	estimatedTime?: string;
	prerequisites?: string[];
	steps?: GuideStep[];
}

export interface ChangelogChange {
	title: string;
	description?: string;
	category?: string;
}

export interface ChangelogItem extends BaseContentItem {
	version: string;
	title: string;
	releaseDate: Date;
	type: ChangelogType;
	summary?: string;
	content: string;
	highlighted?: boolean;
	changes?: {
		features?: ChangelogChange[];
		improvements?: ChangelogChange[];
		bugfixes?: ChangelogChange[];
	};
	platforms?: string[];
}

export interface ContactInfo extends BaseContentItem {
	title: string;
	content: string;
	supportEmail?: string;
	supportUrl?: string;
	discordUrl?: string;
	twitterUrl?: string;
	documentationUrl?: string;
	responseTime?: string;
}

// ============================================================================
// Aggregated Content Types
// ============================================================================

export interface HelpContent {
	faq: FAQItem[];
	features: FeatureItem[];
	shortcuts: ShortcutsItem[];
	gettingStarted: GettingStartedItem[];
	changelog: ChangelogItem[];
	contact: ContactInfo | null;
}

export interface AppHelpContent {
	appId: string;
	appName: string;
	content: HelpContent;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface HelpContentConfig {
	appId: string;
	locale: SupportedLanguage;
	fallbackLocale?: SupportedLanguage;
	includeAppSpecific?: boolean;
}

export interface MergeContentOptions {
	appId: string;
	locale: SupportedLanguage;
	/** If true, app-specific content replaces central content with same ID */
	overrideById?: boolean;
}

// Re-export schemas for backward compatibility
export {
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
} from './schemas';
