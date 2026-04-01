/**
 * SkillTree module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalSkill, LocalActivity, LocalAchievement } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const skillTable = db.table<LocalSkill>('skills');
export const activityTable = db.table<LocalActivity>('activities');
export const achievementTable = db.table<LocalAchievement>('achievements');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_CODING_ID = 'demo-coding';
const DEMO_FITNESS_ID = 'demo-fitness';
const DEMO_CREATIVE_ID = 'demo-creative';

export const SKILLTREE_GUEST_SEED = {
	skills: [
		{
			id: DEMO_CODING_ID,
			name: 'Programmieren',
			description: 'Software-Entwicklung und Coding-Skills',
			branch: 'intellect' as const,
			icon: '💻',
			currentXp: 250,
			totalXp: 250,
			level: 1,
		},
		{
			id: DEMO_FITNESS_ID,
			name: 'Fitness',
			description: 'Körperliche Fitness und Training',
			branch: 'body' as const,
			icon: '💪',
			currentXp: 120,
			totalXp: 120,
			level: 1,
		},
		{
			id: DEMO_CREATIVE_ID,
			name: 'Zeichnen',
			description: 'Illustration, Skizzen und visuelles Denken',
			branch: 'creativity' as const,
			icon: '🎨',
			currentXp: 60,
			totalXp: 60,
			level: 0,
		},
	],
	activities: [
		{
			id: 'activity-1',
			skillId: DEMO_CODING_ID,
			xpEarned: 100,
			description: 'TypeScript-Projekt aufgesetzt',
			duration: 60,
			timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'activity-2',
			skillId: DEMO_FITNESS_ID,
			xpEarned: 50,
			description: '5 km Joggen im Park',
			duration: 35,
			timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'activity-3',
			skillId: DEMO_CODING_ID,
			xpEarned: 100,
			description: 'REST API mit Hono gebaut',
			duration: 90,
			timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'activity-4',
			skillId: DEMO_CREATIVE_ID,
			xpEarned: 60,
			description: 'Erste Skizzen mit Procreate',
			duration: 45,
			timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'activity-5',
			skillId: DEMO_FITNESS_ID,
			xpEarned: 70,
			description: 'Krafttraining — Oberkörper',
			duration: 50,
			timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			id: 'activity-6',
			skillId: DEMO_CODING_ID,
			xpEarned: 50,
			description: 'Unit Tests geschrieben',
			duration: 30,
			timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
		},
	],
	achievements: [
		{
			id: 'achievement-1',
			key: 'first-skill',
			name: 'Erste Schritte',
			description: 'Deinen ersten Skill erstellt',
			icon: '🌱',
			unlockedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
		},
	],
};
