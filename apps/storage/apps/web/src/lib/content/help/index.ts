/**
 * Help content for Storage app
 */

import type { HelpContent } from '@manacore/shared-help-types';

export function getStorageHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-upload',
				question: isDE ? 'Wie lade ich Dateien hoch?' : 'How do I upload files?',
				answer: isDE
					? '<p>Du kannst Dateien auf verschiedene Arten hochladen:</p><ul><li><strong>Drag & Drop</strong>: Ziehe Dateien direkt in den Browser</li><li><strong>Upload-Button</strong>: Klicke auf das Upload-Symbol in der Toolbar</li><li>Es können bis zu 10 Dateien gleichzeitig hochgeladen werden (max. 100 MB pro Datei)</li></ul>'
					: '<p>You can upload files in several ways:</p><ul><li><strong>Drag & drop</strong>: Drag files directly into the browser</li><li><strong>Upload button</strong>: Click the upload icon in the toolbar</li><li>Up to 10 files can be uploaded simultaneously (max 100 MB per file)</li></ul>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['hochladen', 'upload', 'dateien'] : ['upload', 'files', 'drag-drop'],
			},
			{
				id: 'faq-share',
				question: isDE ? 'Wie teile ich Dateien mit anderen?' : 'How do I share files?',
				answer: isDE
					? '<p>Um eine Datei oder einen Ordner zu teilen:</p><ul><li>Rechtsklick auf die Datei und wähle <strong>Teilen</strong></li><li>Ein Share-Link wird erstellt, den du kopieren kannst</li><li>Optional: Setze ein <strong>Passwort</strong>, ein <strong>Ablaufdatum</strong> oder ein <strong>Download-Limit</strong></li><li>Geteilte Links können jederzeit widerrufen werden</li></ul>'
					: '<p>To share a file or folder:</p><ul><li>Right-click the file and select <strong>Share</strong></li><li>A share link will be created that you can copy</li><li>Optional: Set a <strong>password</strong>, <strong>expiration date</strong>, or <strong>download limit</strong></li><li>Shared links can be revoked at any time</li></ul>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['teilen', 'link', 'freigabe'] : ['share', 'link', 'access'],
			},
			{
				id: 'faq-versions',
				question: isDE ? 'Wie funktioniert die Versionierung?' : 'How does versioning work?',
				answer: isDE
					? '<p>Jede Datei unterstützt automatische Versionierung:</p><ul><li>Lade eine neue Version hoch, um die Datei zu aktualisieren</li><li>Alle vorherigen Versionen bleiben erhalten</li><li>Du kannst jederzeit ältere Versionen herunterladen</li><li>Jede Version zeigt Größe, Datum und optionalen Kommentar</li></ul>'
					: '<p>Every file supports automatic versioning:</p><ul><li>Upload a new version to update the file</li><li>All previous versions are preserved</li><li>You can download older versions at any time</li><li>Each version shows size, date, and optional comment</li></ul>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['version', 'historie', 'aktualisieren'] : ['version', 'history', 'update'],
			},
			{
				id: 'faq-trash',
				question: isDE ? 'Wie funktioniert der Papierkorb?' : 'How does the trash work?',
				answer: isDE
					? '<p>Gelöschte Dateien landen zunächst im Papierkorb:</p><ul><li>Im Papierkorb können Dateien <strong>wiederhergestellt</strong> werden</li><li>Einzelne Dateien oder der gesamte Papierkorb können <strong>endgültig gelöscht</strong> werden</li><li>Endgültig gelöschte Dateien können nicht wiederhergestellt werden</li></ul>'
					: '<p>Deleted files are moved to the trash first:</p><ul><li>Files in trash can be <strong>restored</strong></li><li>Individual files or the entire trash can be <strong>permanently deleted</strong></li><li>Permanently deleted files cannot be recovered</li></ul>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['papierkorb', 'löschen', 'wiederherstellen'] : ['trash', 'delete', 'restore'],
			},
			{
				id: 'faq-privacy',
				question: isDE ? 'Wie werden meine Dateien geschützt?' : 'How are my files protected?',
				answer: isDE
					? '<p>Deine Dateien sind sicher:</p><ul><li><strong>Verschlüsselung</strong>: Alle Daten werden bei der Übertragung (TLS) verschlüsselt</li><li><strong>Privat</strong>: Nur du hast Zugriff auf deine Dateien</li><li><strong>DSGVO-konform</strong>: Wir halten uns an die EU-Datenschutzverordnung</li><li><strong>Share-Kontrolle</strong>: Du bestimmst, wer Zugriff hat (Passwort, Ablauf, Limit)</li></ul>'
					: '<p>Your files are secure:</p><ul><li><strong>Encryption</strong>: All data is encrypted in transit (TLS)</li><li><strong>Private</strong>: Only you have access to your files</li><li><strong>GDPR Compliant</strong>: We follow EU data protection regulations</li><li><strong>Share control</strong>: You decide who has access (password, expiry, limits)</li></ul>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE ? ['datenschutz', 'sicherheit', 'dsgvo'] : ['privacy', 'security', 'gdpr'],
			},
		],
		features: [
			{
				id: 'feature-storage',
				title: isDE ? 'Cloud-Speicher' : 'Cloud Storage',
				description: isDE
					? 'Sichere Dateiablage mit Ordnerstruktur'
					: 'Secure file storage with folder structure',
				icon: '☁️',
				category: 'core',
				highlights: isDE
					? ['Drag & Drop Upload', 'Ordner-Hierarchie', 'Datei-Tags']
					: ['Drag & drop upload', 'Folder hierarchy', 'File tags'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-sharing',
				title: isDE ? 'Dateien teilen' : 'File Sharing',
				description: isDE ? 'Teile Dateien sicher per Link' : 'Share files securely via link',
				icon: '🔗',
				category: 'core',
				highlights: isDE
					? ['Passwortschutz', 'Ablaufdatum', 'Download-Limit']
					: ['Password protection', 'Expiration date', 'Download limit'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-versioning',
				title: isDE ? 'Versionierung' : 'Versioning',
				description: isDE
					? 'Automatische Versionskontrolle für alle Dateien'
					: 'Automatic version control for all files',
				icon: '📝',
				category: 'advanced',
				highlights: isDE
					? ['Versions-Historie', 'Kommentare', 'Ältere Versionen laden']
					: ['Version history', 'Comments', 'Download older versions'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-search',
				title: isDE ? 'Suche' : 'Search',
				description: isDE
					? 'Finde Dateien und Ordner blitzschnell'
					: 'Find files and folders instantly',
				icon: '🔍',
				category: 'core',
				highlights: isDE
					? ['Volltextsuche', 'Tag-Filter', 'Favoriten']
					: ['Full-text search', 'Tag filters', 'Favorites'],
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
		],
		shortcuts: [
			{
				id: 'shortcuts-nav',
				category: 'navigation',
				title: 'Navigation',
				language: isDE ? 'de' : 'en',
				order: 1,
				shortcuts: [
					{ shortcut: 'Cmd/Ctrl + K', action: isDE ? 'Suche öffnen' : 'Open search' },
					{ shortcut: 'Cmd/Ctrl + 1', action: isDE ? 'Dateien' : 'Files' },
					{ shortcut: 'Cmd/Ctrl + 2', action: isDE ? 'Geteilt' : 'Shared' },
					{ shortcut: 'Cmd/Ctrl + 3', action: isDE ? 'Favoriten' : 'Favorites' },
					{ shortcut: 'Cmd/Ctrl + 4', action: isDE ? 'Papierkorb' : 'Trash' },
				],
			},
		],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: isDE ? 'Support kontaktieren' : 'Contact Support',
			content: isDE
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Storage.</p>'
				: '<p>Our support team is here to help you with any storage-related questions.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
