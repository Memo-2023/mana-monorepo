/**
 * Inventar module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';

export interface LocalCollection extends BaseRecord {
	name: string;
	description?: string | null;
	icon?: string | null;
	color?: string | null;
	schema: {
		fields: Array<{
			id: string;
			name: string;
			type: string;
			required?: boolean;
			defaultValue?: unknown;
			options?: string[];
			currencyCode?: string;
			placeholder?: string;
			order: number;
		}>;
	};
	templateId?: string | null;
	order: number;
	itemCount: number;
}

export interface LocalItem extends BaseRecord {
	collectionId: string;
	locationId?: string | null;
	categoryId?: string | null;
	name: string;
	description?: string | null;
	status: 'owned' | 'lent' | 'stored' | 'for_sale' | 'disposed';
	quantity: number;
	fieldValues: Record<string, unknown>;
	purchaseData?: {
		price?: number;
		currency?: string;
		date?: string;
		retailer?: string;
		warrantyExpiry?: string;
	} | null;
	photos: Array<{ id: string; url: string; caption?: string; order: number }>;
	notes: Array<{ id: string; content: string; createdAt: string }>;
	tags: string[];
	order: number;
}

export interface LocalLocation extends BaseRecord {
	parentId?: string | null;
	name: string;
	description?: string | null;
	icon?: string | null;
	path: string;
	depth: number;
	order: number;
}

export interface LocalCategory extends BaseRecord {
	parentId?: string | null;
	name: string;
	icon?: string | null;
	color?: string | null;
	order: number;
}
