// Field types for configurable schemas
export type FieldType =
	| 'text'
	| 'number'
	| 'date'
	| 'select'
	| 'tags'
	| 'checkbox'
	| 'url'
	| 'currency';

// Custom field definition (stored in collection schema)
export interface FieldDefinition {
	id: string;
	name: string;
	type: FieldType;
	required?: boolean;
	defaultValue?: unknown;
	options?: string[]; // for select fields
	currencyCode?: string; // for currency fields
	placeholder?: string;
	order: number;
}

// Collection schema
export interface CollectionSchema {
	fields: FieldDefinition[];
}

// Item status
export type ItemStatus = 'owned' | 'lent' | 'stored' | 'for_sale' | 'disposed';

// Purchase data
export interface PurchaseData {
	price?: number;
	currency?: string;
	date?: string;
	retailer?: string;
	warrantyExpiry?: string;
	receiptUrl?: string;
}

// Item note
export interface ItemNote {
	id: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

// Photo
export interface ItemPhoto {
	id: string;
	url: string;
	thumbnailUrl?: string;
	caption?: string;
	order: number;
}

// Document attachment
export interface ItemDocument {
	id: string;
	name: string;
	url: string;
	mimeType: string;
	size: number;
	uploadedAt: string;
}

// Collection
export interface Collection {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	color?: string;
	schema: CollectionSchema;
	templateId?: string;
	order: number;
	itemCount?: number;
	createdAt: string;
	updatedAt: string;
}

// Location (hierarchical)
export interface Location {
	id: string;
	parentId?: string;
	name: string;
	description?: string;
	icon?: string;
	path: string;
	depth: number;
	order: number;
	children?: Location[];
	createdAt: string;
	updatedAt: string;
}

// Category
export interface Category {
	id: string;
	parentId?: string;
	name: string;
	icon?: string;
	color?: string;
	order: number;
	children?: Category[];
	createdAt: string;
	updatedAt: string;
}

// Item
export interface Item {
	id: string;
	collectionId: string;
	locationId?: string;
	categoryId?: string;
	name: string;
	description?: string;
	status: ItemStatus;
	quantity: number;
	fieldValues: Record<string, unknown>;
	purchaseData?: PurchaseData;
	photos: ItemPhoto[];
	notes: ItemNote[];
	documents: ItemDocument[];
	tags: string[];
	order: number;
	createdAt: string;
	updatedAt: string;
}

// Template definition
export interface Template {
	id: string;
	name: string;
	description: string;
	icon: string;
	schema: CollectionSchema;
	category: string;
}

// Saved filter
export interface SavedFilter {
	id: string;
	name: string;
	criteria: FilterCriteria;
	createdAt: string;
}

export interface FilterCriteria {
	search?: string;
	status?: ItemStatus[];
	locationId?: string;
	categoryId?: string;
	tagIds?: string[];
	collectionId?: string;
}

// View mode
export type ViewMode = 'list' | 'grid' | 'table';

// Sort options
export type SortField = 'name' | 'createdAt' | 'updatedAt' | 'status' | 'quantity';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
	field: SortField;
	direction: SortDirection;
}
