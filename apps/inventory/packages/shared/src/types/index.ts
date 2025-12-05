// Item condition enum
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

// Document type enum
export type DocumentType = 'receipt' | 'warranty' | 'manual' | 'other';

// Contact relationship type
export type ContactRelationType = 'seller' | 'manufacturer' | 'service';

// Base item interface
export interface Item {
	id: string;
	userId: string;
	name: string;
	description?: string | null;
	sku?: string | null;
	categoryId?: string | null;
	locationId?: string | null;
	purchaseDate?: string | null;
	purchasePrice?: string | null;
	currency: string;
	currentValue?: string | null;
	condition: ItemCondition;
	warrantyExpires?: string | null;
	warrantyNotes?: string | null;
	notes?: string | null;
	quantity: number;
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
	// Relationships (when loaded)
	category?: Category | null;
	location?: Location | null;
	photos?: ItemPhoto[];
	documents?: ItemDocument[];
	contacts?: ItemContact[];
}

// Category interface
export interface Category {
	id: string;
	userId: string;
	name: string;
	icon?: string | null;
	color?: string | null;
	parentCategoryId?: string | null;
	createdAt: string;
	// Relationships
	parent?: Category | null;
	children?: Category[];
	itemCount?: number;
}

// Category with children (for tree view)
export interface CategoryWithChildren extends Category {
	children: CategoryWithChildren[];
	level?: number;
}

// Location interface
export interface Location {
	id: string;
	userId: string;
	name: string;
	description?: string | null;
	parentLocationId?: string | null;
	createdAt: string;
	// Relationships
	parent?: Location | null;
	children?: Location[];
	itemCount?: number;
}

// Location with children (for tree view)
export interface LocationWithChildren extends Location {
	children: LocationWithChildren[];
	level?: number;
}

// Item photo interface
export interface ItemPhoto {
	id: string;
	itemId: string;
	storageKey: string;
	isPrimary: boolean;
	caption?: string | null;
	sortOrder: number;
	createdAt: string;
	// Computed
	url?: string;
}

// Item document interface
export interface ItemDocument {
	id: string;
	itemId: string;
	storageKey: string;
	documentType: DocumentType;
	filename: string;
	mimeType?: string | null;
	fileSize?: number | null;
	uploadedAt: string;
	// Computed
	url?: string;
}

// Item contact link interface
export interface ItemContact {
	id: string;
	itemId: string;
	contactId: string;
	relationshipType: ContactRelationType;
	createdAt: string;
	// From Contacts app (when loaded)
	contactName?: string;
	contactEmail?: string;
	contactPhone?: string;
}

// Create/Update DTOs
export interface CreateItemInput {
	name: string;
	description?: string;
	sku?: string;
	categoryId?: string;
	locationId?: string;
	purchaseDate?: string;
	purchasePrice?: number;
	currency?: string;
	currentValue?: number;
	condition?: ItemCondition;
	warrantyExpires?: string;
	warrantyNotes?: string;
	notes?: string;
	quantity?: number;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {
	isFavorite?: boolean;
	isArchived?: boolean;
}

export interface CreateCategoryInput {
	name: string;
	icon?: string;
	color?: string;
	parentCategoryId?: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export interface CreateLocationInput {
	name: string;
	description?: string;
	parentLocationId?: string;
}

export interface UpdateLocationInput extends Partial<CreateLocationInput> {}

// Query params for items API
export interface ItemQueryParams {
	search?: string;
	categoryId?: string;
	locationId?: string;
	condition?: ItemCondition;
	isFavorite?: boolean;
	isArchived?: boolean;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	page?: number;
	limit?: number;
}

// Pagination info
export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
	data: T[];
	pagination: Pagination;
}

// Filter interfaces
export interface ItemFilters {
	search?: string;
	categoryId?: string;
	locationId?: string;
	condition?: ItemCondition;
	isFavorite?: boolean;
	isArchived?: boolean;
	minPrice?: number;
	maxPrice?: number;
	hasWarranty?: boolean;
	warrantyExpiresSoon?: boolean;
	limit?: number;
	offset?: number;
}

// API Response types
export interface ItemsResponse {
	items: Item[];
	total: number;
}

export interface CategoriesResponse {
	categories: Category[];
}

export interface LocationsResponse {
	locations: Location[];
}

// Import/Export types
export interface ImportPreview {
	totalRows: number;
	validRows: number;
	errors: ImportError[];
	preview: Partial<Item>[];
}

export interface ImportError {
	row: number;
	field: string;
	message: string;
}

export interface ImportResult {
	imported: number;
	skipped: number;
	errors: ImportError[];
}

export interface ExportOptions {
	categoryId?: string;
	locationId?: string;
	includeArchived?: boolean;
	format?: 'csv';
}

// Statistics
export interface InventoryStats {
	totalItems: number;
	totalValue: number;
	itemsByCategory: { categoryId: string; categoryName: string; count: number }[];
	itemsByLocation: { locationId: string; locationName: string; count: number }[];
	itemsByCondition: { condition: ItemCondition; count: number }[];
	warrantyExpiringSoon: number;
}
