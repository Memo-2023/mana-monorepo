import type { LocalArticle, LocalCategory } from './local-store';

export const guestCategories: LocalCategory[] = [
	{ id: 'cat-tech', name: 'Technologie', slug: 'technologie', color: '#3b82f6', order: 0 },
	{ id: 'cat-science', name: 'Wissenschaft', slug: 'wissenschaft', color: '#10b981', order: 1 },
	{ id: 'cat-world', name: 'Welt', slug: 'welt', color: '#f59e0b', order: 2 },
	{ id: 'cat-business', name: 'Wirtschaft', slug: 'wirtschaft', color: '#8b5cf6', order: 3 },
];

export const guestArticles: LocalArticle[] = [
	{
		id: 'demo-1',
		type: 'feed',
		sourceOrigin: 'ai',
		title: 'Willkommen bei News Hub!',
		excerpt: 'Dein persönlicher Nachrichtenleser mit KI-Zusammenfassungen und Read-Later Funktion.',
		content:
			'News Hub kombiniert KI-kuratierte Nachrichten mit deiner persönlichen Leseliste. Speichere Artikel von jeder Website, lese sie offline und entdecke neue Perspektiven.',
		categoryId: 'cat-tech',
		isArchived: false,
		wordCount: 42,
		readingTimeMinutes: 1,
		publishedAt: new Date().toISOString(),
	},
	{
		id: 'demo-2',
		type: 'saved',
		sourceOrigin: 'user_saved',
		title: 'Beispiel: Gespeicherter Artikel',
		excerpt:
			'So sieht ein gespeicherter Artikel aus. Nutze die Browser-Extension um Artikel zu speichern.',
		originalUrl: 'https://example.com',
		content:
			'Dies ist ein Beispiel für einen Artikel, den du über die Browser-Extension oder die Web-App gespeichert hast.',
		isArchived: false,
		wordCount: 30,
		readingTimeMinutes: 1,
	},
];
