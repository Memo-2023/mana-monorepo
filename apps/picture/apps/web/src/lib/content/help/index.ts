/**
 * Help content for Picture app
 */

import type { HelpContent } from '@manacore/shared-help-types';
import { getPrivacyFAQs } from '@manacore/shared-help-types';

export function getPictureHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-generate',
				question: isDE ? 'Wie generiere ich ein Bild?' : 'How do I generate an image?',
				answer: isDE
					? '<p>So erstellst du ein KI-Bild:</p><ol><li>Gehe zu <strong>Generieren</strong> (Taste <kbd>N</kbd>)</li><li>Wähle ein Modell aus</li><li>Beschreibe dein gewünschtes Bild im Prompt-Feld</li><li>Klicke auf <strong>Generieren</strong></li></ol><p>Tipp: Je detaillierter dein Prompt, desto besser das Ergebnis.</p>'
					: '<p>To create an AI image:</p><ol><li>Go to <strong>Generate</strong> (key <kbd>N</kbd>)</li><li>Select a model</li><li>Describe your desired image in the prompt field</li><li>Click <strong>Generate</strong></li></ol><p>Tip: The more detailed your prompt, the better the result.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE
					? ['generieren', 'bild', 'erstellen', 'prompt']
					: ['generate', 'image', 'create', 'prompt'],
			},
			{
				id: 'faq-credits',
				question: isDE ? 'Wie funktioniert das Credit-System?' : 'How does the credit system work?',
				answer: isDE
					? '<p>Picture nutzt ein Freemium-Modell:</p><ul><li><strong>3 kostenlose Generierungen</strong> für neue Nutzer</li><li>Danach werden <strong>10 Credits pro Generierung</strong> berechnet</li><li>Credits können über die Einstellungen erworben werden</li><li>Dein verbleibendes Kontingent wird in der App angezeigt</li></ul>'
					: '<p>Picture uses a freemium model:</p><ul><li><strong>3 free generations</strong> for new users</li><li>After that, <strong>10 credits per generation</strong> are charged</li><li>Credits can be purchased via settings</li><li>Your remaining balance is displayed in the app</li></ul>',
				category: 'billing',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['credits', 'kosten', 'freemium'] : ['credits', 'cost', 'freemium'],
			},
			{
				id: 'faq-boards',
				question: isDE ? 'Was sind Moodboards?' : 'What are Moodboards?',
				answer: isDE
					? '<p>Moodboards sind Sammlungen, um deine Bilder zu organisieren:</p><ul><li>Erstelle Boards für verschiedene Projekte oder Stile</li><li>Füge Bilder per Drag & Drop zu Boards hinzu</li><li>Teile Boards mit anderen</li></ul><p>Gehe zu <strong>Boards</strong> (Taste <kbd>M</kbd>) um loszulegen.</p>'
					: '<p>Moodboards are collections to organize your images:</p><ul><li>Create boards for different projects or styles</li><li>Add images to boards via drag & drop</li><li>Share boards with others</li></ul><p>Go to <strong>Boards</strong> (key <kbd>M</kbd>) to get started.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['moodboard', 'sammlung', 'organisieren']
					: ['moodboard', 'collection', 'organize'],
			},
			{
				id: 'faq-explore',
				question: isDE ? 'Was ist der Explore-Bereich?' : 'What is the Explore section?',
				answer: isDE
					? '<p>Im Explore-Bereich kannst du Bilder anderer Nutzer entdecken, dich inspirieren lassen und Prompts als Vorlage verwenden.</p>'
					: '<p>In the Explore section you can discover images from other users, get inspired, and use prompts as templates.</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['explore', 'entdecken', 'inspiration']
					: ['explore', 'discover', 'inspiration'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Bilder', dataTypeEN: 'images' }),
		],
		features: [
			{
				id: 'feature-generate',
				title: isDE ? 'KI-Bildgenerierung' : 'AI Image Generation',
				description: isDE
					? 'Erstelle Bilder mit modernsten KI-Modellen'
					: 'Create images with state-of-the-art AI models',
				icon: '🎨',
				category: 'core',
				highlights: isDE
					? ['Replicate AI-Modelle', 'Prompt-basiert', '3 kostenlose Generierungen']
					: ['Replicate AI models', 'Prompt-based', '3 free generations'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-gallery',
				title: isDE ? 'Galerie' : 'Gallery',
				description: isDE
					? 'Verwalte und organisiere deine generierten Bilder'
					: 'Manage and organize your generated images',
				icon: '🖼️',
				category: 'core',
				highlights: isDE
					? ['Raster- & Listenansicht', 'Tags & Favoriten', 'Archiv']
					: ['Grid & list view', 'Tags & favorites', 'Archive'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-boards',
				title: 'Moodboards',
				description: isDE
					? 'Sammle und organisiere Bilder in thematischen Boards'
					: 'Collect and organize images in themed boards',
				icon: '📌',
				category: 'core',
				highlights: isDE
					? ['Drag & Drop', 'Boards teilen', 'Thematisch sortieren']
					: ['Drag & drop', 'Share boards', 'Sort by theme'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-explore',
				title: 'Explore',
				description: isDE
					? 'Entdecke Bilder und Prompts der Community'
					: 'Discover images and prompts from the community',
				icon: '🔍',
				category: 'core',
				highlights: isDE
					? ['Community-Feed', 'Prompt-Vorlagen', 'Inspiration']
					: ['Community feed', 'Prompt templates', 'Inspiration'],
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
					{ shortcut: 'G', action: isDE ? 'Galerie' : 'Gallery' },
					{ shortcut: 'M', action: 'Moodboards' },
					{ shortcut: 'E', action: 'Explore' },
					{ shortcut: 'N', action: isDE ? 'Generieren' : 'Generate' },
					{ shortcut: 'U', action: 'Upload' },
					{ shortcut: 'A', action: isDE ? 'Archiv' : 'Archive' },
				],
			},
			{
				id: 'shortcuts-view',
				category: 'general',
				title: isDE ? 'Ansicht' : 'View',
				language: isDE ? 'de' : 'en',
				order: 2,
				shortcuts: [
					{ shortcut: '1', action: isDE ? 'Listen-Ansicht' : 'List view' },
					{ shortcut: '2', action: isDE ? 'Raster 3×3' : 'Grid 3×3' },
					{ shortcut: '3', action: isDE ? 'Raster 5×5' : 'Grid 5×5' },
					{ shortcut: 'Tab', action: isDE ? 'UI ein-/ausblenden' : 'Toggle UI' },
					{ shortcut: '?', action: isDE ? 'Tastenkürzel anzeigen' : 'Show shortcuts' },
				],
			},
		],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: isDE ? 'Support kontaktieren' : 'Contact Support',
			content: isDE
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Picture.</p>'
				: '<p>Our support team is here to help you with any picture-related questions.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
