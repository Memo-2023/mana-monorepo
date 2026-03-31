/**
 * Help content for Todo app
 */

import type { HelpContent } from '@manacore/help';
import { getPrivacyFAQs } from '@manacore/help';

export function getTodoHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-quick-add',
				question: isDE ? 'Wie funktioniert die Schnelleingabe?' : 'How does quick add work?',
				answer: isDE
					? '<p>Die Schnelleingabe erkennt automatisch verschiedene Muster:</p><ul><li><strong>Priorität</strong>: <code>!!!</code> (dringend), <code>!!</code> (hoch), <code>!</code> (mittel)</li><li><strong>Projekt</strong>: <code>@Projektname</code></li><li><strong>Labels</strong>: <code>#label1 #label2</code></li><li><strong>Datum</strong>: heute, morgen, nächsten Montag, 15.12.</li><li><strong>Wiederholung</strong>: täglich, wöchentlich, monatlich</li><li><strong>Unteraufgaben</strong>: <code>Titel: Item1, Item2, Item3</code></li></ul><p>Beispiel: <code>Einkaufen: Milch, Brot morgen !! @Privat #wichtig</code></p>'
					: '<p>Quick add automatically recognizes various patterns:</p><ul><li><strong>Priority</strong>: <code>!!!</code> (urgent), <code>!!</code> (high), <code>!</code> (medium)</li><li><strong>Project</strong>: <code>@ProjectName</code></li><li><strong>Labels</strong>: <code>#label1 #label2</code></li><li><strong>Date</strong>: today, tomorrow, next Monday</li><li><strong>Recurrence</strong>: daily, weekly, monthly</li><li><strong>Subtasks</strong>: <code>Title: Item1, Item2, Item3</code></li></ul><p>Example: <code>Shopping: Milk, Bread tomorrow !! @Personal #important</code></p>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				featured: true,
				tags: isDE ? ['schnelleingabe', 'erstellen', 'syntax'] : ['quick-add', 'create', 'syntax'],
			},
			{
				id: 'faq-projects',
				question: isDE
					? 'Wie organisiere ich Aufgaben in Projekten?'
					: 'How do I organize tasks in projects?',
				answer: isDE
					? '<p>Projekte helfen dir, Aufgaben thematisch zu gruppieren:</p><ul><li>Erstelle Projekte über das <strong>+</strong> Symbol in der Seitenleiste</li><li>Weise jeder Aufgabe ein Projekt zu (oder lasse sie im Posteingang)</li><li>Jedes Projekt hat eine eigene Farbe zur visuellen Unterscheidung</li><li>Ziehe Aufgaben per Drag & Drop zwischen Projekten</li></ul>'
					: '<p>Projects help you group tasks by topic:</p><ul><li>Create projects via the <strong>+</strong> icon in the sidebar</li><li>Assign tasks to a project (or leave them in the inbox)</li><li>Each project has its own color for visual distinction</li><li>Drag and drop tasks between projects</li></ul>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['projekte', 'organisation', 'sortierung']
					: ['projects', 'organize', 'sorting'],
			},
			{
				id: 'faq-kanban',
				question: isDE ? 'Was ist die Kanban-Ansicht?' : 'What is the Kanban view?',
				answer: isDE
					? '<p>Die Board-Ansicht zeigt deine Aufgaben als Karten in Spalten an. Du kannst:</p><ul><li>Aufgaben per Drag & Drop zwischen Spalten verschieben</li><li>Den Fortschritt visuell verfolgen</li><li>Spalten nach Priorität oder Status organisieren</li></ul><p>Wechsle über die Tabs (Fokus / Übersicht / Matrix) zwischen den Ansichten.</p>'
					: '<p>The board view shows your tasks as cards in columns. You can:</p><ul><li>Drag and drop tasks between columns</li><li>Track progress visually</li><li>Organize columns by priority or status</li></ul><p>Switch between views using the tabs (Fokus / Übersicht / Matrix).</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['kanban', 'board', 'ansicht'] : ['kanban', 'board', 'view'],
			},
			{
				id: 'faq-recurring',
				question: isDE
					? 'Wie erstelle ich wiederkehrende Aufgaben?'
					: 'How do I create recurring tasks?',
				answer: isDE
					? '<p>Du kannst Wiederholungen auf zwei Arten setzen:</p><ul><li><strong>Schnelleingabe</strong>: Tippe "täglich", "wöchentlich", "jeden Montag" oder "monatlich"</li><li><strong>Aufgaben-Detail</strong>: Öffne die Aufgabe und wähle eine Wiederholungsregel</li></ul><p>Wenn du eine wiederkehrende Aufgabe abhakst, wird automatisch die nächste Instanz erstellt.</p>'
					: '<p>You can set recurrence in two ways:</p><ul><li><strong>Quick add</strong>: Type "daily", "weekly", "every Monday", or "monthly"</li><li><strong>Task detail</strong>: Open the task and select a recurrence rule</li></ul><p>When you complete a recurring task, the next instance is automatically created.</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['wiederkehrend', 'wiederholung', 'serie'] : ['recurring', 'repeat', 'series'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Aufgaben', dataTypeEN: 'tasks' }),
		],
		features: [
			{
				id: 'feature-quick-add',
				title: isDE ? 'Schnelleingabe' : 'Quick Add',
				description: isDE
					? 'Erstelle Aufgaben in natürlicher Sprache'
					: 'Create tasks using natural language',
				icon: '⚡',
				category: 'core',
				highlights: isDE
					? ['Automatische Erkennung', 'Datum & Priorität', 'Projekte & Labels']
					: ['Auto-detection', 'Date & priority', 'Projects & labels'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-kanban',
				title: 'Kanban Board',
				description: isDE
					? 'Visualisiere deine Aufgaben als Kanban-Board'
					: 'Visualize your tasks as a Kanban board',
				icon: '📋',
				category: 'core',
				highlights: isDE
					? ['Drag & Drop', 'Spalten nach Priorität', 'Visueller Fortschritt']
					: ['Drag & drop', 'Columns by priority', 'Visual progress'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-projects',
				title: isDE ? 'Projekte' : 'Projects',
				description: isDE
					? 'Organisiere Aufgaben in farbcodierten Projekten'
					: 'Organize tasks in color-coded projects',
				icon: '📁',
				category: 'core',
				highlights: isDE
					? ['Farbcodierung', 'Drag & Drop', 'Archivierung']
					: ['Color coding', 'Drag & drop', 'Archiving'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-recurring',
				title: isDE ? 'Wiederkehrende Aufgaben' : 'Recurring Tasks',
				description: isDE
					? 'Automatische Wiederholung mit flexiblen Regeln'
					: 'Automatic recurrence with flexible rules',
				icon: '🔄',
				category: 'advanced',
				highlights: isDE
					? ['Täglich/Wöchentlich/Monatlich', 'Bestimmte Wochentage', 'Auto-Erstellung']
					: ['Daily/Weekly/Monthly', 'Specific weekdays', 'Auto-creation'],
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
		],
		shortcuts: [
			{
				id: 'shortcuts-navigation',
				category: 'navigation',
				title: 'Navigation',
				language: isDE ? 'de' : 'en',
				order: 1,
				shortcuts: [
					{
						shortcut: 'Ctrl + 1',
						action: isDE ? 'Listen-Ansicht' : 'List view',
					},
					{
						shortcut: 'Ctrl + 2',
						action: isDE ? 'Kanban-Ansicht' : 'Kanban view',
					},
					{
						shortcut: 'Ctrl + 3',
						action: isDE ? 'Tags-Ansicht' : 'Tags view',
					},
				],
			},
			{
				id: 'shortcuts-general',
				category: 'general',
				title: isDE ? 'Allgemein' : 'General',
				language: isDE ? 'de' : 'en',
				order: 2,
				shortcuts: [
					{
						shortcut: 'F',
						action: isDE ? 'Immersive-Modus umschalten' : 'Toggle immersive mode',
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
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Todo.</p>'
				: '<p>Our support team is here to help you with any task management questions.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
