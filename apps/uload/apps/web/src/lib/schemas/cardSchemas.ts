import { z } from 'zod';

// Base schemas
export const RenderModeSchema = z.enum(['beginner', 'advanced', 'expert']);

export const CardVariantSchema = z.enum([
	'default',
	'compact',
	'hero',
	'minimal',
	'glass',
	'gradient',
]);

// Metadata schema
export const CardMetadataSchema = z.object({
	name: z.string().max(100).optional(),
	description: z.string().max(500).optional(),
	author: z.string().optional(),
	version: z.string().optional(),
	created: z.string().datetime().optional(),
	updated: z.string().datetime().optional(),
	tags: z.array(z.string()).max(10).optional(),
	page: z.string().optional(),
	position: z.number().nonnegative().optional(),
	isActive: z.boolean().optional(),
	isPublic: z.boolean().optional(),
});

// Constraints schema
export const CardConstraintsSchema = z.object({
	aspectRatio: z
		.string()
		.regex(/^(\d+\/\d+|auto)$/)
		.optional(),
	maxWidth: z.string().optional(),
	minHeight: z.string().optional(),
	maxHeight: z.string().optional(),
	maxModules: z.number().min(1).max(50).optional(),
	maxHTMLSize: z.number().min(1000).max(200000).optional(),
	maxCSSSize: z.number().min(1000).max(100000).optional(),
});

// Theme schema
export const ThemeSchema = z.object({
	id: z.string().optional(),
	name: z.string().optional(),
	colors: z.record(z.string(), z.string()).optional(),
	typography: z
		.object({
			fontFamily: z.string().optional(),
			fontSize: z.record(z.string(), z.string()).optional(),
			fontWeight: z.record(z.string(), z.number()).optional(),
			lineHeight: z.record(z.string(), z.string()).optional(),
		})
		.optional(),
	spacing: z.record(z.string(), z.string()).optional(),
	borderRadius: z.record(z.string(), z.string()).optional(),
	shadows: z.record(z.string(), z.string()).optional(),
});

// Module schema
export const ModuleSchema = z.object({
	id: z.string(),
	type: z.enum(['header', 'content', 'footer', 'media', 'stats', 'actions', 'links', 'custom']),
	props: z.record(z.string(), z.any()),
	order: z.number(),
	visibility: z.enum(['always', 'desktop', 'mobile']).optional(),
	grid: z
		.object({
			col: z.number().optional(),
			row: z.number().optional(),
			colSpan: z.number().optional(),
			rowSpan: z.number().optional(),
		})
		.optional(),
	className: z.string().optional(),
});

// Template variable schema
export const TemplateVariableSchema = z.object({
	name: z.string(),
	type: z.enum(['text', 'number', 'image', 'link', 'list', 'boolean', 'color']),
	label: z.string(),
	default: z.any().optional(),
	required: z.boolean().optional(),
	placeholder: z.string().optional(),
	options: z
		.array(
			z.object({
				label: z.string(),
				value: z.any(),
			})
		)
		.optional(),
});

// Card configuration schemas (discriminated union)
export const BeginnerConfigSchema = z.object({
	mode: z.literal('beginner'),
	modules: z.array(ModuleSchema).min(1).max(20),
	theme: ThemeSchema.optional(),
	layout: z
		.object({
			columns: z.number().min(1).max(4).optional(),
			gap: z.string().optional(),
			padding: z.string().optional(),
		})
		.optional(),
	animations: z
		.object({
			hover: z.boolean().optional(),
			entrance: z.enum(['fade', 'slide', 'scale', 'none']).optional(),
		})
		.optional(),
});

export const AdvancedConfigSchema = z.object({
	mode: z.literal('advanced'),
	template: z.string().min(1).max(100000),
	css: z.string().max(50000).optional(),
	variables: z.array(TemplateVariableSchema),
	values: z.record(z.string(), z.any()),
});

export const ExpertConfigSchema = z.object({
	mode: z.literal('expert'),
	html: z.string().min(1).max(100000),
	css: z.string().min(1).max(50000),
	javascript: z.string().optional(), // Note: Will be rejected in validation
});

export const CardConfigSchema = z.discriminatedUnion('mode', [
	BeginnerConfigSchema,
	AdvancedConfigSchema,
	ExpertConfigSchema,
]);

// Main Card schema
export const CardSchema = z.object({
	id: z.string(),
	config: CardConfigSchema,
	metadata: CardMetadataSchema,
	constraints: CardConstraintsSchema,
	variant: CardVariantSchema.optional(),
});

// Database Card schema
export const DBCardSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	config: z.string(), // JSON string
	metadata: z.string(), // JSON string
	constraints: z.string(), // JSON string
	variant: z.string().optional(),
	created: z.string().datetime(),
	updated: z.string().datetime(),
});

// Module Props schemas
export const HeaderModulePropsSchema = z.object({
	title: z.string().optional(),
	subtitle: z.string().optional(),
	avatar: z.string().url().optional(),
	badge: z.string().optional(),
	icon: z.string().optional(),
});

export const ContentModulePropsSchema = z.object({
	text: z.string().optional(),
	html: z.string().optional(),
	truncate: z.boolean().optional(),
	maxLines: z.number().optional(),
});

export const LinksModulePropsSchema = z.object({
	links: z.array(
		z.object({
			label: z.string(),
			href: z.string(),
			icon: z.string().optional(),
			description: z.string().optional(),
		})
	),
	style: z.enum(['button', 'list', 'card']).optional(),
	columns: z.literal(1).or(z.literal(2)).optional(),
	target: z.enum(['_blank', '_self']).optional(),
});

export const MediaModulePropsSchema = z.object({
	type: z.enum(['image', 'video', 'qr']),
	src: z.string().optional(),
	alt: z.string().optional(),
	aspectRatio: z.string().optional(),
	qrData: z.string().optional(),
});

export const StatsModulePropsSchema = z.object({
	stats: z.array(
		z.object({
			label: z.string(),
			value: z.union([z.string(), z.number()]),
			change: z.number().optional(),
			icon: z.string().optional(),
		})
	),
	layout: z.enum(['grid', 'list']).optional(),
});

export const ActionsModulePropsSchema = z.object({
	actions: z.array(
		z.object({
			label: z.string(),
			href: z.string().optional(),
			variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
			icon: z.string().optional(),
		})
	),
	layout: z.enum(['horizontal', 'vertical']).optional(),
});

export const FooterModulePropsSchema = z.object({
	text: z.string().optional(),
	links: z
		.array(
			z.object({
				label: z.string(),
				href: z.string(),
			})
		)
		.optional(),
	copyright: z.string().optional(),
});

// Validation helpers
export function validateCard(data: unknown) {
	return CardSchema.safeParse(data);
}

export function validateCardConfig(data: unknown) {
	return CardConfigSchema.safeParse(data);
}

export function validateModule(data: unknown) {
	return ModuleSchema.safeParse(data);
}

// Type exports
export type Card = z.infer<typeof CardSchema>;
export type CardConfig = z.infer<typeof CardConfigSchema>;
export type CardMetadata = z.infer<typeof CardMetadataSchema>;
export type CardConstraints = z.infer<typeof CardConstraintsSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type RenderMode = z.infer<typeof RenderModeSchema>;
export type CardVariant = z.infer<typeof CardVariantSchema>;
