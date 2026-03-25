/**
 * Help content for Chat app
 */

import type { HelpContent } from '@manacore/shared-help-types';

export function getChatHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-models',
				question: isDE
					? 'Welche KI-Modelle stehen zur Verfügung?'
					: 'Which AI models are available?',
				answer: isDE
					? '<p>Es gibt zwei Kategorien von Modellen:</p><ul><li><strong>Lokale Modelle</strong> (kostenlos): Laufen auf unserem Server — z.B. Gemma 3, Qwen2.5 Coder, LLaVA Vision</li><li><strong>Cloud-Modelle</strong> (Credits): Leistungsstärkere Modelle — z.B. Claude, GPT-4o, DeepSeek, Llama</li></ul><p>Lokale Modelle sind ideal für alltägliche Aufgaben. Cloud-Modelle bieten höhere Qualität für komplexe Anfragen.</p>'
					: '<p>There are two categories of models:</p><ul><li><strong>Local models</strong> (free): Run on our server — e.g. Gemma 3, Qwen2.5 Coder, LLaVA Vision</li><li><strong>Cloud models</strong> (credits): More powerful models — e.g. Claude, GPT-4o, DeepSeek, Llama</li></ul><p>Local models are ideal for everyday tasks. Cloud models offer higher quality for complex requests.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE ? ['modelle', 'ki', 'lokal', 'cloud'] : ['models', 'ai', 'local', 'cloud'],
			},
			{
				id: 'faq-spaces',
				question: isDE ? 'Was sind Spaces?' : 'What are Spaces?',
				answer: isDE
					? '<p>Spaces sind Bereiche, um deine Chats thematisch zu organisieren:</p><ul><li>Erstelle Spaces für verschiedene Projekte oder Themen</li><li>Jeder Space enthält eigene Unterhaltungen</li><li>Wechsle schnell zwischen Kontexten</li></ul>'
					: '<p>Spaces are areas to organize your chats by topic:</p><ul><li>Create spaces for different projects or topics</li><li>Each space contains its own conversations</li><li>Switch quickly between contexts</li></ul>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['spaces', 'organisation', 'bereiche'] : ['spaces', 'organize', 'areas'],
			},
			{
				id: 'faq-templates',
				question: isDE ? 'Wie nutze ich Templates?' : 'How do I use templates?',
				answer: isDE
					? '<p>Templates sind vordefinierte Prompt-Vorlagen:</p><ul><li>Wähle ein Template aus der Vorlagenbibliothek</li><li>Das Template füllt automatisch den Chat mit einem optimierten Prompt</li><li>Ideal für wiederkehrende Aufgaben wie Texterstellung, Übersetzung oder Code-Analyse</li></ul>'
					: '<p>Templates are predefined prompt presets:</p><ul><li>Select a template from the template library</li><li>The template automatically fills the chat with an optimized prompt</li><li>Ideal for recurring tasks like writing, translation, or code analysis</li></ul>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['templates', 'vorlagen', 'prompts'] : ['templates', 'presets', 'prompts'],
			},
			{
				id: 'faq-compare',
				question: isDE ? 'Was ist der Modellvergleich?' : 'What is model comparison?',
				answer: isDE
					? '<p>Mit dem Modellvergleich kannst du denselben Prompt an mehrere Modelle gleichzeitig senden und die Antworten nebeneinander vergleichen. So findest du das beste Modell für deine Aufgabe.</p>'
					: '<p>Model comparison lets you send the same prompt to multiple models simultaneously and compare responses side by side. This helps you find the best model for your task.</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['vergleich', 'modelle', 'test'] : ['compare', 'models', 'test'],
			},
			{
				id: 'faq-privacy',
				question: isDE ? 'Wie werden meine Chats geschützt?' : 'How are my chats protected?',
				answer: isDE
					? '<p>Deine Unterhaltungen sind sicher:</p><ul><li><strong>Verschlüsselung</strong>: Alle Daten werden bei der Übertragung (TLS) verschlüsselt</li><li><strong>Privat</strong>: Nur du hast Zugriff auf deine Chats</li><li><strong>Lokale Modelle</strong>: Bei lokalen Modellen verlassen deine Daten nie unseren Server</li><li><strong>DSGVO-konform</strong>: Wir halten uns an die EU-Datenschutzverordnung</li></ul>'
					: '<p>Your conversations are secure:</p><ul><li><strong>Encryption</strong>: All data is encrypted in transit (TLS)</li><li><strong>Private</strong>: Only you have access to your chats</li><li><strong>Local models</strong>: With local models, your data never leaves our server</li><li><strong>GDPR Compliant</strong>: We follow EU data protection regulations</li></ul>',
				category: 'privacy',
				order: 5,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE ? ['datenschutz', 'sicherheit', 'dsgvo'] : ['privacy', 'security', 'gdpr'],
			},
		],
		features: [
			{
				id: 'feature-models',
				title: isDE ? 'Mehrere KI-Modelle' : 'Multiple AI Models',
				description: isDE
					? 'Lokale und Cloud-Modelle für jede Aufgabe'
					: 'Local and cloud models for every task',
				icon: '🤖',
				category: 'core',
				highlights: isDE
					? ['7+ lokale Modelle (kostenlos)', 'Cloud-Modelle (Claude, GPT)', 'Vision-Modelle']
					: ['7+ local models (free)', 'Cloud models (Claude, GPT)', 'Vision models'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-spaces',
				title: 'Spaces',
				description: isDE
					? 'Organisiere Chats nach Themen und Projekten'
					: 'Organize chats by topics and projects',
				icon: '📂',
				category: 'core',
				highlights: isDE
					? ['Thematische Gruppierung', 'Schneller Kontextwechsel', 'Eigene Unterhaltungen']
					: ['Topic grouping', 'Quick context switch', 'Separate conversations'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-compare',
				title: isDE ? 'Modellvergleich' : 'Model Comparison',
				description: isDE
					? 'Vergleiche Antworten mehrerer Modelle nebeneinander'
					: 'Compare responses from multiple models side by side',
				icon: '⚖️',
				category: 'advanced',
				highlights: isDE
					? ['Parallele Anfragen', 'Qualitätsvergleich', 'Beste Modellwahl']
					: ['Parallel requests', 'Quality comparison', 'Best model selection'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-templates',
				title: 'Templates',
				description: isDE
					? 'Optimierte Prompts für wiederkehrende Aufgaben'
					: 'Optimized prompts for recurring tasks',
				icon: '📋',
				category: 'core',
				highlights: isDE
					? ['Prompt-Vorlagen', 'Ein-Klick-Start', 'Verschiedene Kategorien']
					: ['Prompt presets', 'One-click start', 'Various categories'],
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
					{ shortcut: 'Cmd/Ctrl + 1', action: 'Chat' },
					{ shortcut: 'Cmd/Ctrl + 2', action: isDE ? 'Vergleich' : 'Compare' },
					{ shortcut: 'Cmd/Ctrl + 3', action: 'Templates' },
					{ shortcut: 'Cmd/Ctrl + 4', action: 'Spaces' },
					{ shortcut: 'Cmd/Ctrl + 5', action: isDE ? 'Dokumente' : 'Documents' },
					{ shortcut: 'Cmd/Ctrl + 6', action: isDE ? 'Archiv' : 'Archive' },
				],
			},
		],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: isDE ? 'Support kontaktieren' : 'Contact Support',
			content: isDE
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Chat.</p>'
				: '<p>Our support team is here to help you with any chat-related questions.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
