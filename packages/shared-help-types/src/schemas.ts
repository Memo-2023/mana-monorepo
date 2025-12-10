/**
 * Zod Schemas for Help Content Validation
 * Used to validate Markdown frontmatter
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

export const supportedLanguageSchema = z.enum(['en', 'de', 'fr', 'it', 'es']);

export const faqCategorySchema = z.enum([
	'general',
	'account',
	'billing',
	'features',
	'technical',
	'privacy',
]);

export const featureCategorySchema = z.enum(['getting-started', 'core', 'advanced', 'integration']);

export const guideDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const changelogTypeSchema = z.enum(['major', 'minor', 'patch', 'beta']);

export const shortcutCategorySchema = z.enum(['navigation', 'editing', 'general', 'app-specific']);

// ============================================================================
// Content Item Schemas (for Frontmatter)
// ============================================================================

const baseContentSchema = z.object({
	id: z.string().min(1),
	language: supportedLanguageSchema,
	order: z.number().optional().default(0),
	appSpecific: z.boolean().optional().default(false),
	apps: z.array(z.string()).optional().default([]),
	lastUpdated: z.coerce.date().optional(),
});

export const faqFrontmatterSchema = baseContentSchema.extend({
	question: z.string().min(1),
	category: faqCategorySchema,
	featured: z.boolean().optional().default(false),
	tags: z.array(z.string()).optional().default([]),
	relatedFaqs: z.array(z.string()).optional().default([]),
});

export const featureFrontmatterSchema = baseContentSchema.extend({
	title: z.string().min(1),
	description: z.string().min(1),
	icon: z.string().optional(),
	category: featureCategorySchema,
	available: z.boolean().optional().default(true),
	comingSoon: z.boolean().optional().default(false),
	highlights: z.array(z.string()).optional().default([]),
	learnMoreUrl: z.string().url().optional(),
});

export const shortcutSchema = z.object({
	shortcut: z.string().min(1),
	action: z.string().min(1),
	description: z.string().optional(),
});

export const shortcutsFrontmatterSchema = baseContentSchema.extend({
	category: shortcutCategorySchema,
	title: z.string().optional(),
});

export const guideStepSchema = z.object({
	title: z.string().min(1),
	content: z.string().min(1),
	duration: z.string().optional(),
});

export const gettingStartedFrontmatterSchema = baseContentSchema.extend({
	title: z.string().min(1),
	description: z.string().min(1),
	difficulty: guideDifficultySchema,
	estimatedTime: z.string().optional(),
	prerequisites: z.array(z.string()).optional().default([]),
});

export const changelogChangeSchema = z.object({
	title: z.string().min(1),
	description: z.string().optional(),
	category: z.string().optional(),
});

export const changelogFrontmatterSchema = baseContentSchema.extend({
	version: z.string().min(1),
	title: z.string().min(1),
	releaseDate: z.coerce.date(),
	type: changelogTypeSchema,
	summary: z.string().optional(),
	highlighted: z.boolean().optional().default(false),
	changes: z
		.object({
			features: z.array(changelogChangeSchema).optional(),
			improvements: z.array(changelogChangeSchema).optional(),
			bugfixes: z.array(changelogChangeSchema).optional(),
		})
		.optional(),
	platforms: z.array(z.string()).optional().default(['all']),
});

export const contactFrontmatterSchema = baseContentSchema.extend({
	title: z.string().min(1),
	supportEmail: z.string().email().optional(),
	supportUrl: z.string().url().optional(),
	discordUrl: z.string().url().optional(),
	twitterUrl: z.string().url().optional(),
	documentationUrl: z.string().url().optional(),
	responseTime: z.string().optional(),
});

// ============================================================================
// Type Exports from Schemas
// ============================================================================

export type FAQFrontmatter = z.infer<typeof faqFrontmatterSchema>;
export type FeatureFrontmatter = z.infer<typeof featureFrontmatterSchema>;
export type ShortcutsFrontmatter = z.infer<typeof shortcutsFrontmatterSchema>;
export type GettingStartedFrontmatter = z.infer<typeof gettingStartedFrontmatterSchema>;
export type ChangelogFrontmatter = z.infer<typeof changelogFrontmatterSchema>;
export type ContactFrontmatter = z.infer<typeof contactFrontmatterSchema>;
