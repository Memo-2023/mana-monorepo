/**
 * Help content for Presi app
 */

import type { HelpContent } from '@manacore/shared-help-types';

export function getPresiHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-create',
				question: isDE ? 'Wie erstelle ich eine Präsentation?' : 'How do I create a presentation?',
				answer: isDE
					? '<p>Eine neue Präsentation erstellen ist einfach:</p><ol><li>Klicke auf <strong>Neue Präsentation</strong></li><li>Wähle ein Theme oder starte mit einer leeren Vorlage</li><li>Füge Folien hinzu mit dem <strong>+</strong> Button</li><li>Bearbeite Inhalte direkt im Slide-Editor</li></ol><p>Du kannst Text, Bilder, Code-Blöcke und mehr zu jeder Folie hinzufügen.</p>'
					: '<p>Creating a new presentation is easy:</p><ol><li>Click <strong>New Presentation</strong></li><li>Choose a theme or start with a blank template</li><li>Add slides with the <strong>+</strong> button</li><li>Edit content directly in the slide editor</li></ol><p>You can add text, images, code blocks, and more to each slide.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: ['create', 'presentation', 'slides', 'new'],
			},
			{
				id: 'faq-present',
				question: isDE ? 'Wie halte ich eine Präsentation?' : 'How do I present?',
				answer: isDE
					? '<p>Starte den Präsentationsmodus:</p><ol><li>Klicke auf <strong>Präsentieren</strong> oder drücke <kbd>F</kbd> für Vollbild</li><li>Navigiere mit <kbd>→</kbd> oder <kbd>Leertaste</kbd> zur nächsten Folie</li><li>Gehe mit <kbd>←</kbd> oder <kbd>A</kbd> zur vorherigen Folie</li><li>Drücke <kbd>ESC</kbd> um den Präsentationsmodus zu verlassen</li></ol><p>Im Präsentationsmodus werden alle Steuerelemente ausgeblendet.</p>'
					: '<p>Start the presentation mode:</p><ol><li>Click <strong>Present</strong> or press <kbd>F</kbd> for fullscreen</li><li>Navigate with <kbd>→</kbd> or <kbd>Space</kbd> to the next slide</li><li>Go back with <kbd>←</kbd> or <kbd>A</kbd> to the previous slide</li><li>Press <kbd>ESC</kbd> to exit presentation mode</li></ol><p>In presentation mode, all controls are hidden for a clean view.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: ['present', 'fullscreen', 'navigation', 'keyboard'],
			},
			{
				id: 'faq-sharing',
				question: isDE ? 'Wie funktioniert das Teilen?' : 'How does sharing work?',
				answer: isDE
					? '<p>Teile deine Präsentationen auf verschiedene Arten:</p><ul><li><strong>Link teilen</strong> — Erstelle einen öffentlichen oder privaten Link</li><li><strong>PDF Export</strong> — Exportiere als PDF zum Offline-Anschauen</li><li><strong>Einbetten</strong> — Bette die Präsentation in eine Webseite ein</li></ul><p>Du kannst festlegen, ob Betrachter die Folien herunterladen dürfen.</p>'
					: '<p>Share your presentations in different ways:</p><ul><li><strong>Share link</strong> — Create a public or private link</li><li><strong>PDF Export</strong> — Export as PDF for offline viewing</li><li><strong>Embed</strong> — Embed the presentation in a website</li></ul><p>You can control whether viewers are allowed to download the slides.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: ['sharing', 'link', 'pdf', 'export', 'embed'],
			},
			{
				id: 'faq-themes',
				question: isDE ? 'Welche Themes gibt es?' : 'What themes are available?',
				answer: isDE
					? '<p>Presi bietet verschiedene Themes für unterschiedliche Anlässe:</p><ul><li><strong>Professional</strong> — Klar und geschäftlich</li><li><strong>Creative</strong> — Bunt und ausdrucksstark</li><li><strong>Minimal</strong> — Schlicht und elegant</li><li><strong>Dark</strong> — Dunkles Design für Präsentationen in dunklen Räumen</li></ul><p>Jedes Theme kann mit eigenen Farben und Schriftarten angepasst werden.</p>'
					: '<p>Presi offers different themes for different occasions:</p><ul><li><strong>Professional</strong> — Clean and business-oriented</li><li><strong>Creative</strong> — Colorful and expressive</li><li><strong>Minimal</strong> — Simple and elegant</li><li><strong>Dark</strong> — Dark design for presentations in dim rooms</li></ul><p>Each theme can be customized with your own colors and fonts.</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: ['themes', 'design', 'customization', 'styles'],
			},
			{
				id: 'faq-privacy',
				question: isDE ? 'Wie werden meine Daten geschützt?' : 'How is my data protected?',
				answer: isDE
					? '<p>Deine Präsentationen sind sicher bei Presi:</p><ul><li>Alle Daten werden verschlüsselt übertragen und gespeichert</li><li>Geteilte Links können jederzeit widerrufen werden</li><li>Du bestimmst, wer Zugriff auf deine Präsentationen hat</li><li>Gelöschte Präsentationen werden dauerhaft entfernt</li></ul>'
					: '<p>Your presentations are safe with Presi:</p><ul><li>All data is encrypted in transit and at rest</li><li>Shared links can be revoked at any time</li><li>You control who has access to your presentations</li><li>Deleted presentations are permanently removed</li></ul>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				tags: ['privacy', 'security', 'data', 'sharing'],
			},
		],
		features: [
			{
				id: 'feature-editor',
				title: isDE ? 'Folien-Editor' : 'Slide Editor',
				description: isDE
					? 'Ein leistungsstarker Editor zum Erstellen schöner Folien mit Text, Bildern und Code.'
					: 'A powerful editor for creating beautiful slides with text, images, and code.',
				icon: '✏️',
				category: 'core',
				highlights: isDE
					? ['Rich-Text-Bearbeitung', 'Bilder & Medien', 'Code-Blöcke']
					: ['Rich text editing', 'Images & media', 'Code blocks'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-present',
				title: isDE ? 'Präsentationsmodus' : 'Presentation Mode',
				description: isDE
					? 'Halte Präsentationen im Vollbildmodus mit Tastatursteuerung.'
					: 'Deliver presentations in fullscreen mode with keyboard navigation.',
				icon: '🎬',
				category: 'core',
				highlights: isDE
					? ['Vollbild', 'Tastatursteuerung', 'Saubere Ansicht']
					: ['Fullscreen', 'Keyboard controls', 'Clean view'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-sharing',
				title: isDE ? 'Teilen' : 'Sharing',
				description: isDE
					? 'Teile Präsentationen per Link, exportiere als PDF oder bette sie in Webseiten ein.'
					: 'Share presentations via link, export as PDF, or embed them in websites.',
				icon: '🔗',
				category: 'core',
				highlights: isDE
					? ['Öffentliche Links', 'PDF-Export', 'Einbettung']
					: ['Public links', 'PDF export', 'Embedding'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-themes',
				title: isDE ? 'Themes' : 'Themes',
				description: isDE
					? 'Wähle aus verschiedenen professionellen Themes und passe sie an dein Branding an.'
					: 'Choose from various professional themes and customize them to match your branding.',
				icon: '🎨',
				category: 'advanced',
				highlights: isDE
					? ['Mehrere Themes', 'Anpassbare Farben', 'Eigene Schriftarten']
					: ['Multiple themes', 'Customizable colors', 'Custom fonts'],
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
		],
		shortcuts: [
			{
				id: 'shortcuts-navigation',
				title: isDE ? 'Navigation' : 'Navigation',
				category: 'navigation',
				shortcuts: [
					{
						keys: ['←', 'A'],
						label: isDE ? 'Vorherige Folie' : 'Previous slide',
					},
					{
						keys: ['→', 'D', 'Space'],
						label: isDE ? 'Nächste Folie' : 'Next slide',
					},
					{
						keys: ['F'],
						label: isDE ? 'Vollbild' : 'Fullscreen',
					},
					{
						keys: ['ESC'],
						label: isDE ? 'Präsentation beenden' : 'Exit presentation',
					},
				],
			},
		],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: isDE ? 'Support kontaktieren' : 'Contact Support',
			content: isDE
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Presi.</p>'
				: '<p>Our support team is here to help you with any questions about Presi.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
