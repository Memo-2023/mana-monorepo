/**
 * Help content for Questions app
 */

import type { HelpContent } from '@manacore/shared-help-types';
import { getPrivacyFAQs } from '@manacore/shared-help-types';

export function getQuestionsHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-research',
				question: isDE ? 'Wie funktioniert die KI-Recherche?' : 'How does AI research work?',
				answer: isDE
					? '<p>Questions nutzt KI und Websuche, um deine Fragen gründlich zu beantworten:</p><ol><li>Stelle eine Frage oder gib ein Recherchethema ein</li><li>Die KI durchsucht das Web nach relevanten Quellen</li><li>Informationen werden analysiert, zusammengefasst und mit Quellenangaben versehen</li><li>Du erhältst eine strukturierte Antwort mit verlinkten Quellen</li></ol><p>Je spezifischer deine Frage, desto besser die Ergebnisse.</p>'
					: '<p>Questions uses AI and web search to thoroughly answer your questions:</p><ol><li>Ask a question or enter a research topic</li><li>The AI searches the web for relevant sources</li><li>Information is analyzed, summarized, and attributed to sources</li><li>You receive a structured answer with linked sources</li></ol><p>The more specific your question, the better the results.</p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: ['research', 'ai', 'search', 'questions'],
			},
			{
				id: 'faq-depth',
				question: isDE ? 'Was sind Recherchetiefen?' : 'What are research depths?',
				answer: isDE
					? '<p>Du kannst die Gründlichkeit der Recherche steuern:</p><ul><li><strong>Schnell</strong> — Kurze, direkte Antwort aus wenigen Quellen</li><li><strong>Standard</strong> — Ausgewogene Recherche mit mehreren Quellen</li><li><strong>Tief</strong> — Umfassende Analyse mit vielen Quellen und Details</li><li><strong>Experte</strong> — Maximale Tiefe mit akademischen und spezialisierten Quellen</li></ul><p>Tiefere Recherchen dauern länger, liefern aber detailliertere Ergebnisse.</p>'
					: '<p>You can control the thoroughness of the research:</p><ul><li><strong>Quick</strong> — Brief, direct answer from a few sources</li><li><strong>Standard</strong> — Balanced research with multiple sources</li><li><strong>Deep</strong> — Comprehensive analysis with many sources and details</li><li><strong>Expert</strong> — Maximum depth with academic and specialized sources</li></ul><p>Deeper research takes longer but delivers more detailed results.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: ['depth', 'levels', 'quick', 'deep', 'expert'],
			},
			{
				id: 'faq-sources',
				question: isDE ? 'Wie funktionieren Quellenangaben?' : 'How do sources work?',
				answer: isDE
					? '<p>Jede Antwort enthält verifizierbare Quellenangaben:</p><ul><li>Quellen werden als nummerierte Referenzen im Text angezeigt</li><li>Klicke auf eine Quellenangabe, um die Originalseite zu besuchen</li><li>Die Zuverlässigkeit jeder Quelle wird bewertet</li><li>Du kannst die Quellentypen filtern (Nachricht, Akademisch, Blog, etc.)</li></ul><p>So kannst du jede Information selbst überprüfen.</p>'
					: '<p>Every answer includes verifiable source attributions:</p><ul><li>Sources are displayed as numbered references in the text</li><li>Click a source reference to visit the original page</li><li>The reliability of each source is evaluated</li><li>You can filter source types (news, academic, blog, etc.)</li></ul><p>This allows you to verify any information yourself.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: ['sources', 'references', 'attribution', 'verification'],
			},
			{
				id: 'faq-collections',
				question: isDE ? 'Was sind Sammlungen?' : 'What are collections?',
				answer: isDE
					? '<p>Sammlungen helfen dir, deine Recherchen zu organisieren:</p><ul><li>Erstelle thematische Sammlungen für verschiedene Projekte</li><li>Speichere Fragen und Antworten in Sammlungen</li><li>Teile Sammlungen mit anderen Nutzern</li><li>Exportiere Sammlungen als Dokument</li></ul><p>Alle deine Recherchen werden automatisch im Verlauf gespeichert.</p>'
					: '<p>Collections help you organize your research:</p><ul><li>Create thematic collections for different projects</li><li>Save questions and answers to collections</li><li>Share collections with other users</li><li>Export collections as a document</li></ul><p>All your research is automatically saved in the history.</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: ['collections', 'organize', 'save', 'share'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Fragen', dataTypeEN: 'questions' }),
		],
		features: [
			{
				id: 'feature-research',
				title: isDE ? 'KI-Recherche' : 'AI Research',
				description: isDE
					? 'Stelle Fragen und erhalte gründlich recherchierte Antworten mit Quellenangaben.'
					: 'Ask questions and get thoroughly researched answers with source attributions.',
				icon: '🔍',
				category: 'core',
				highlights: isDE
					? ['Websuche-Integration', 'Strukturierte Antworten', 'Quellenangaben']
					: ['Web search integration', 'Structured answers', 'Source attribution'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-sources',
				title: isDE ? 'Quellenangaben' : 'Source Attribution',
				description: isDE
					? 'Jede Antwort enthält verifizierbare Quellenangaben mit Zuverlässigkeitsbewertung.'
					: 'Every answer includes verifiable source attributions with reliability ratings.',
				icon: '📚',
				category: 'core',
				highlights: isDE
					? ['Nummerierte Referenzen', 'Direkte Links', 'Zuverlässigkeitsbewertung']
					: ['Numbered references', 'Direct links', 'Reliability ratings'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-collections',
				title: isDE ? 'Sammlungen' : 'Collections',
				description: isDE
					? 'Organisiere deine Recherchen in thematischen Sammlungen zum Teilen und Exportieren.'
					: 'Organize your research into thematic collections for sharing and exporting.',
				icon: '📂',
				category: 'core',
				highlights: isDE
					? ['Thematische Ordnung', 'Teilen & Export', 'Automatischer Verlauf']
					: ['Thematic organization', 'Share & export', 'Automatic history'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-depth',
				title: isDE ? 'Mehrere Recherchetiefen' : 'Multiple Depth Levels',
				description: isDE
					? 'Wähle zwischen schnellen Antworten und tiefgehenden Expertenrecherchen.'
					: 'Choose between quick answers and in-depth expert research.',
				icon: '📊',
				category: 'advanced',
				highlights: isDE
					? ['4 Tiefenstufen', 'Akademische Quellen', 'Anpassbare Gründlichkeit']
					: ['4 depth levels', 'Academic sources', 'Adjustable thoroughness'],
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Questions.</p>'
				: '<p>Our support team is here to help you with any questions about Questions.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
