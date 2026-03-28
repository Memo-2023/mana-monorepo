/**
 * Help content for Zitare app
 */

import type { HelpContent } from '@manacore/help';
import { getPrivacyFAQs } from '@manacore/help';

export function getZitareHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-browse',
				question: isDE ? 'Wie finde ich Zitate?' : 'How do I find quotes?',
				answer: isDE
					? '<p>Es gibt mehrere Wege, Zitate zu entdecken:</p><ul><li><strong>Kategorien</strong>: Durchstöbere Zitate nach Themen wie Motivation, Liebe, Weisheit</li><li><strong>Suche</strong>: Suche nach Stichwörtern, Autoren oder Inhalten</li><li><strong>Startseite</strong>: Entdecke das tägliche Zitat und Empfehlungen</li><li><strong>Spiral-Ansicht</strong>: Eine einzigartige visuelle Art, Zitate zu erkunden</li></ul>'
					: '<p>There are several ways to discover quotes:</p><ul><li><strong>Categories</strong>: Browse quotes by topics like motivation, love, wisdom</li><li><strong>Search</strong>: Search by keywords, authors, or content</li><li><strong>Home</strong>: Discover the daily quote and recommendations</li><li><strong>Spiral view</strong>: A unique visual way to explore quotes</li></ul>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['suche', 'kategorien', 'entdecken'] : ['search', 'categories', 'discover'],
			},
			{
				id: 'faq-favorites',
				question: isDE ? 'Wie speichere ich Lieblingszitate?' : 'How do I save favorite quotes?',
				answer: isDE
					? '<p>Tippe auf das <strong>Herz-Symbol</strong> neben einem Zitat, um es als Favorit zu speichern. Alle Favoriten findest du unter <strong>Favoriten</strong> in der Navigation.</p>'
					: '<p>Tap the <strong>heart icon</strong> next to a quote to save it as a favorite. Find all your favorites under <strong>Favorites</strong> in the navigation.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['favoriten', 'speichern', 'herz'] : ['favorites', 'save', 'heart'],
			},
			{
				id: 'faq-lists',
				question: isDE ? 'Was sind Listen?' : 'What are lists?',
				answer: isDE
					? '<p>Listen ermöglichen es dir, Zitate thematisch zu sammeln:</p><ul><li>Erstelle eigene Listen für verschiedene Anlässe</li><li>Füge Zitate zu bestehenden Listen hinzu</li><li>Organisiere deine Lieblingszitate nach Themen</li></ul>'
					: '<p>Lists allow you to collect quotes by theme:</p><ul><li>Create custom lists for different occasions</li><li>Add quotes to existing lists</li><li>Organize your favorite quotes by topic</li></ul>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['listen', 'sammlung', 'organisieren'] : ['lists', 'collection', 'organize'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Zitate', dataTypeEN: 'quotes' }),
		],
		features: [
			{
				id: 'feature-daily',
				title: isDE ? 'Tägliche Inspiration' : 'Daily Inspiration',
				description: isDE
					? 'Jeden Tag ein neues inspirierendes Zitat'
					: 'A new inspiring quote every day',
				icon: '✨',
				category: 'core',
				highlights: isDE
					? ['Tägliches Zitat', 'Empfehlungen', 'Kategorien']
					: ['Daily quote', 'Recommendations', 'Categories'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-collections',
				title: isDE ? 'Sammlungen' : 'Collections',
				description: isDE
					? 'Speichere und organisiere deine Lieblingszitate'
					: 'Save and organize your favorite quotes',
				icon: '📚',
				category: 'core',
				highlights: isDE
					? ['Favoriten', 'Eigene Listen', 'Thematisch sortiert']
					: ['Favorites', 'Custom lists', 'Sorted by theme'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-spiral',
				title: isDE ? 'Spiral-Ansicht' : 'Spiral View',
				description: isDE
					? 'Entdecke Zitate in einer einzigartigen visuellen Darstellung'
					: 'Discover quotes in a unique visual presentation',
				icon: '🌀',
				category: 'advanced',
				highlights: isDE
					? ['Visuelle Exploration', 'Interaktiv', 'Einzigartig']
					: ['Visual exploration', 'Interactive', 'Unique'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
		],
		shortcuts: [],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: isDE ? 'Support kontaktieren' : 'Contact Support',
			content: isDE
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Zitare.</p>'
				: '<p>Our support team is here to help you with any questions about Zitare.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
