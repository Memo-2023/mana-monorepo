/**
 * Help content for Manalink (Matrix) app
 */

import type { HelpContent } from '@manacore/help';
import { getPrivacyFAQs } from '@manacore/help';

export function getManalinkHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-what-is-matrix',
				question: isDE ? 'Was ist Matrix und Manalink?' : 'What is Matrix and Manalink?',
				answer: isDE
					? '<p>Manalink ist ein sicherer Messenger auf Basis des <strong>Matrix-Protokolls</strong> — einem dezentralen, offenen Standard für Kommunikation:</p><ul><li>Ende-zu-Ende-verschlüsselt</li><li>Dezentral — kein einzelner Server kontrolliert deine Daten</li><li>Kompatibel mit anderen Matrix-Clients (Element, FluffyChat, etc.)</li><li>Der Standard-Homeserver ist <code>matrix.mana.how</code></li></ul>'
					: '<p>Manalink is a secure messenger based on the <strong>Matrix protocol</strong> — a decentralized, open standard for communication:</p><ul><li>End-to-end encrypted</li><li>Decentralized — no single server controls your data</li><li>Compatible with other Matrix clients (Element, FluffyChat, etc.)</li><li>The default homeserver is <code>matrix.mana.how</code></li></ul>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['matrix', 'protokoll', 'dezentral'] : ['matrix', 'protocol', 'decentralized'],
			},
			{
				id: 'faq-login',
				question: isDE ? 'Wie melde ich mich an?' : 'How do I log in?',
				answer: isDE
					? '<p>Du kannst dich auf zwei Wegen anmelden:</p><ul><li><strong>Matrix-Konto</strong> — Benutzername und Passwort eines Matrix-Homeservers</li><li><strong>SSO über Mana Core</strong> — Anmeldung mit deinem ManaCore-Konto</li></ul><p>Der Standard-Homeserver ist <code>matrix.mana.how</code>, aber du kannst jeden beliebigen Matrix-Homeserver verwenden.</p>'
					: '<p>You can log in two ways:</p><ul><li><strong>Matrix account</strong> — Username and password from a Matrix homeserver</li><li><strong>SSO via Mana Core</strong> — Login with your ManaCore account</li></ul><p>The default homeserver is <code>matrix.mana.how</code>, but you can use any Matrix homeserver.</p>',
				category: 'getting-started',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['anmeldung', 'login', 'sso'] : ['login', 'auth', 'sso'],
			},
			{
				id: 'faq-rooms',
				question: isDE ? 'Wie funktionieren Räume?' : 'How do rooms work?',
				answer: isDE
					? '<p>Räume sind Chatgruppen in Matrix:</p><ul><li><strong>Direktnachrichten</strong> — 1:1 Gespräche</li><li><strong>Gruppenräume</strong> — Mehrere Teilnehmer</li><li>Du kannst Räume erstellen, beitreten und verwalten</li><li>Räume zeigen ungelesene Nachrichten und Highlight-Zähler an</li></ul>'
					: '<p>Rooms are chat groups in Matrix:</p><ul><li><strong>Direct messages</strong> — 1:1 conversations</li><li><strong>Group rooms</strong> — Multiple participants</li><li>You can create, join, and manage rooms</li><li>Rooms show unread message and highlight counters</li></ul>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['räume', 'chat', 'gruppen'] : ['rooms', 'chat', 'groups'],
			},
			{
				id: 'faq-messaging',
				question: isDE
					? 'Welche Nachrichtenfunktionen gibt es?'
					: 'What messaging features are available?',
				answer: isDE
					? '<p>Manalink bietet umfangreiche Nachrichtenfunktionen:</p><ul><li><strong>Textnachrichten</strong> senden und empfangen</li><li><strong>Tipp-Indikatoren</strong> — Sieh, wenn jemand gerade tippt</li><li><strong>Lesebestätigungen</strong> — Wisse, wann deine Nachricht gelesen wurde</li><li><strong>Nachrichtensuche</strong> — Durchsuche den Chatverlauf</li><li><strong>Paginierung</strong> — Lade ältere Nachrichten nach</li></ul>'
					: '<p>Manalink offers comprehensive messaging features:</p><ul><li><strong>Text messages</strong> — send and receive</li><li><strong>Typing indicators</strong> — See when someone is typing</li><li><strong>Read receipts</strong> — Know when your message was read</li><li><strong>Message search</strong> — Search through chat history</li><li><strong>Pagination</strong> — Load older messages</li></ul>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['nachrichten', 'tippen', 'lesen', 'suche']
					: ['messages', 'typing', 'read', 'search'],
			},
			{
				id: 'faq-encryption',
				question: isDE ? 'Sind meine Nachrichten verschlüsselt?' : 'Are my messages encrypted?',
				answer: isDE
					? '<p>Ja, Manalink unterstützt <strong>Ende-zu-Ende-Verschlüsselung (E2EE)</strong> über das Matrix-Protokoll:</p><ul><li>Verschlüsselte Räume sind nur für die Teilnehmer lesbar</li><li>Nicht einmal der Server kann die Nachrichten lesen</li><li>Die Verschlüsselung verwendet bewährte kryptographische Verfahren (Olm/Megolm)</li></ul>'
					: '<p>Yes, Manalink supports <strong>end-to-end encryption (E2EE)</strong> via the Matrix protocol:</p><ul><li>Encrypted rooms are only readable by participants</li><li>Not even the server can read the messages</li><li>Encryption uses proven cryptographic methods (Olm/Megolm)</li></ul>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['verschlüsselung', 'e2ee', 'sicherheit'] : ['encryption', 'e2ee', 'security'],
			},
			{
				id: 'faq-room-settings',
				question: isDE ? 'Wie verwalte ich Raumeinstellungen?' : 'How do I manage room settings?',
				answer: isDE
					? '<p>Jeder Raum hat eigene Einstellungen:</p><ul><li><strong>Name und Thema</strong> des Raums ändern</li><li><strong>Mitglieder</strong> einladen und verwalten</li><li><strong>Benachrichtigungen</strong> pro Raum konfigurieren</li></ul>'
					: '<p>Each room has its own settings:</p><ul><li>Change the <strong>name and topic</strong> of the room</li><li><strong>Invite and manage</strong> members</li><li>Configure <strong>notifications</strong> per room</li></ul>',
				category: 'features',
				order: 6,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['einstellungen', 'raum', 'mitglieder'] : ['settings', 'room', 'members'],
			},
			{
				id: 'faq-bots',
				question: isDE ? 'Was sind Bots?' : 'What are bots?',
				answer: isDE
					? '<p>Unter <strong>Bots</strong> findest du automatisierte Assistenten, die in Räumen helfen können. Bots können Aufgaben automatisieren, Informationen bereitstellen und den Chat bereichern.</p>'
					: '<p>Under <strong>Bots</strong> you can find automated assistants that can help in rooms. Bots can automate tasks, provide information, and enrich the chat experience.</p>',
				category: 'features',
				order: 7,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['bots', 'automatisierung', 'assistenten']
					: ['bots', 'automation', 'assistants'],
			},
			{
				id: 'faq-pwa',
				question: isDE
					? 'Kann ich Manalink auf dem Handy nutzen?'
					: 'Can I use Manalink on my phone?',
				answer: isDE
					? '<p>Ja! Manalink ist eine <strong>Progressive Web App (PWA)</strong>:</p><ul><li>Öffne die App im Browser und tippe auf <strong>"Zum Startbildschirm hinzufügen"</strong></li><li>Funktioniert auch offline dank Service Worker Caching</li><li>Push-Benachrichtigungen für neue Nachrichten</li><li>Vollbild-App-Erfahrung ohne Browser-Leiste</li></ul>'
					: '<p>Yes! Manalink is a <strong>Progressive Web App (PWA)</strong>:</p><ul><li>Open the app in your browser and tap <strong>"Add to Home Screen"</strong></li><li>Works offline thanks to service worker caching</li><li>Push notifications for new messages</li><li>Fullscreen app experience without browser bar</li></ul>',
				category: 'getting-started',
				order: 8,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['pwa', 'mobil', 'installieren'] : ['pwa', 'mobile', 'install'],
			},
			{
				id: 'faq-feedback',
				question: isDE ? 'Wie kann ich Feedback geben?' : 'How can I give feedback?',
				answer: isDE
					? '<p>Dein Feedback hilft uns, Manalink zu verbessern:</p><ul><li>Nutze die <strong>Feedback-Seite</strong> im Menü, um Verbesserungsvorschläge, Fehlermeldungen oder Feature-Wünsche einzureichen</li><li>Wir lesen jedes Feedback und arbeiten kontinuierlich an Verbesserungen</li></ul>'
					: '<p>Your feedback helps us improve Manalink:</p><ul><li>Use the <strong>Feedback page</strong> in the menu to submit improvement suggestions, bug reports, or feature requests</li><li>We read every piece of feedback and continuously work on improvements</li></ul>',
				category: 'general',
				order: 9,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['feedback', 'verbesserung', 'kontakt']
					: ['feedback', 'improvement', 'contact'],
			},
			...getPrivacyFAQs(locale, {
				dataTypeDE: 'Nachrichten',
				dataTypeEN: 'messages',
				extraBulletsDE: [
					'<strong>Ende-zu-Ende-Verschlüsselung</strong>: Verschlüsselte Räume sind nur für Teilnehmer lesbar — nicht einmal der Server kann mitlesen',
				],
				extraBulletsEN: [
					'<strong>End-to-end encryption</strong>: Encrypted rooms are only readable by participants — not even the server can read them',
				],
			}),
		],
		features: [
			{
				id: 'feature-messaging',
				title: isDE ? 'Sichere Nachrichten' : 'Secure Messaging',
				description: isDE
					? 'Ende-zu-Ende-verschlüsselte Nachrichten über das dezentrale Matrix-Protokoll'
					: 'End-to-end encrypted messaging via the decentralized Matrix protocol',
				icon: '🔒',
				category: 'core',
				highlights: isDE
					? [
							'E2E-Verschlüsselung',
							'Direktnachrichten & Gruppen',
							'Lesebestätigungen',
							'Tipp-Indikatoren',
						]
					: ['E2E encryption', 'Direct messages & groups', 'Read receipts', 'Typing indicators'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-rooms',
				title: isDE ? 'Räume' : 'Rooms',
				description: isDE
					? 'Erstelle und verwalte Räume für Direktnachrichten und Gruppen'
					: 'Create and manage rooms for direct messages and groups',
				icon: '💬',
				category: 'core',
				highlights: isDE
					? ['Raum erstellen', 'Raumeinstellungen', 'Mitgliederverwaltung', 'Ungelesen-Zähler']
					: ['Create rooms', 'Room settings', 'Member management', 'Unread counter'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-search',
				title: isDE ? 'Nachrichtensuche' : 'Message Search',
				description: isDE
					? 'Durchsuche den Chatverlauf nach Nachrichten und Inhalten'
					: 'Search through chat history for messages and content',
				icon: '🔍',
				category: 'core',
				highlights: isDE
					? ['Volltextsuche', 'Raum-übergreifend', 'Schnelle Ergebnisse']
					: ['Full-text search', 'Cross-room', 'Quick results'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-sso',
				title: isDE ? 'SSO-Anmeldung' : 'SSO Login',
				description: isDE
					? 'Melde dich mit deinem ManaCore-Konto an — kein separates Matrix-Passwort nötig'
					: 'Sign in with your ManaCore account — no separate Matrix password needed',
				icon: '🔐',
				category: 'core',
				highlights: isDE
					? ['ManaCore SSO', 'Ein-Klick-Login', 'Sicher', 'Passwort-Login']
					: ['ManaCore SSO', 'One-click login', 'Secure', 'Password login'],
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-bots',
				title: 'Bots',
				description: isDE
					? 'Automatisierte Assistenten für Aufgaben und Informationen in Räumen'
					: 'Automated assistants for tasks and information in rooms',
				icon: '🤖',
				category: 'advanced',
				highlights: isDE
					? ['Chat-Assistenten', 'Automatisierung', 'Informationsdienste']
					: ['Chat assistants', 'Automation', 'Information services'],
				content: '',
				order: 5,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-pwa',
				title: isDE ? 'Progressive Web App' : 'Progressive Web App',
				description: isDE
					? 'Installierbar auf jedem Gerät — offline-fähig und mit Push-Benachrichtigungen'
					: 'Installable on any device — works offline and supports push notifications',
				icon: '📱',
				category: 'core',
				highlights: isDE
					? ['Installierbar', 'Offline-fähig', 'Push-Benachrichtigungen', 'Vollbild']
					: ['Installable', 'Works offline', 'Push notifications', 'Fullscreen'],
				content: '',
				order: 6,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-federation',
				title: isDE ? 'Föderation' : 'Federation',
				description: isDE
					? 'Kommuniziere mit Nutzern auf anderen Matrix-Homeservern'
					: 'Communicate with users on other Matrix homeservers',
				icon: '🌐',
				category: 'advanced',
				highlights: isDE
					? ['Server-übergreifend', 'Offenes Protokoll', 'Element-kompatibel']
					: ['Cross-server', 'Open protocol', 'Element-compatible'],
				content: '',
				order: 7,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-settings',
				title: isDE ? 'Einstellungen' : 'Settings',
				description: isDE
					? 'Passe Manalink an — Themes, Benachrichtigungen und Kontoeinstellungen'
					: 'Customize Manalink — themes, notifications, and account settings',
				icon: '⚙️',
				category: 'core',
				highlights: isDE
					? ['Hell/Dunkel-Modus', 'Benachrichtigungen', 'Kontoeinstellungen']
					: ['Light/Dark mode', 'Notifications', 'Account settings'],
				content: '',
				order: 8,
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Manalink. Nutze auch die Feedback-Funktion im Menü, um uns direkt Verbesserungsvorschläge zu schicken.</p>'
				: '<p>Our support team is here to help you with any questions about Manalink. You can also use the feedback feature in the menu to send us improvement suggestions directly.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
