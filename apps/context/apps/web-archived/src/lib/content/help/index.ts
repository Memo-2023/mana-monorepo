/**
 * Help content for Context app
 */

import type { HelpContent } from '@manacore/help';
import { getPrivacyFAQs } from '@manacore/help';

export function getContextHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-spaces',
				question: isDE ? 'Was sind Spaces?' : 'What are Spaces?',
				answer: isDE
					? '<p><strong>Spaces</strong> sind Arbeitsbereiche, in denen du Dokumente organisierst:</p><ul><li>Erstelle separate Spaces für verschiedene Projekte oder Themen</li><li>Jeder Space hat eigene Dokumente, Einstellungen und Zugriffsrechte</li><li>Wechsle schnell zwischen Spaces über die Seitenleiste</li><li>Teile Spaces mit Teammitgliedern für gemeinsames Arbeiten</li></ul>'
					: '<p><strong>Spaces</strong> are workspaces where you organize your documents:</p><ul><li>Create separate Spaces for different projects or topics</li><li>Each Space has its own documents, settings, and access rights</li><li>Quickly switch between Spaces via the sidebar</li><li>Share Spaces with team members for collaboration</li></ul>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['spaces', 'arbeitsbereiche', 'organisation']
					: ['spaces', 'workspaces', 'organization'],
			},
			{
				id: 'faq-ai-generation',
				question: isDE ? 'Wie funktioniert die KI-Generierung?' : 'How does AI generation work?',
				answer: isDE
					? '<p>Context nutzt <strong>mehrere KI-Modelle</strong> für die Dokumentenerstellung:</p><ol><li>Wähle ein Dokument oder erstelle ein neues</li><li>Beschreibe, was du generieren möchtest, oder markiere Text für Überarbeitung</li><li>Wähle das gewünschte KI-Modell (z.B. GPT-4, Claude, Gemini)</li><li>Die KI generiert den Inhalt direkt in deinem Dokument</li></ol><p>Du kannst auch bestehende Texte umschreiben, zusammenfassen oder erweitern lassen.</p>'
					: '<p>Context uses <strong>multiple AI models</strong> for document creation:</p><ol><li>Select a document or create a new one</li><li>Describe what you want to generate, or highlight text for revision</li><li>Choose the desired AI model (e.g. GPT-4, Claude, Gemini)</li><li>The AI generates content directly in your document</li></ol><p>You can also have existing text rewritten, summarized, or expanded.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['ki', 'generierung', 'dokument'] : ['ai', 'generation', 'document'],
			},
			{
				id: 'faq-models',
				question: isDE ? 'Welche KI-Modelle sind verfügbar?' : 'What AI models are available?',
				answer: isDE
					? '<p>Context unterstützt <strong>mehrere führende KI-Modelle</strong>:</p><ul><li><strong>OpenAI GPT-4</strong>: Vielseitig und leistungsstark für komplexe Aufgaben</li><li><strong>Anthropic Claude</strong>: Besonders gut bei langen Dokumenten und Analysen</li><li><strong>Google Gemini</strong>: Schnell und effizient für alltägliche Aufgaben</li></ul><p>Jedes Modell hat unterschiedliche Stärken. Du kannst das Modell pro Generierung wechseln, um die besten Ergebnisse zu erzielen.</p>'
					: '<p>Context supports <strong>multiple leading AI models</strong>:</p><ul><li><strong>OpenAI GPT-4</strong>: Versatile and powerful for complex tasks</li><li><strong>Anthropic Claude</strong>: Especially good with long documents and analysis</li><li><strong>Google Gemini</strong>: Fast and efficient for everyday tasks</li></ul><p>Each model has different strengths. You can switch models per generation to achieve the best results.</p>',
				category: 'technical',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['modelle', 'gpt', 'claude', 'gemini'] : ['models', 'gpt', 'claude', 'gemini'],
			},
			{
				id: 'faq-versioning',
				question: isDE
					? 'Wie funktioniert die Dokumentenversionierung?'
					: 'How does document versioning work?',
				answer: isDE
					? '<p>Context speichert automatisch <strong>Versionen</strong> deiner Dokumente:</p><ul><li>Jede Änderung wird als neue Version gespeichert</li><li>Vergleiche zwei Versionen nebeneinander mit Diff-Ansicht</li><li>Stelle jede frühere Version mit einem Klick wieder her</li><li>KI-Generierungen werden als separate Versionen markiert</li></ul><p>So kannst du jederzeit zu einem früheren Stand zurückkehren, ohne Arbeit zu verlieren.</p>'
					: '<p>Context automatically saves <strong>versions</strong> of your documents:</p><ul><li>Every change is saved as a new version</li><li>Compare two versions side by side with diff view</li><li>Restore any previous version with one click</li><li>AI generations are marked as separate versions</li></ul><p>This way you can always go back to a previous state without losing work.</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['versionierung', 'historie', 'wiederherstellen']
					: ['versioning', 'history', 'restore'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Dokumente', dataTypeEN: 'documents' }),
		],
		features: [
			{
				id: 'feature-ai-generation',
				title: isDE ? 'KI-Dokumentengenerierung' : 'AI Document Generation',
				description: isDE
					? 'Erstelle und überarbeite Dokumente mit mehreren KI-Modellen'
					: 'Create and revise documents with multiple AI models',
				icon: '🤖',
				category: 'core',
				highlights: isDE
					? [
							'Multi-Modell-Unterstützung',
							'Inline-Generierung',
							'Umschreiben & Zusammenfassen',
							'Kontextbewusst',
						]
					: ['Multi-model support', 'Inline generation', 'Rewrite & summarize', 'Context-aware'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-spaces',
				title: 'Spaces',
				description: isDE
					? 'Organisiere Dokumente in thematischen Arbeitsbereichen'
					: 'Organize documents in thematic workspaces',
				icon: '📂',
				category: 'core',
				highlights: isDE
					? ['Projekt-Organisation', 'Zugriffsrechte', 'Team-Zusammenarbeit', 'Schneller Wechsel']
					: ['Project organization', 'Access rights', 'Team collaboration', 'Quick switching'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-versioning',
				title: isDE ? 'Dokumentenversionierung' : 'Document Versioning',
				description: isDE
					? 'Automatische Versionierung mit Diff-Ansicht und Wiederherstellung'
					: 'Automatic versioning with diff view and restoration',
				icon: '📋',
				category: 'advanced',
				highlights: isDE
					? [
							'Automatische Versionen',
							'Diff-Vergleich',
							'Ein-Klick-Wiederherstellung',
							'KI-Versionsmarker',
						]
					: ['Automatic versions', 'Diff comparison', 'One-click restore', 'AI version markers'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-multi-model',
				title: isDE ? 'Multi-Modell-Unterstützung' : 'Multi-Model Support',
				description: isDE
					? 'Wähle aus GPT-4, Claude, Gemini und weiteren KI-Modellen'
					: 'Choose from GPT-4, Claude, Gemini, and more AI models',
				icon: '🧠',
				category: 'advanced',
				highlights: isDE
					? ['GPT-4', 'Claude', 'Gemini', 'Modellvergleich']
					: ['GPT-4', 'Claude', 'Gemini', 'Model comparison'],
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Context.</p>'
				: '<p>Our support team is here to help you with any questions about Context.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
