import type { WorkbenchTemplate } from './types';

/**
 * Deep Work — work-category Workbench-Template.
 *
 * Ein Starter-Kit für konzentrierte Arbeitsphasen. Scene mit Todo /
 * Calendar / Notes / Times + zwei Habits (Deep-Work-Zeit tracken, 1
 * "wichtigste Aufgabe" pro Tag definieren) + ein Wochenziel für
 * Fokus-Stunden.
 *
 * Kein AI-Agent. Das Template gibt die Struktur vor, der User bringt
 * die Arbeit.
 */

export const deepWorkTemplate: WorkbenchTemplate = {
	id: 'deep-work',
	version: '1',
	label: 'Deep Work',
	icon: '💻',
	tagline: 'Konzentrierter Arbeitsplatz mit Fokus-Tracking',
	description: `Ein Starter-Kit für konzentrierte Arbeit. Legt dir eine Scene mit Todo, Kalender, Notes und Time-Tracking an und seed-et zwei Habits plus ein Wochenziel für Deep-Work-Stunden.

Was drin ist:

- **Scene**: Todo · Kalender · Notes · Times — alles für fokussierte Sessions nebeneinander.
- **2 Habits**:
  - 🎯 1 wichtigste Aufgabe pro Tag
  - ⏱ 4h Deep Work pro Tag
- **1 Wochenziel**: "20h Deep Work pro Woche" — zählt abgeschlossene Time-Tracking-Sessions.

Kein Agent. Das Setup ist da; der Rest ist deine Disziplin.`,
	category: 'work',
	color: '#1F2937',
	scene: {
		name: 'Deep Work',
		description: 'Fokus, Kalender, Notes, Zeit',
		openApps: [
			{ appId: 'todo', widthPx: 540 },
			{ appId: 'calendar', widthPx: 540 },
			{ appId: 'notes', widthPx: 440 },
			{ appId: 'times', widthPx: 340 },
		],
	},
	seeds: {
		habits: [
			{
				stableId: 'template-deepwork:habit:top-task',
				data: {
					title: '1 wichtigste Aufgabe pro Tag',
					icon: '🎯',
					color: '#1F2937',
					targetPerDay: 1,
					defaultDuration: null,
				},
			},
			{
				stableId: 'template-deepwork:habit:deep-work-hours',
				data: {
					title: '4h Deep Work pro Tag',
					icon: '⏱',
					color: '#374151',
					targetPerDay: 4,
					defaultDuration: 60,
				},
			},
		],
		goals: [
			{
				stableId: 'template-deepwork:goal:weekly-focus',
				data: {
					title: '20h Deep Work pro Woche',
					description: 'Summiert Time-Tracking-Sessions im Times-Modul.',
					moduleId: 'times',
					metric: {
						source: 'event_count',
						eventType: 'TimeSessionCompleted',
					},
					target: { value: 20, period: 'week', comparison: 'gte' },
				},
			},
		],
	},
};
