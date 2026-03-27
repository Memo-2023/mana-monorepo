/**
 * Guest seed data for the SkilltTree app.
 *
 * Provides a demo skill with an activity to showcase the leveling system.
 */

import type { LocalSkill, LocalActivity } from './local-store';

const DEMO_SKILL_ID = 'demo-coding';

export const guestSkills: LocalSkill[] = [
	{
		id: DEMO_SKILL_ID,
		name: 'Programmieren',
		description: 'Software-Entwicklung und Coding-Skills',
		branch: 'intellect',
		icon: '💻',
		currentXp: 150,
		totalXp: 150,
		level: 1,
	},
	{
		id: 'demo-fitness',
		name: 'Fitness',
		description: 'Körperliche Fitness und Training',
		branch: 'body',
		icon: '💪',
		currentXp: 50,
		totalXp: 50,
		level: 0,
	},
];

export const guestActivities: LocalActivity[] = [
	{
		id: 'activity-1',
		skillId: DEMO_SKILL_ID,
		xpEarned: 100,
		description: 'TypeScript-Projekt aufgesetzt',
		duration: 60,
		timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
	},
	{
		id: 'activity-2',
		skillId: DEMO_SKILL_ID,
		xpEarned: 50,
		description: 'Unit Tests geschrieben',
		duration: 30,
		timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
	},
];
