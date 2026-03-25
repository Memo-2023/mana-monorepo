/**
 * Help content for ManaDeck app
 */

import type { HelpContent } from '@manacore/shared-help-types';

export function getManaDeckHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-create-decks',
				question: isDE ? 'Wie erstelle ich Decks und Karten?' : 'How do I create decks and cards?',
				answer: isDE
					? '<p>So erstellst du Decks und Karten in ManaDeck:</p><ol><li>Klicke auf <strong>Neues Deck</strong> und gib einen Namen und eine Beschreibung ein</li><li>Öffne das Deck und klicke auf <strong>Karte hinzufügen</strong></li><li>Gib die <strong>Vorderseite</strong> (Frage) und <strong>Rückseite</strong> (Antwort) ein</li><li>Optional: Füge Bilder, Tags oder Notizen hinzu</li></ol><p>Du kannst auch mehrere Karten auf einmal importieren — siehe Import & Export.</p>'
					: '<p>Here is how to create decks and cards in ManaDeck:</p><ol><li>Click <strong>New Deck</strong> and enter a name and description</li><li>Open the deck and click <strong>Add Card</strong></li><li>Enter the <strong>front</strong> (question) and <strong>back</strong> (answer)</li><li>Optional: Add images, tags, or notes</li></ol><p>You can also import multiple cards at once — see Import & Export.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['deck', 'karten', 'erstellen'] : ['deck', 'cards', 'create'],
			},
			{
				id: 'faq-spaced-repetition',
				question: isDE ? 'Wie funktioniert Spaced Repetition?' : 'How does spaced repetition work?',
				answer: isDE
					? '<p><strong>Spaced Repetition</strong> (verteiltes Wiederholen) ist eine wissenschaftlich fundierte Lernmethode:</p><ul><li>Karten, die du <strong>gut kannst</strong>, werden in größeren Abständen gezeigt</li><li>Karten, die du <strong>noch lernst</strong>, erscheinen häufiger</li><li>Der Algorithmus passt sich automatisch an dein Lerntempo an</li><li>Nach jeder Wiederholung bewertest du dein Wissen: <strong>Nochmal</strong>, <strong>Schwer</strong>, <strong>Gut</strong> oder <strong>Leicht</strong></li></ul><p>So lernst du effizienter und behältst Wissen langfristig.</p>'
					: '<p><strong>Spaced repetition</strong> is a scientifically proven learning method:</p><ul><li>Cards you <strong>know well</strong> are shown at increasing intervals</li><li>Cards you are <strong>still learning</strong> appear more frequently</li><li>The algorithm automatically adapts to your learning pace</li><li>After each review, rate your knowledge: <strong>Again</strong>, <strong>Hard</strong>, <strong>Good</strong>, or <strong>Easy</strong></li></ul><p>This way you learn more efficiently and retain knowledge long-term.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['spaced-repetition', 'lernen', 'algorithmus', 'wiederholen']
					: ['spaced-repetition', 'learning', 'algorithm', 'review'],
			},
			{
				id: 'faq-study-sessions',
				question: isDE ? 'Wie starte ich eine Lernsitzung?' : 'How do I start a study session?',
				answer: isDE
					? '<p>So startest du eine Lernsitzung:</p><ol><li>Wähle ein Deck aus deiner Bibliothek</li><li>Klicke auf <strong>Lernen</strong> — die fälligen Karten werden automatisch ausgewählt</li><li>Für jede Karte: Lies die Frage, überlege die Antwort, decke die Rückseite auf</li><li>Bewerte dein Wissen mit den Buttons: Nochmal, Schwer, Gut, Leicht</li></ol><p>ManaDeck zeigt dir an, wie viele Karten <strong>neu</strong>, <strong>fällig</strong> und <strong>zu wiederholen</strong> sind.</p>'
					: '<p>Here is how to start a study session:</p><ol><li>Select a deck from your library</li><li>Click <strong>Study</strong> — due cards are automatically selected</li><li>For each card: Read the question, think of the answer, reveal the back</li><li>Rate your knowledge with the buttons: Again, Hard, Good, Easy</li></ol><p>ManaDeck shows you how many cards are <strong>new</strong>, <strong>due</strong>, and <strong>to review</strong>.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['lernen', 'sitzung', 'wiederholen'] : ['study', 'session', 'review'],
			},
			{
				id: 'faq-import-export',
				question: isDE
					? 'Kann ich Karten importieren und exportieren?'
					: 'Can I import and export cards?',
				answer: isDE
					? '<p>ManaDeck unterstützt verschiedene Import- und Exportformate:</p><ul><li><strong>CSV</strong>: Importiere Karten aus Tabellenkalkulationen (Vorderseite, Rückseite, Tags)</li><li><strong>Anki-Format</strong>: Importiere bestehende Anki-Decks (.apkg)</li><li><strong>JSON</strong>: Für programmatischen Zugriff und Backup</li><li><strong>Export</strong>: Exportiere einzelne Decks oder deine gesamte Bibliothek</li></ul>'
					: '<p>ManaDeck supports various import and export formats:</p><ul><li><strong>CSV</strong>: Import cards from spreadsheets (front, back, tags)</li><li><strong>Anki format</strong>: Import existing Anki decks (.apkg)</li><li><strong>JSON</strong>: For programmatic access and backup</li><li><strong>Export</strong>: Export individual decks or your entire library</li></ul>',
				category: 'technical',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['import', 'export', 'csv', 'anki'] : ['import', 'export', 'csv', 'anki'],
			},
			{
				id: 'faq-privacy',
				question: isDE ? 'Wie werden meine Daten geschützt?' : 'How is my data protected?',
				answer: isDE
					? '<p>Deine Daten sind sicher:</p><ul><li><strong>Verschlüsselung</strong>: Alle Daten werden bei der Übertragung (TLS) verschlüsselt</li><li><strong>DSGVO-konform</strong>: Wir halten uns an die EU-Datenschutzverordnung</li><li><strong>Kein Datenverkauf</strong>: Deine Lernkarten und Fortschritte werden nie an Dritte verkauft</li><li><strong>Datenexport</strong>: Du kannst jederzeit alle Decks und Karten exportieren</li></ul>'
					: '<p>Your data is secure:</p><ul><li><strong>Encryption</strong>: All data is encrypted in transit (TLS)</li><li><strong>GDPR compliant</strong>: We follow EU data protection regulations</li><li><strong>No data selling</strong>: Your flashcards and progress are never sold to third parties</li><li><strong>Data export</strong>: You can export all decks and cards at any time</li></ul>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE ? ['datenschutz', 'dsgvo', 'sicherheit'] : ['privacy', 'gdpr', 'security'],
			},
		],
		features: [
			{
				id: 'feature-deck-management',
				title: isDE ? 'Deck-Verwaltung' : 'Deck Management',
				description: isDE
					? 'Erstelle, organisiere und verwalte deine Karteikarten-Decks'
					: 'Create, organize, and manage your flashcard decks',
				icon: '🃏',
				category: 'core',
				highlights: isDE
					? ['Decks & Unterdecks', 'Tags & Kategorien', 'Bilder auf Karten', 'Deck-Statistiken']
					: ['Decks & sub-decks', 'Tags & categories', 'Images on cards', 'Deck statistics'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-spaced-repetition',
				title: 'Spaced Repetition',
				description: isDE
					? 'Wissenschaftlich fundierter Algorithmus für effizientes Lernen'
					: 'Scientifically proven algorithm for efficient learning',
				icon: '🧠',
				category: 'core',
				highlights: isDE
					? ['Adaptiver Algorithmus', 'Optimale Intervalle', 'Lernstatistiken', 'Tägliche Ziele']
					: ['Adaptive algorithm', 'Optimal intervals', 'Learning statistics', 'Daily goals'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-study-sessions',
				title: isDE ? 'Lernsitzungen' : 'Study Sessions',
				description: isDE
					? 'Starte fokussierte Lernsitzungen mit fälligen Karten'
					: 'Start focused study sessions with due cards',
				icon: '📖',
				category: 'core',
				highlights: isDE
					? ['Fällige Karten', 'Bewertungssystem', 'Fortschrittsanzeige', 'Sitzungsstatistiken']
					: ['Due cards', 'Rating system', 'Progress indicator', 'Session statistics'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-import-export',
				title: 'Import & Export',
				description: isDE
					? 'Importiere aus CSV, Anki und mehr — exportiere jederzeit'
					: 'Import from CSV, Anki, and more — export anytime',
				icon: '📦',
				category: 'advanced',
				highlights: isDE
					? ['CSV-Import', 'Anki-Kompatibilität', 'JSON-Export', 'Bibliotheks-Backup']
					: ['CSV import', 'Anki compatibility', 'JSON export', 'Library backup'],
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um ManaDeck.</p>'
				: '<p>Our support team is here to help you with any questions about ManaDeck.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
