/**
 * Help content for Mukke app
 */

import type { HelpContent } from '@manacore/help';
import { getPrivacyFAQs } from '@manacore/help';

export function getMukkeHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-upload',
				question: isDE
					? 'Welche Audioformate werden unterstützt?'
					: 'Which audio formats are supported?',
				answer: isDE
					? '<p>Mukke unterstützt eine Vielzahl von Formaten:</p><ul><li><strong>Volle Unterstützung</strong>: MP3, WAV, FLAC, AAC/M4A, OGG, OPUS</li><li><strong>Upload & Metadaten</strong>: AIFF, WMA, APE, WavPack, DSF/DFF</li></ul><p>Metadaten (ID3-Tags) werden automatisch beim Upload extrahiert — Titel, Künstler, Album, Cover-Art und mehr.</p>'
					: '<p>Mukke supports a wide range of formats:</p><ul><li><strong>Full support</strong>: MP3, WAV, FLAC, AAC/M4A, OGG, OPUS</li><li><strong>Upload & metadata</strong>: AIFF, WMA, APE, WavPack, DSF/DFF</li></ul><p>Metadata (ID3 tags) is automatically extracted on upload — title, artist, album, cover art, and more.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['upload', 'formate', 'audio', 'mp3'] : ['upload', 'formats', 'audio', 'mp3'],
			},
			{
				id: 'faq-editor',
				question: isDE ? 'Wie funktioniert der Lyrics-Editor?' : 'How does the lyrics editor work?',
				answer: isDE
					? '<p>Der Editor ermöglicht synchronisierte Lyrics:</p><ol><li>Erstelle ein <strong>Projekt</strong> aus einem Song deiner Bibliothek</li><li>Sieh die <strong>Wellenform</strong> und setze Beat-Marker</li><li>Gib Lyrics ein und <strong>synchronisiere</strong> sie mit den Zeitstempeln</li><li><strong>Exportiere</strong> als LRC, SRT oder JSON</li></ol>'
					: '<p>The editor enables synchronized lyrics:</p><ol><li>Create a <strong>project</strong> from a song in your library</li><li>View the <strong>waveform</strong> and set beat markers</li><li>Enter lyrics and <strong>sync</strong> them with timestamps</li><li><strong>Export</strong> as LRC, SRT, or JSON</li></ol>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE
					? ['editor', 'lyrics', 'sync', 'wellenform']
					: ['editor', 'lyrics', 'sync', 'waveform'],
			},
			{
				id: 'faq-playlists',
				question: isDE ? 'Wie erstelle ich Playlists?' : 'How do I create playlists?',
				answer: isDE
					? '<p>Gehe zu <strong>Playlists</strong> und klicke auf das <strong>+</strong> Symbol. Füge Songs per Drag & Drop oder über das Kontextmenü hinzu. Die Reihenfolge lässt sich ebenfalls per Drag & Drop anpassen.</p>'
					: '<p>Go to <strong>Playlists</strong> and click the <strong>+</strong> icon. Add songs via drag & drop or the context menu. The order can also be adjusted via drag & drop.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['playlist', 'erstellen', 'sortieren'] : ['playlist', 'create', 'sort'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Musik', dataTypeEN: 'music' }),
		],
		features: [
			{
				id: 'feature-library',
				title: isDE ? 'Musikbibliothek' : 'Music Library',
				description: isDE
					? 'Verwalte deine Sammlung nach Künstler, Album und Genre'
					: 'Manage your collection by artist, album, and genre',
				icon: '🎵',
				category: 'core',
				highlights: isDE
					? ['Auto-Metadaten', 'Cover-Art', 'Künstler/Alben/Genres']
					: ['Auto metadata', 'Cover art', 'Artists/Albums/Genres'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-player',
				title: 'Player',
				description: isDE
					? 'Integrierter Musikplayer mit Wiedergabesteuerung'
					: 'Built-in music player with playback controls',
				icon: '▶️',
				category: 'core',
				highlights: isDE
					? ['Streaming', 'Playlists', 'Play-Count']
					: ['Streaming', 'Playlists', 'Play count'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-editor',
				title: isDE ? 'Lyrics-Editor' : 'Lyrics Editor',
				description: isDE
					? 'Synchronisiere Lyrics mit Wellenform-Visualisierung'
					: 'Sync lyrics with waveform visualization',
				icon: '🎤',
				category: 'advanced',
				highlights: isDE
					? ['Wellenform', 'Beat-Marker', 'LRC/SRT Export']
					: ['Waveform', 'Beat markers', 'LRC/SRT export'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-visualizer',
				title: 'Visualizer',
				description: isDE
					? 'Audio-Visualisierungen mit verschiedenen Themes'
					: 'Audio visualizations with various themes',
				icon: '🌈',
				category: 'advanced',
				highlights: isDE
					? ['Butterchurn-Presets', 'WebGL', 'Theme-Auswahl']
					: ['Butterchurn presets', 'WebGL', 'Theme selection'],
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
					{ shortcut: 'Ctrl + 1-5', action: 'Navigation' },
					{ shortcut: 'Space', action: isDE ? 'Wiedergabe/Pause' : 'Play/Pause' },
				],
			},
		],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: isDE ? 'Support kontaktieren' : 'Contact Support',
			content: isDE
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Mukke.</p>'
				: '<p>Our support team is here to help you with any questions about Mukke.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
