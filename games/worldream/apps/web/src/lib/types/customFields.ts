// Custom Fields System Types

export type FieldType =
	| 'text' // Simple text input
	| 'number' // Numeric input
	| 'range' // Slider between min/max
	| 'select' // Single selection dropdown
	| 'multiselect' // Multiple selection
	| 'boolean' // Yes/No checkbox
	| 'date' // Date picker
	| 'formula' // Calculated field
	| 'reference' // Reference to another node
	| 'list' // Array of values
	| 'json'; // Structured JSON data

export interface FieldConfig {
	// For number/range types
	min?: number;
	max?: number;
	step?: number;
	default?: number;
	unit?: string;

	// For select/multiselect
	choices?: Array<{
		value: string;
		label: string;
		color?: string;
	}>;

	// For text
	multiline?: boolean;
	maxLength?: number;
	pattern?: string; // regex pattern
	placeholder?: string;

	// For formula
	formula?: string;
	dependencies?: string[]; // field keys this formula depends on

	// For reference
	reference_type?: 'character' | 'object' | 'place' | 'story' | 'world';
	multiple?: boolean;

	// For list
	item_type?: FieldType;
	max_items?: number;
	min_items?: number;
}

export interface DisplayConfig {
	width?: 'full' | 'half' | 'third' | 'quarter';
	hidden?: boolean;
	readonly?: boolean;
	help_text?: string;
	prefix?: string;
	suffix?: string;
	icon?: string;
	color?: string;
}

export interface ValidationRule {
	type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
	value?: any;
	message?: string;
	condition?: string; // condition when this rule applies
}

export interface FieldPermissions {
	view?: 'owner' | 'collaborator' | 'public';
	edit?: 'owner' | 'collaborator';
}

export interface CustomFieldDefinition {
	id: string;
	key: string; // Unique key for the field (e.g., "strength")
	label: string; // Display name (e.g., "Stärke")
	type: FieldType;
	category?: string; // For grouping fields
	description?: string;
	required?: boolean;
	config: FieldConfig;
	display?: DisplayConfig;
	validation?: ValidationRule[];
	permissions?: FieldPermissions;
	order?: number; // Display order
}

export interface FieldCategory {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	color?: string;
	collapsed?: boolean; // Default collapsed state
	order?: number;
}

export interface CustomFieldSchema {
	version: number;
	fields: CustomFieldDefinition[];
	categories?: FieldCategory[];
	validation_rules?: ValidationRule[];
	template_id?: string; // If created from a template
	template_version?: string;
}

export interface CustomFieldTemplate {
	id: string;
	slug: string;
	name: string;
	description?: string;
	category: 'official' | 'community' | 'personal';
	tags: string[];
	applicable_to: Array<'character' | 'object' | 'place' | 'story' | 'world'>;
	fields: CustomFieldDefinition[];
	example_data?: Record<string, any>;
	author_id?: string;
	world_slug?: string;
	version: string;
	dependencies?: string[]; // Other template slugs
	usage_count: number;
	is_public: boolean;
	created_at: string;
	updated_at: string;
}

// Custom field data is a simple key-value object
export type CustomFieldData = Record<string, any>;

// Validation result
export interface ValidationResult {
	valid: boolean;
	errors: Array<{
		field: string;
		message: string;
		rule?: string;
	}>;
	warnings?: Array<{
		field: string;
		message: string;
	}>;
}

// Formula evaluation context
export interface FormulaContext {
	fields: CustomFieldData;
	node?: any; // Current node data
	world?: any; // World context
	references?: Record<string, any>; // Referenced nodes
}

// Field change event
export interface FieldChangeEvent {
	field: string;
	oldValue: any;
	newValue: any;
	timestamp: string;
	triggeredBy?: string; // Which field triggered this change (for formulas)
}

// Helper type for field values
export type FieldValue<T extends FieldType> = T extends 'text'
	? string
	: T extends 'number'
		? number
		: T extends 'range'
			? number
			: T extends 'select'
				? string
				: T extends 'multiselect'
					? string[]
					: T extends 'boolean'
						? boolean
						: T extends 'date'
							? string
							: T extends 'formula'
								? any
								: T extends 'reference'
									? string | string[]
									: T extends 'list'
										? any[]
										: T extends 'json'
											? any
											: any;

// Schema builder helper types
export interface SchemaBuilder {
	addField(field: Omit<CustomFieldDefinition, 'id'>): SchemaBuilder;
	addCategory(category: FieldCategory): SchemaBuilder;
	removeField(key: string): SchemaBuilder;
	updateField(key: string, updates: Partial<CustomFieldDefinition>): SchemaBuilder;
	reorderFields(order: string[]): SchemaBuilder;
	build(): CustomFieldSchema;
}

// Template filters for browsing
export interface TemplateFilter {
	category?: 'official' | 'community' | 'personal';
	tags?: string[];
	applicable_to?: Array<'character' | 'object' | 'place' | 'story' | 'world'>;
	author_id?: string;
	world_slug?: string;
	search?: string;
	is_public?: boolean;
	sort_by?: 'usage_count' | 'created_at' | 'updated_at' | 'name';
	sort_order?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

// Export utility functions
export function createEmptySchema(): CustomFieldSchema {
	return {
		version: 1,
		fields: [],
		categories: [],
		validation_rules: [],
	};
}

export function createFieldDefinition(
	key: string,
	label: string,
	type: FieldType,
	config?: Partial<FieldConfig>
): CustomFieldDefinition {
	return {
		id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
		key,
		label,
		type,
		config: config || {},
		required: false,
	};
}

export function validateFieldKey(key: string): boolean {
	// Must be lowercase, alphanumeric with underscores, no spaces
	return /^[a-z][a-z0-9_]*$/.test(key);
}

export function getDefaultValueForType(type: FieldType, config?: FieldConfig): any {
	switch (type) {
		case 'text':
			return '';
		case 'number':
		case 'range':
			return config?.default ?? config?.min ?? 0;
		case 'select':
			return config?.choices?.[0]?.value ?? '';
		case 'multiselect':
			return [];
		case 'boolean':
			return false;
		case 'date':
			return new Date().toISOString().split('T')[0];
		case 'list':
			return [];
		case 'json':
			return {};
		case 'reference':
			return config?.multiple ? [] : null;
		case 'formula':
			return null;
		default:
			return null;
	}
}
