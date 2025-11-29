// ============================================
// SIMPLIFIED CARD SYSTEM V2 - Using Discriminated Unions
// ============================================

// Base Types
export type RenderMode = 'beginner' | 'advanced' | 'expert';

// Card Metadata
export interface CardMetadata {
	name?: string;
	description?: string;
	author?: string;
	version?: string;
	created?: string;
	updated?: string;
	tags?: string[];
	isActive?: boolean;
	isPublic?: boolean;
}

// Card Constraints
export interface CardConstraints {
	aspectRatio?: string;
	maxWidth?: string;
	minHeight?: string;
	maxHeight?: string;
	maxModules?: number;
	maxHTMLSize?: number;
	maxCSSSize?: number;
	preventScripts?: boolean;
}

// Theme Configuration
export interface Theme {
	id?: string;
	name?: string;
	colors?: Record<string, string>;
	typography?: {
		fontFamily?: string;
		fontSize?: Record<string, string>;
		fontWeight?: Record<string, number>;
		lineHeight?: Record<string, string>;
	};
	spacing?: Record<string, string>;
	borderRadius?: Record<string, string>;
	shadows?: Record<string, string>;
}

// Module Definition
export interface Module {
	id: string;
	type: 'header' | 'content' | 'footer' | 'media' | 'stats' | 'actions' | 'links' | 'custom';
	props: Record<string, any>;
	order: number;
	visibility?: 'always' | 'desktop' | 'mobile';
	grid?: {
		col?: number;
		row?: number;
		colSpan?: number;
		rowSpan?: number;
	};
	className?: string;
}

// Template Variable
export interface TemplateVariable {
	name: string;
	type: 'text' | 'number' | 'image' | 'link' | 'list' | 'boolean' | 'color';
	label: string;
	default?: any;
	required?: boolean;
	placeholder?: string;
	options?: Array<{ label: string; value: any }>;
}

// ============================================
// DISCRIMINATED UNION FOR CARD CONFIGURATIONS
// ============================================

export type CardConfig =
	| {
			mode: 'beginner';
			modules: Module[];
			theme?: Theme;
			layout?: {
				columns?: number;
				gap?: string;
				padding?: string;
			};
			animations?: {
				hover?: boolean;
				entrance?: 'fade' | 'slide' | 'scale' | 'none';
			};
	  }
	| {
			mode: 'advanced';
			template: string;
			css?: string;
			variables: TemplateVariable[];
			values: Record<string, any>;
	  }
	| {
			mode: 'expert';
			html: string;
			css: string;
			javascript?: string;
	  };

// Main Card Interface (Consolidated from UnifiedCard)
export interface Card {
	id?: string;
	user_id?: string;
	type?: 'user' | 'template' | 'system';
	template_id?: string;
	source?: 'created' | 'duplicated' | 'imported' | 'migrated';
	config: CardConfig;
	metadata?: CardMetadata;
	constraints?: CardConstraints;
	page?: string;
	position?: number;
	visibility?: 'private' | 'public' | 'unlisted';
	variant?: 'default' | 'compact' | 'hero' | 'minimal' | 'glass' | 'gradient' | string;
	tags?: string[];
	category?: string;
	usage_count?: number;
	likes_count?: number;
	is_featured?: boolean;
	allow_duplication?: boolean;
	created?: string;
	updated?: string;
}

// Database Card Interface
export interface DBCard {
	id: string;
	user_id: string;
	config: string; // JSON stringified CardConfig
	metadata: string; // JSON stringified CardMetadata
	constraints: string; // JSON stringified CardConstraints
	variant?: string;
	created: string;
	updated: string;
}

// ============================================
// MODULE PROP TYPES (Simplified)
// ============================================

export interface ModuleProps {
	header: {
		title?: string;
		subtitle?: string;
		avatar?: string;
		badge?: string;
		icon?: string;
	};
	content: {
		text?: string;
		html?: string;
		truncate?: boolean;
		maxLines?: number;
	};
	links: {
		links: Array<{
			label: string;
			href: string;
			icon?: string;
			description?: string;
		}>;
		style?: 'button' | 'list' | 'card';
		columns?: 1 | 2;
		target?: '_blank' | '_self';
	};
	media: {
		type: 'image' | 'video' | 'qr';
		src?: string;
		alt?: string;
		aspectRatio?: string;
		qrData?: string;
	};
	stats: {
		stats: Array<{
			label: string;
			value: string | number;
			change?: number;
			icon?: string;
		}>;
		layout?: 'grid' | 'list';
	};
	actions: {
		actions: Array<{
			label: string;
			href?: string;
			onClick?: () => void;
			variant?: 'primary' | 'secondary' | 'ghost';
			icon?: string;
		}>;
		layout?: 'horizontal' | 'vertical';
	};
	footer: {
		text?: string;
		links?: Array<{
			label: string;
			href: string;
		}>;
		copyright?: string;
	};
	custom: {
		html: string;
		css?: string;
	};
}

// Type Guards
export function isBeginnerCard(
	config: CardConfig
): config is Extract<CardConfig, { mode: 'beginner' }> {
	return config.mode === 'beginner';
}

export function isAdvancedCard(
	config: CardConfig
): config is Extract<CardConfig, { mode: 'advanced' }> {
	return config.mode === 'advanced';
}

export function isExpertCard(
	config: CardConfig
): config is Extract<CardConfig, { mode: 'expert' }> {
	return config.mode === 'expert';
}

// Conversion Types
export interface CardConverter {
	toModular(config: CardConfig): Promise<Extract<CardConfig, { mode: 'beginner' }>>;
	toTemplate(config: CardConfig): Promise<Extract<CardConfig, { mode: 'advanced' }>>;
	toCustom(config: CardConfig): Promise<Extract<CardConfig, { mode: 'expert' }>>;
}

// Validation Result
export interface ValidationResult {
	valid: boolean;
	errors?: Array<{
		field: string;
		message: string;
	}>;
}

// Card Events
export interface CardEvent {
	type: 'created' | 'updated' | 'deleted' | 'converted';
	cardId: string;
	timestamp: number;
	data?: any;
}

// Card Store Actions
export interface CardActions {
	create(config: CardConfig, metadata?: CardMetadata): Promise<Card>;
	update(id: string, updates: Partial<Card>): Promise<Card>;
	delete(id: string): Promise<boolean>;
	convert(id: string, targetMode: RenderMode): Promise<Card>;
	duplicate(id: string): Promise<Card>;
	validate(card: Card): ValidationResult;
}

// Export all types
export type { Theme as ThemeConfig }; // Alias for backward compatibility

// Legacy aliases for backward compatibility
export type UnifiedCard = Card;
export type ModularConfig = Extract<CardConfig, { mode: 'beginner' }>;
export type TemplateConfig = Extract<CardConfig, { mode: 'advanced' }>;
export type CustomHTMLConfig = Extract<CardConfig, { mode: 'expert' }>;
export type { Module as ModuleConfig };
