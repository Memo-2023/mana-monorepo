import type { WorkbenchTemplate } from './types';

/**
 * Calmness — first non-AI workbench template.
 *
 * Legt eine Scene fürs Runterkommen an und seed-ed zwei Einstiegs-
 * Meditationen ins Meditate-Modul. Kein Agent, keine Mission — dieses
 * Template ist "Infrastruktur für Ruhe", keine Automation.
 *
 * Dient in Phase T1 des Workbench-Templates-Plans auch als Pilot-
 * Template dafür wie nicht-AI-Templates aussehen. Folgende Templates
 * (Fitness, Deep Work, …) nutzen denselben Shape.
 */

export const calmnessTemplate: WorkbenchTemplate = {
	id: 'calmness',
	version: '1',
	label: 'Calmness',
	icon: '🧘',
	tagline: 'Atem, Stille, ruhige Momente',
	description: `Ein Workbench-Setup für Stille-Momente. Legt dir eine Scene mit den Modulen Meditate, Mood, Journal und Sleep an und seed-et zwei Einstiegs-Meditationen — mehr brauchst du nicht um anzufangen.

Kein AI-Agent. Du meditierst, nicht dein Computer.`,
	category: 'wellness',
	color: '#8B5CF6',
	scene: {
		name: 'Calmness',
		description: 'Ruhe, Atem, Stille',
		openApps: [
			{ appId: 'meditate', widthPx: 540 },
			{ appId: 'mood', widthPx: 340 },
			{ appId: 'journal', widthPx: 440 },
			{ appId: 'sleep', widthPx: 340 },
		],
	},
	seeds: {
		meditate: [
			{
				stableId: 'template-calmness:preset:4-7-8',
				data: {
					name: '4-7-8 Atmung',
					description:
						'Beruhigende Atemtechnik. Einatmen 4 Sekunden, halten 7 Sekunden, ausatmen 8 Sekunden. Gut für abends oder bei Unruhe.',
					category: 'breathing',
					breathPattern: { inhale: 4, hold: 7, exhale: 8, rest: 0 },
					defaultDurationSec: 300,
				},
			},
			{
				stableId: 'template-calmness:preset:bodyscan-10',
				data: {
					name: 'Body-Scan 10min',
					description:
						'Sanfte Aufmerksamkeits-Wanderung durch den Körper — von den Füßen bis zum Scheitel.',
					category: 'bodyscan',
					bodyScanSteps: [
						'Spüre deine Füße',
						'Spüre deine Beine',
						'Spüre dein Becken',
						'Spüre deinen Bauch',
						'Spüre deine Brust',
						'Spüre deine Arme',
						'Spüre deinen Nacken',
						'Spüre deinen Kopf',
						'Spüre deinen ganzen Körper',
					],
					defaultDurationSec: 600,
				},
			},
		],
	},
};
