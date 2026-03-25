/**
 * Help content for Photos app
 */

import type { HelpContent } from '@manacore/shared-help-types';

export function getPhotosHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-gallery',
				question: isDE ? 'Wie funktioniert die Galerie?' : 'How does the gallery work?',
				answer: isDE
					? '<p>Die Photos-Galerie vereint alle Fotos aus deinen ManaCore-Apps an einem Ort. Bilder aus Chat, Picture, Contacts und anderen Apps werden automatisch gesammelt und chronologisch angezeigt.</p><ul><li>Fotos werden automatisch aus verbundenen Apps importiert</li><li>Du kannst nach Datum, App oder Tags filtern</li><li>Die Galerie aktualisiert sich automatisch, wenn neue Fotos hinzugefügt werden</li></ul>'
					: '<p>The Photos gallery unifies all photos from your ManaCore apps in one place. Images from Chat, Picture, Contacts, and other apps are automatically collected and displayed chronologically.</p><ul><li>Photos are automatically imported from connected apps</li><li>You can filter by date, app, or tags</li><li>The gallery updates automatically when new photos are added</li></ul>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: ['gallery', 'photos', 'overview'],
			},
			{
				id: 'faq-albums',
				question: isDE ? 'Wie erstelle ich Alben?' : 'How do I create albums?',
				answer: isDE
					? '<p>Alben helfen dir, deine Fotos zu organisieren:</p><ol><li>Öffne den Bereich <strong>Alben</strong></li><li>Tippe auf <strong>Neues Album</strong></li><li>Gib einen Namen und optional eine Beschreibung ein</li><li>Wähle Fotos aus, die du hinzufügen möchtest</li></ol><p>Du kannst Fotos auch direkt aus der Galerie zu bestehenden Alben hinzufügen.</p>'
					: '<p>Albums help you organize your photos:</p><ol><li>Open the <strong>Albums</strong> section</li><li>Tap <strong>New Album</strong></li><li>Enter a name and optional description</li><li>Select photos you want to add</li></ol><p>You can also add photos to existing albums directly from the gallery.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: ['albums', 'organize', 'create'],
			},
			{
				id: 'faq-smart-albums',
				question: isDE ? 'Was sind smarte Alben?' : 'What are smart albums?',
				answer: isDE
					? '<p>Smarte Alben werden automatisch basierend auf Regeln erstellt und aktualisiert:</p><ul><li><strong>Nach App</strong> — Alle Fotos aus einer bestimmten App (z.B. alle Chat-Bilder)</li><li><strong>Nach Datum</strong> — Fotos aus einem bestimmten Zeitraum</li><li><strong>Nach Tags</strong> — Fotos mit bestimmten Tags</li></ul><p>Smarte Alben aktualisieren sich automatisch, wenn neue Fotos den Kriterien entsprechen.</p>'
					: '<p>Smart albums are automatically created and updated based on rules:</p><ul><li><strong>By App</strong> — All photos from a specific app (e.g., all Chat images)</li><li><strong>By Date</strong> — Photos from a specific time period</li><li><strong>By Tags</strong> — Photos with specific tags</li></ul><p>Smart albums update automatically when new photos match the criteria.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: ['smart-albums', 'automatic', 'rules'],
			},
			{
				id: 'faq-favorites',
				question: isDE ? 'Wie funktionieren Favoriten?' : 'How do favorites work?',
				answer: isDE
					? '<p>Markiere deine Lieblingsfotos als Favoriten, um sie schnell wiederzufinden:</p><ul><li>Klicke auf das <strong>Herz-Symbol</strong> auf einem Foto, um es als Favorit zu markieren</li><li>Alle Favoriten findest du im Bereich <strong>Favoriten</strong></li><li>Favoriten werden über alle Geräte synchronisiert</li></ul>'
					: '<p>Mark your favorite photos to find them quickly:</p><ul><li>Click the <strong>heart icon</strong> on a photo to mark it as a favorite</li><li>Find all favorites in the <strong>Favorites</strong> section</li><li>Favorites are synced across all your devices</li></ul>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: ['favorites', 'heart', 'bookmarks'],
			},
			{
				id: 'faq-privacy',
				question: isDE ? 'Wie werden meine Fotos geschützt?' : 'How are my photos protected?',
				answer: isDE
					? '<p>Deine Fotos sind sicher bei ManaCore:</p><ul><li>Alle Fotos werden verschlüsselt übertragen und gespeichert</li><li>Nur du hast Zugriff auf deine Galerie</li><li>Fotos werden nicht für KI-Training oder andere Zwecke verwendet</li><li>Du kannst jederzeit Fotos löschen — sie werden dann dauerhaft entfernt</li></ul>'
					: '<p>Your photos are safe with ManaCore:</p><ul><li>All photos are encrypted in transit and at rest</li><li>Only you have access to your gallery</li><li>Photos are not used for AI training or other purposes</li><li>You can delete photos at any time — they are permanently removed</li></ul>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				tags: ['privacy', 'security', 'data'],
			},
		],
		features: [
			{
				id: 'feature-gallery',
				title: isDE ? 'Zentrale Galerie' : 'Central Gallery',
				description: isDE
					? 'Alle Fotos aus deinen ManaCore-Apps an einem Ort, automatisch organisiert und durchsuchbar.'
					: 'All photos from your ManaCore apps in one place, automatically organized and searchable.',
				icon: '🖼️',
				category: 'core',
				highlights: isDE
					? ['App-übergreifende Sammlung', 'Chronologische Ansicht', 'Schnelle Suche']
					: ['Cross-app collection', 'Chronological view', 'Fast search'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-albums',
				title: isDE ? 'Alben' : 'Albums',
				description: isDE
					? 'Erstelle benutzerdefinierte Alben, um deine Fotos nach Themen, Ereignissen oder Projekten zu organisieren.'
					: 'Create custom albums to organize your photos by topics, events, or projects.',
				icon: '📁',
				category: 'core',
				highlights: isDE
					? ['Benutzerdefinierte Alben', 'Drag & Drop', 'Geteilte Alben']
					: ['Custom albums', 'Drag & drop', 'Shared albums'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-smart-albums',
				title: isDE ? 'Smarte Alben' : 'Smart Albums',
				description: isDE
					? 'Automatisch aktualisierte Alben basierend auf Regeln wie App-Quelle, Datum oder Tags.'
					: 'Automatically updated albums based on rules like app source, date, or tags.',
				icon: '🧠',
				category: 'advanced',
				highlights: isDE
					? ['Regelbasiert', 'Automatische Updates', 'Flexible Filter']
					: ['Rule-based', 'Automatic updates', 'Flexible filters'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-tags-favorites',
				title: isDE ? 'Tags & Favoriten' : 'Tags & Favorites',
				description: isDE
					? 'Tagge und markiere Fotos als Favoriten für schnellen Zugriff und bessere Organisation.'
					: 'Tag and mark photos as favorites for quick access and better organization.',
				icon: '❤️',
				category: 'core',
				highlights: isDE
					? ['Benutzerdefinierte Tags', 'Favoriten-Sammlung', 'Geräteübergreifende Sync']
					: ['Custom tags', 'Favorites collection', 'Cross-device sync'],
				content: '',
				order: 4,
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Photos.</p>'
				: '<p>Our support team is here to help you with any questions about Photos.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
