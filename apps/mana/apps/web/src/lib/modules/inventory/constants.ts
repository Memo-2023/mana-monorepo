/**
 * Inventar constants — templates and status definitions.
 *
 * Inlined from @inventory/shared since the unified app does not depend on it.
 */

import type { ItemStatus } from './queries';

export type FieldType =
	| 'text'
	| 'number'
	| 'date'
	| 'select'
	| 'tags'
	| 'checkbox'
	| 'url'
	| 'currency';

export interface FieldDefinition {
	id: string;
	name: string;
	type: FieldType;
	required?: boolean;
	defaultValue?: unknown;
	options?: string[];
	currencyCode?: string;
	placeholder?: string;
	order: number;
}

export interface CollectionSchema {
	fields: FieldDefinition[];
}

export interface Template {
	id: string;
	name: string;
	description: string;
	icon: string;
	schema: CollectionSchema;
	category: string;
}

export const ITEM_STATUSES: {
	value: ItemStatus;
	label: string;
	color: string;
}[] = [
	{ value: 'owned', label: 'Besitzt', color: '#22c55e' },
	{ value: 'lent', label: 'Verliehen', color: '#f59e0b' },
	{ value: 'stored', label: 'Eingelagert', color: '#3b82f6' },
	{ value: 'for_sale', label: 'Zu verkaufen', color: '#a855f7' },
	{ value: 'disposed', label: 'Entsorgt', color: '#6b7280' },
];

export const DEFAULT_TEMPLATES: Template[] = [
	{
		id: 'electronics',
		name: 'Elektronik',
		description: 'Computer, Smartphones, Gadgets',
		icon: '💻',
		category: 'tech',
		schema: {
			fields: [
				{ id: 'brand', name: 'Marke', type: 'text', order: 0 },
				{ id: 'model', name: 'Modell', type: 'text', order: 1 },
				{ id: 'serial_number', name: 'Seriennummer', type: 'text', order: 2 },
				{ id: 'purchase_date', name: 'Kaufdatum', type: 'date', order: 3 },
				{ id: 'warranty_until', name: 'Garantie bis', type: 'date', order: 4 },
				{ id: 'price', name: 'Preis', type: 'currency', currencyCode: 'EUR', order: 5 },
				{
					id: 'condition',
					name: 'Zustand',
					type: 'select',
					options: ['Neu', 'Sehr gut', 'Gut', 'Gebraucht', 'Defekt'],
					order: 6,
				},
			],
		},
	},
	{
		id: 'books',
		name: 'Bucher',
		description: 'Bucher, E-Books, Horbucher',
		icon: '📚',
		category: 'media',
		schema: {
			fields: [
				{ id: 'author', name: 'Autor', type: 'text', order: 0 },
				{ id: 'isbn', name: 'ISBN', type: 'text', order: 1 },
				{ id: 'publisher', name: 'Verlag', type: 'text', order: 2 },
				{ id: 'genre', name: 'Genre', type: 'text', order: 3 },
				{ id: 'pages', name: 'Seiten', type: 'number', order: 4 },
				{ id: 'read', name: 'Gelesen', type: 'checkbox', order: 5 },
				{
					id: 'rating',
					name: 'Bewertung',
					type: 'select',
					options: ['1', '2', '3', '4', '5'],
					order: 6,
				},
			],
		},
	},
	{
		id: 'furniture',
		name: 'Mobel',
		description: 'Tische, Stuhle, Regale',
		icon: '🪑',
		category: 'home',
		schema: {
			fields: [
				{ id: 'material', name: 'Material', type: 'text', order: 0 },
				{
					id: 'dimensions',
					name: 'Masse',
					type: 'text',
					placeholder: 'B x H x T in cm',
					order: 1,
				},
				{ id: 'color', name: 'Farbe', type: 'text', order: 2 },
				{ id: 'room', name: 'Raum', type: 'text', order: 3 },
				{
					id: 'condition',
					name: 'Zustand',
					type: 'select',
					options: ['Neu', 'Sehr gut', 'Gut', 'Gebraucht', 'Reparaturbedurftig'],
					order: 4,
				},
				{ id: 'price', name: 'Preis', type: 'currency', currencyCode: 'EUR', order: 5 },
			],
		},
	},
	{
		id: 'clothing',
		name: 'Kleidung',
		description: 'Kleidung, Schuhe, Accessoires',
		icon: '👕',
		category: 'fashion',
		schema: {
			fields: [
				{ id: 'brand', name: 'Marke', type: 'text', order: 0 },
				{ id: 'size', name: 'Grosse', type: 'text', order: 1 },
				{ id: 'color', name: 'Farbe', type: 'text', order: 2 },
				{ id: 'material', name: 'Material', type: 'text', order: 3 },
				{
					id: 'season',
					name: 'Saison',
					type: 'select',
					options: ['Fruhling', 'Sommer', 'Herbst', 'Winter', 'Ganzjahrig'],
					order: 4,
				},
				{ id: 'price', name: 'Preis', type: 'currency', currencyCode: 'EUR', order: 5 },
			],
		},
	},
	{
		id: 'tools',
		name: 'Werkzeug',
		description: 'Handwerkzeug, Elektrowerkzeug',
		icon: '🔧',
		category: 'home',
		schema: {
			fields: [
				{ id: 'brand', name: 'Marke', type: 'text', order: 0 },
				{ id: 'model', name: 'Modell', type: 'text', order: 1 },
				{
					id: 'type',
					name: 'Typ',
					type: 'select',
					options: ['Handwerkzeug', 'Elektrowerkzeug', 'Messwerkzeug', 'Sonstiges'],
					order: 2,
				},
				{
					id: 'condition',
					name: 'Zustand',
					type: 'select',
					options: ['Neu', 'Gut', 'Gebraucht', 'Defekt'],
					order: 3,
				},
				{ id: 'price', name: 'Preis', type: 'currency', currencyCode: 'EUR', order: 4 },
			],
		},
	},
	{
		id: 'kitchen',
		name: 'Kuche',
		description: 'Kuchengerate, Geschirr, Besteck',
		icon: '🍳',
		category: 'home',
		schema: {
			fields: [
				{ id: 'brand', name: 'Marke', type: 'text', order: 0 },
				{ id: 'material', name: 'Material', type: 'text', order: 1 },
				{
					id: 'category',
					name: 'Kategorie',
					type: 'select',
					options: ['Gerat', 'Geschirr', 'Besteck', 'Topf/Pfanne', 'Sonstiges'],
					order: 2,
				},
				{ id: 'dishwasher_safe', name: 'Spulmaschinenfest', type: 'checkbox', order: 3 },
				{ id: 'price', name: 'Preis', type: 'currency', currencyCode: 'EUR', order: 4 },
			],
		},
	},
	{
		id: 'media',
		name: 'Medien',
		description: 'Filme, Musik, Spiele',
		icon: '🎬',
		category: 'media',
		schema: {
			fields: [
				{
					id: 'format',
					name: 'Format',
					type: 'select',
					options: ['DVD', 'Blu-ray', 'CD', 'Vinyl', 'Digital', 'Kassette'],
					order: 0,
				},
				{ id: 'artist', name: 'Kunstler/Regisseur', type: 'text', order: 1 },
				{ id: 'genre', name: 'Genre', type: 'text', order: 2 },
				{ id: 'year', name: 'Erscheinungsjahr', type: 'number', order: 3 },
				{
					id: 'rating',
					name: 'Bewertung',
					type: 'select',
					options: ['1', '2', '3', '4', '5'],
					order: 4,
				},
			],
		},
	},
	{
		id: 'custom',
		name: 'Benutzerdefiniert',
		description: 'Leere Sammlung, eigene Felder definieren',
		icon: '✨',
		category: 'other',
		schema: {
			fields: [],
		},
	},
];
