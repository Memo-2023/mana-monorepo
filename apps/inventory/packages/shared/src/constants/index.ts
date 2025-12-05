import type { ItemCondition, DocumentType, ContactRelationType } from '../types';

// Item conditions with labels
export const ITEM_CONDITIONS: { value: ItemCondition; label: string; labelDe: string }[] = [
	{ value: 'new', label: 'New', labelDe: 'Neu' },
	{ value: 'like_new', label: 'Like New', labelDe: 'Wie neu' },
	{ value: 'good', label: 'Good', labelDe: 'Gut' },
	{ value: 'fair', label: 'Fair', labelDe: 'Akzeptabel' },
	{ value: 'poor', label: 'Poor', labelDe: 'Schlecht' },
];

// Document types with labels
export const DOCUMENT_TYPES: { value: DocumentType; label: string; labelDe: string }[] = [
	{ value: 'receipt', label: 'Receipt', labelDe: 'Kassenbon' },
	{ value: 'warranty', label: 'Warranty', labelDe: 'Garantie' },
	{ value: 'manual', label: 'Manual', labelDe: 'Handbuch' },
	{ value: 'other', label: 'Other', labelDe: 'Sonstiges' },
];

// Contact relationship types with labels
export const CONTACT_RELATION_TYPES: {
	value: ContactRelationType;
	label: string;
	labelDe: string;
}[] = [
	{ value: 'seller', label: 'Seller', labelDe: 'Verkäufer' },
	{ value: 'manufacturer', label: 'Manufacturer', labelDe: 'Hersteller' },
	{ value: 'service', label: 'Service', labelDe: 'Service' },
];

// Common currencies
export const CURRENCIES = [
	{ code: 'EUR', symbol: '€', name: 'Euro' },
	{ code: 'USD', symbol: '$', name: 'US Dollar' },
	{ code: 'GBP', symbol: '£', name: 'British Pound' },
	{ code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

// Default category icons
export const CATEGORY_ICONS = [
	'laptop',
	'smartphone',
	'tv',
	'camera',
	'headphones',
	'speaker',
	'watch',
	'game-controller',
	'car',
	'bicycle',
	'home',
	'sofa',
	'bed',
	'lamp',
	'kitchen',
	'book',
	'music',
	'art',
	'sports',
	'tools',
	'clothes',
	'jewelry',
	'bag',
	'gift',
	'box',
	'folder',
];

// Default category colors
export const CATEGORY_COLORS = [
	'#EF4444', // red
	'#F97316', // orange
	'#F59E0B', // amber
	'#EAB308', // yellow
	'#84CC16', // lime
	'#22C55E', // green
	'#10B981', // emerald
	'#14B8A6', // teal
	'#06B6D4', // cyan
	'#0EA5E9', // sky
	'#3B82F6', // blue
	'#6366F1', // indigo
	'#8B5CF6', // violet
	'#A855F7', // purple
	'#D946EF', // fuchsia
	'#EC4899', // pink
];

// File upload limits
export const UPLOAD_LIMITS = {
	maxPhotoSize: 10 * 1024 * 1024, // 10MB
	maxDocumentSize: 25 * 1024 * 1024, // 25MB
	maxPhotosPerItem: 10,
	maxDocumentsPerItem: 20,
	allowedPhotoTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
	allowedDocumentTypes: [
		'application/pdf',
		'image/jpeg',
		'image/png',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	],
};

// Warranty expiry warning (days before expiry)
export const WARRANTY_WARNING_DAYS = 30;

// Pagination defaults
export const PAGINATION = {
	defaultLimit: 50,
	maxLimit: 200,
};
