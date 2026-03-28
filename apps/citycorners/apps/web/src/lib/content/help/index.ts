/**
 * Help content for CityCorners app
 */

import type { HelpContent } from '@manacore/help';
import { getPrivacyFAQs } from '@manacore/help';

export function getCityCornersHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-locations',
				question: isDE ? 'Wie finde ich Orte in Konstanz?' : 'How do I find places in Konstanz?',
				answer: isDE
					? '<p>CityCorners zeigt dir die besten Orte in Konstanz:</p><ul><li>Nutze die <strong>Kategoriefilter</strong> (Sehenswürdigkeiten, Restaurants, Cafés, Bars, Parks, Museen, etc.)</li><li>Durchsuche die Karte mit farbcodierten Markern</li><li>Nutze die <strong>Suche</strong> in der QuickInputBar für gezielte Ergebnisse</li><li>11 verschiedene Kategorien stehen zur Verfügung</li></ul>'
					: '<p>CityCorners shows you the best places in Konstanz:</p><ul><li>Use <strong>category filters</strong> (sights, restaurants, cafés, bars, parks, museums, etc.)</li><li>Browse the map with color-coded markers</li><li>Use <strong>search</strong> in the QuickInputBar for targeted results</li><li>11 different categories are available</li></ul>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['orte', 'suche', 'kategorien'] : ['locations', 'search', 'categories'],
			},
			{
				id: 'faq-map',
				question: isDE ? 'Wie funktioniert die Kartenansicht?' : 'How does the map view work?',
				answer: isDE
					? '<p>Die interaktive Leaflet-Karte zeigt alle Orte mit farbcodierten Markern nach Kategorie:</p><ul><li><strong>Blau</strong> — Sehenswürdigkeiten</li><li><strong>Rot</strong> — Restaurants</li><li><strong>Gelb</strong> — Cafés</li><li><strong>Orange</strong> — Bars</li><li><strong>Grün</strong> — Parks und Läden</li><li>Klicke auf einen Marker für Details und Wegbeschreibung</li></ul>'
					: '<p>The interactive Leaflet map shows all locations with color-coded markers by category:</p><ul><li><strong>Blue</strong> — Sights</li><li><strong>Red</strong> — Restaurants</li><li><strong>Yellow</strong> — Cafés</li><li><strong>Orange</strong> — Bars</li><li><strong>Green</strong> — Parks and shops</li><li>Click a marker for details and directions</li></ul>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['karte', 'marker', 'navigation'] : ['map', 'markers', 'navigation'],
			},
			{
				id: 'faq-favorites',
				question: isDE ? 'Wie speichere ich Favoriten?' : 'How do I save favorites?',
				answer: isDE
					? '<p>Melde dich an und klicke auf das <strong>Herz-Symbol</strong> bei einem Ort, um ihn als Favorit zu speichern. Alle Favoriten findest du im Bereich <strong>Favoriten</strong>. Favoriten werden optimistisch aktualisiert — du siehst die Änderung sofort.</p>'
					: '<p>Sign in and click the <strong>heart icon</strong> on a location to save it as a favorite. Find all favorites in the <strong>Favorites</strong> section. Favorites are optimistically updated — you see the change immediately.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['favoriten', 'speichern', 'merken'] : ['favorites', 'save', 'bookmarks'],
			},
			{
				id: 'faq-add-location',
				question: isDE ? 'Kann ich eigene Orte hinzufügen?' : 'Can I add my own locations?',
				answer: isDE
					? '<p>Ja! Melde dich an und nutze die Funktion <strong>Ort hinzufügen</strong>:</p><ol><li>Suche den Ort per <strong>Web-Lookup</strong> — Informationen werden automatisch aus dem Web extrahiert</li><li>Ergänze oder bearbeite die Informationen (Name, Beschreibung, Adresse)</li><li>Wähle eine der 11 Kategorien</li><li>Sende den Ort ab</li></ol><p>Der Web-Lookup nutzt unseren eigenen Suchdienst (mana-search).</p>'
					: '<p>Yes! Sign in and use the <strong>Add Location</strong> feature:</p><ol><li>Search for the place via <strong>web lookup</strong> — information is automatically extracted from the web</li><li>Complete or edit the information (name, description, address)</li><li>Choose one of the 11 categories</li><li>Submit the location</li></ol><p>The web lookup uses our own search service (mana-search).</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['hinzufügen', 'beitragen', 'orte'] : ['add', 'contribute', 'locations'],
			},
			{
				id: 'faq-detail-timeline',
				question: isDE ? 'Was zeigen die Detailseiten?' : 'What do detail pages show?',
				answer: isDE
					? '<p>Jeder Ort hat eine ausführliche Detailseite:</p><ul><li><strong>Beschreibung</strong> und Adresse</li><li><strong>Mini-Karte</strong> mit dem Standort</li><li><strong>Timeline</strong> — Historische Ereignisse des Ortes (z.B. Gründungsjahr, wichtige Ereignisse)</li><li><strong>Favoriten-Button</strong> zum Speichern</li><li>Möglichkeit, den Ort zu bearbeiten</li></ul>'
					: '<p>Each location has a detailed page:</p><ul><li><strong>Description</strong> and address</li><li><strong>Mini-map</strong> with the location</li><li><strong>Timeline</strong> — Historical events of the place (e.g., founding year, important events)</li><li><strong>Favorite button</strong> to save</li><li>Option to edit the location</li></ul>',
				category: 'features',
				order: 5,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['details', 'timeline', 'historie'] : ['details', 'timeline', 'history'],
			},
			{
				id: 'faq-categories',
				question: isDE ? 'Welche Kategorien gibt es?' : 'What categories are available?',
				answer: isDE
					? '<p>CityCorners bietet <strong>11 Kategorien</strong>:</p><ul><li>Sehenswürdigkeit, Restaurant, Laden, Museum, Café</li><li>Bar, Park, Strandbad, Hotel, Veranstaltungsort, Aussichtspunkt</li></ul><p>Jede Kategorie hat eine eigene Farbe auf der Karte und in den Karten-Ansichten.</p>'
					: '<p>CityCorners offers <strong>11 categories</strong>:</p><ul><li>Sight, Restaurant, Shop, Museum, Café</li><li>Bar, Park, Beach, Hotel, Event Venue, Viewpoint</li></ul><p>Each category has its own color on the map and in card views.</p>',
				category: 'features',
				order: 6,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['kategorien', 'typen', 'filter'] : ['categories', 'types', 'filter'],
			},
			{
				id: 'faq-i18n',
				question: isDE ? 'Ist CityCorners mehrsprachig?' : 'Is CityCorners multilingual?',
				answer: isDE
					? '<p>Ja! CityCorners ist in <strong>Deutsch und Englisch</strong> verfügbar. Du kannst die Sprache jederzeit über den Sprachumschalter in der Navigation ändern. Die Einstellung wird lokal gespeichert.</p>'
					: '<p>Yes! CityCorners is available in <strong>German and English</strong>. You can change the language at any time via the language switcher in the navigation. The setting is saved locally.</p>',
				category: 'general',
				order: 7,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['sprache', 'deutsch', 'englisch'] : ['language', 'german', 'english'],
			},
			{
				id: 'faq-feedback',
				question: isDE ? 'Wie kann ich Feedback geben?' : 'How can I give feedback?',
				answer: isDE
					? '<p>Dein Feedback hilft uns, CityCorners zu verbessern:</p><ul><li>Nutze die <strong>Feedback-Seite</strong> im Menü, um Verbesserungsvorschläge, Fehlermeldungen oder neue Ort-Vorschläge einzureichen</li><li>Wir lesen jedes Feedback und arbeiten kontinuierlich an Verbesserungen</li></ul>'
					: '<p>Your feedback helps us improve CityCorners:</p><ul><li>Use the <strong>Feedback page</strong> in the menu to submit improvement suggestions, bug reports, or new location ideas</li><li>We read every piece of feedback and continuously work on improvements</li></ul>',
				category: 'general',
				order: 8,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['feedback', 'verbesserung', 'kontakt']
					: ['feedback', 'improvement', 'contact'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Daten', dataTypeEN: 'data' }),
		],
		features: [
			{
				id: 'feature-explore',
				title: isDE ? 'Orte entdecken' : 'Explore Places',
				description: isDE
					? 'Entdecke Sehenswürdigkeiten, Restaurants, Cafés und mehr in Konstanz am Bodensee'
					: 'Discover sights, restaurants, cafés, and more in Konstanz at Lake Constance',
				icon: '🏛️',
				category: 'core',
				highlights: isDE
					? ['11 Kategorien', 'Detailseiten mit Timeline', 'Farbcodierte Karten', 'Suche']
					: ['11 categories', 'Detail pages with timeline', 'Color-coded cards', 'Search'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-map',
				title: isDE ? 'Interaktive Karte' : 'Interactive Map',
				description: isDE
					? 'Leaflet-basierte Karte mit farbcodierten Markern für alle Kategorien'
					: 'Leaflet-based map with color-coded markers for all categories',
				icon: '🗺️',
				category: 'core',
				highlights: isDE
					? ['Farbcodierte Marker', 'Kategorie-Filter', 'Detailansicht per Klick', 'Mini-Karte']
					: ['Color-coded markers', 'Category filters', 'Detail view on click', 'Mini-map'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-favorites',
				title: isDE ? 'Favoriten' : 'Favorites',
				description: isDE
					? 'Speichere deine Lieblingsorte und finde sie schnell wieder'
					: 'Save your favorite places and find them quickly',
				icon: '❤️',
				category: 'core',
				highlights: isDE
					? ['Herz-Button', 'Optimistische Updates', 'Dedizierte Ansicht']
					: ['Heart button', 'Optimistic updates', 'Dedicated view'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-add',
				title: isDE ? 'Orte hinzufügen' : 'Add Locations',
				description: isDE
					? 'Trage neue Orte bei — mit Web-Lookup für automatische Informationsextraktion'
					: 'Contribute new locations — with web lookup for automatic information extraction',
				icon: '➕',
				category: 'core',
				highlights: isDE
					? ['Web-Lookup', 'Auto-Extraktion', '11 Kategorien', 'Bearbeiten']
					: ['Web lookup', 'Auto extraction', '11 categories', 'Editing'],
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-timeline',
				title: 'Timeline',
				description: isDE
					? 'Historische Ereignisse und Meilensteine für jeden Ort'
					: 'Historical events and milestones for every location',
				icon: '📅',
				category: 'advanced',
				highlights: isDE
					? ['Historische Ereignisse', 'Gründungsjahre', 'Meilensteine']
					: ['Historical events', 'Founding years', 'Milestones'],
				content: '',
				order: 5,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-i18n',
				title: isDE ? 'Mehrsprachig' : 'Multilingual',
				description: isDE
					? 'Verfügbar in Deutsch und Englisch mit einfachem Sprachumschalter'
					: 'Available in German and English with easy language switcher',
				icon: '🌍',
				category: 'core',
				highlights: isDE
					? ['Deutsch & Englisch', 'Sofort umschaltbar', 'Lokal gespeichert']
					: ['German & English', 'Instant switching', 'Locally saved'],
				content: '',
				order: 6,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-pwa',
				title: isDE ? 'Progressive Web App' : 'Progressive Web App',
				description: isDE
					? 'Installierbar auf jedem Gerät — mit Offline-Fallback und Service Worker'
					: 'Installable on any device — with offline fallback and service worker',
				icon: '📱',
				category: 'advanced',
				highlights: isDE
					? ['Installierbar', 'Offline-Fallback', 'Service Worker Caching']
					: ['Installable', 'Offline fallback', 'Service worker caching'],
				content: '',
				order: 7,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-settings',
				title: isDE ? 'Einstellungen' : 'Settings',
				description: isDE
					? 'Passe CityCorners an — Theme-Modus, Theme-Variante und Kontoeinstellungen'
					: 'Customize CityCorners — theme mode, theme variant, and account settings',
				icon: '⚙️',
				category: 'core',
				highlights: isDE
					? ['Hell/Dunkel-Modus', 'Theme-Varianten', 'Kontoeinstellungen']
					: ['Light/Dark mode', 'Theme variants', 'Account settings'],
				content: '',
				order: 8,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-reviews',
				title: isDE ? 'Bewertungen' : 'Reviews',
				description: isDE
					? 'Bewerte Orte und lies Bewertungen anderer Nutzer'
					: 'Rate locations and read reviews from other users',
				icon: '⭐',
				category: 'core',
				highlights: isDE
					? ['Sternebewertung', 'Textbewertungen', 'Community-Feedback']
					: ['Star ratings', 'Text reviews', 'Community feedback'],
				content: '',
				order: 9,
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um CityCorners. Nutze auch die Feedback-Funktion im Menü, um uns direkt Verbesserungsvorschläge oder neue Ort-Vorschläge zu schicken.</p>'
				: '<p>Our support team is here to help you with any questions about CityCorners. You can also use the feedback feature in the menu to send us improvement suggestions or new location ideas directly.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
