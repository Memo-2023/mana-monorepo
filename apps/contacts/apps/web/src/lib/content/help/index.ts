/**
 * Help content for Contacts app
 * Uses @manacore/shared-help-types for type-safe content definition
 */

import type { HelpContent } from '@manacore/shared-help-types';

export function getContactsHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-import',
				question: isDE
					? 'Wie importiere ich Kontakte aus Google?'
					: 'How do I import contacts from Google?',
				answer: isDE
					? '<p>Um Kontakte aus Google zu importieren: Gehe zu <strong>Daten > Import</strong>, wähle Google Kontakte, melde dich bei deinem Google-Konto an, wähle die Kontakte aus und klicke auf <strong>Importieren</strong>.</p>'
					: '<p>To import contacts from Google: Go to <strong>Data > Import</strong>, select Google Contacts, sign in to your Google account, select the contacts you want to import, and click <strong>Import</strong>.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['import', 'google', 'kontakte'] : ['import', 'google', 'contacts'],
			},
			{
				id: 'faq-export',
				question: isDE ? 'Wie exportiere ich meine Kontakte?' : 'How do I export my contacts?',
				answer: isDE
					? '<p>Du kannst deine Kontakte in verschiedenen Formaten exportieren: Gehe zu <strong>Daten > Export</strong>, wähle das gewünschte Format (vCard, CSV, JSON) und klicke auf <strong>Exportieren</strong>.</p>'
					: '<p>You can export your contacts in various formats: Go to <strong>Data > Export</strong>, select the desired format (vCard, CSV, JSON), and click <strong>Export</strong>.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['export', 'vcard', 'csv'] : ['export', 'vcard', 'csv'],
			},
			{
				id: 'faq-duplicates',
				question: isDE ? 'Wie finde ich doppelte Kontakte?' : 'How do I find duplicate contacts?',
				answer: isDE
					? '<p>Wir erkennen automatisch potenzielle Duplikate. Gehe zu <strong>Duplikate</strong> in der Seitenleiste, überprüfe die Vorschläge und wähle <strong>Zusammenführen</strong> oder <strong>Ignorieren</strong>.</p>'
					: '<p>We automatically detect potential duplicates. Go to <strong>Duplicates</strong> in the sidebar, review the suggestions, and choose to <strong>Merge</strong> or <strong>Ignore</strong>.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['duplikate', 'zusammenführen'] : ['duplicates', 'merge'],
			},
			{
				id: 'faq-subscription',
				question: isDE ? 'Wie kann ich mein Abo kündigen?' : 'How do I cancel my subscription?',
				answer: isDE
					? '<p>Du kannst dein Abo jederzeit kündigen: Gehe zu <strong>Einstellungen > Abonnement > Abo verwalten > Abo kündigen</strong>. Dein Abo bleibt bis zum Ende des Abrechnungszeitraums aktiv.</p>'
					: '<p>You can cancel your subscription at any time: Go to <strong>Settings > Subscription > Manage Subscription > Cancel Subscription</strong>. Your subscription will remain active until the end of the billing period.</p>',
				category: 'billing',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['abo', 'kündigung', 'abrechnung'] : ['subscription', 'cancel', 'billing'],
			},
			{
				id: 'faq-privacy',
				question: isDE ? 'Wie werden meine Daten geschützt?' : 'How is my data protected?',
				answer: isDE
					? '<p>Wir nehmen deinen Datenschutz ernst:</p><ul><li><strong>Verschlüsselung</strong>: Alle Daten werden bei der Übertragung (TLS) und im Ruhezustand verschlüsselt</li><li><strong>DSGVO-konform</strong>: Wir halten uns an die EU-Datenschutzverordnung</li><li><strong>Kein Datenverkauf</strong>: Wir verkaufen niemals deine persönlichen Daten</li><li><strong>Datenexport</strong>: Du kannst jederzeit alle deine Daten exportieren</li><li><strong>Kontolöschung</strong>: Du kannst dein Konto und alle Daten dauerhaft löschen</li></ul>'
					: '<p>We take your privacy seriously:</p><ul><li><strong>Encryption</strong>: All data is encrypted in transit (TLS) and at rest</li><li><strong>GDPR Compliant</strong>: We follow EU data protection regulations</li><li><strong>No Data Selling</strong>: We never sell your personal data</li><li><strong>Data Export</strong>: You can export all your data at any time</li><li><strong>Account Deletion</strong>: You can permanently delete your account and all data</li></ul>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE ? ['datenschutz', 'dsgvo', 'sicherheit'] : ['privacy', 'gdpr', 'security'],
			},
		],
		features: [
			{
				id: 'feature-management',
				title: isDE ? 'Kontaktverwaltung' : 'Contact Management',
				description: isDE
					? 'Verwalte alle deine Kontakte an einem Ort'
					: 'Manage all your contacts in one place',
				icon: '👥',
				category: 'core',
				highlights: isDE
					? ['Unbegrenzte Kontakte', 'Benutzerdefinierte Felder', 'Tags und Kategorien']
					: ['Unlimited contacts', 'Custom fields', 'Tags and categories'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-import-export',
				title: 'Import & Export',
				description: isDE
					? 'Importiere und exportiere Kontakte in verschiedenen Formaten'
					: 'Import and export contacts in various formats',
				icon: '📤',
				category: 'core',
				highlights: isDE
					? ['Google Kontakte Sync', 'vCard Import/Export', 'CSV Import/Export']
					: ['Google Contacts sync', 'vCard import/export', 'CSV import/export'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-duplicates',
				title: isDE ? 'Duplikat-Erkennung' : 'Duplicate Detection',
				description: isDE
					? 'Automatische Erkennung und Zusammenführung von Duplikaten'
					: 'Automatic detection and merging of duplicates',
				icon: '🔍',
				category: 'advanced',
				highlights: isDE
					? ['Intelligente Erkennung', 'Ein-Klick Zusammenführung', 'Überprüfungsmodus']
					: ['Smart detection', 'One-click merge', 'Review mode'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-favorites',
				title: isDE ? 'Favoriten' : 'Favorites',
				description: isDE
					? 'Markiere wichtige Kontakte als Favoriten'
					: 'Mark important contacts as favorites',
				icon: '⭐',
				category: 'core',
				highlights: isDE
					? ['Schnellzugriff', 'Verschiedene Ansichten', 'Sortierung']
					: ['Quick access', 'Multiple views', 'Sorting'],
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
		],
		shortcuts: [
			{
				id: 'shortcuts-general',
				category: 'general',
				title: isDE ? 'Allgemein' : 'General',
				language: isDE ? 'de' : 'en',
				order: 1,
				shortcuts: [
					{
						shortcut: 'Cmd/Ctrl + K',
						action: isDE ? 'Suche öffnen' : 'Open search',
					},
					{
						shortcut: 'Cmd/Ctrl + N',
						action: isDE ? 'Neuer Kontakt' : 'New contact',
					},
					{
						shortcut: 'Cmd/Ctrl + 1-6',
						action: isDE ? 'Navigation' : 'Navigation',
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen.</p>'
				: '<p>Our support team is here to help you with any questions or issues.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
