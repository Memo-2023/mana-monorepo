import type { Template, ItemStatus } from '../types/index.js';

export const ITEM_STATUSES: {
	value: ItemStatus;
	labelDe: string;
	labelEn: string;
	color: string;
}[] = [
	{ value: 'owned', labelDe: 'Besitzt', labelEn: 'Owned', color: '#22c55e' },
	{ value: 'lent', labelDe: 'Verliehen', labelEn: 'Lent', color: '#f59e0b' },
	{ value: 'stored', labelDe: 'Eingelagert', labelEn: 'Stored', color: '#3b82f6' },
	{ value: 'for_sale', labelDe: 'Zu verkaufen', labelEn: 'For Sale', color: '#a855f7' },
	{ value: 'disposed', labelDe: 'Entsorgt', labelEn: 'Disposed', color: '#6b7280' },
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
		name: 'Bücher',
		description: 'Bücher, E-Books, Hörbücher',
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
		name: 'Möbel',
		description: 'Tische, Stühle, Regale',
		icon: '🪑',
		category: 'home',
		schema: {
			fields: [
				{ id: 'material', name: 'Material', type: 'text', order: 0 },
				{ id: 'dimensions', name: 'Maße', type: 'text', placeholder: 'B x H x T in cm', order: 1 },
				{ id: 'color', name: 'Farbe', type: 'text', order: 2 },
				{ id: 'room', name: 'Raum', type: 'text', order: 3 },
				{
					id: 'condition',
					name: 'Zustand',
					type: 'select',
					options: ['Neu', 'Sehr gut', 'Gut', 'Gebraucht', 'Reparaturbedürftig'],
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
				{ id: 'size', name: 'Größe', type: 'text', order: 1 },
				{ id: 'color', name: 'Farbe', type: 'text', order: 2 },
				{ id: 'material', name: 'Material', type: 'text', order: 3 },
				{
					id: 'season',
					name: 'Saison',
					type: 'select',
					options: ['Frühling', 'Sommer', 'Herbst', 'Winter', 'Ganzjährig'],
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
		name: 'Küche',
		description: 'Küchengeräte, Geschirr, Besteck',
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
					options: ['Gerät', 'Geschirr', 'Besteck', 'Topf/Pfanne', 'Sonstiges'],
					order: 2,
				},
				{ id: 'dishwasher_safe', name: 'Spülmaschinenfest', type: 'checkbox', order: 3 },
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
				{ id: 'artist', name: 'Künstler/Regisseur', type: 'text', order: 1 },
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
