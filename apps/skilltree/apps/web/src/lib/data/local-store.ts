/**
 * SkilltTree — Local-First Data Layer (via @manacore/local-store)
 *
 * Adds unified sync support alongside the existing idb-based IndexedDB storage.
 * Skills, activities, and achievements are synced to the server when authenticated.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestSkills, guestActivities, guestAchievements } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalSkill extends BaseRecord {
	name: string;
	description: string;
	branch: 'intellect' | 'body' | 'creativity' | 'social' | 'practical' | 'mindset' | 'custom';
	parentId?: string | null;
	icon: string;
	color?: string | null;
	currentXp: number;
	totalXp: number;
	level: number;
}

export interface LocalActivity extends BaseRecord {
	skillId: string;
	xpEarned: number;
	description: string;
	duration?: number | null;
	timestamp: string;
}

export interface LocalAchievement extends BaseRecord {
	key: string;
	name: string;
	description: string;
	icon: string;
	unlockedAt: string;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const skilltreeStore = createLocalStore({
	appId: 'skilltree',
	collections: [
		{
			name: 'skills',
			indexes: ['branch', 'parentId', 'level'],
			guestSeed: guestSkills,
		},
		{
			name: 'activities',
			indexes: ['skillId', 'timestamp'],
			guestSeed: guestActivities,
		},
		{
			name: 'achievements',
			indexes: ['key', 'unlockedAt'],
			guestSeed: guestAchievements,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const skillCollection = skilltreeStore.collection<LocalSkill>('skills');
export const activityCollection = skilltreeStore.collection<LocalActivity>('activities');
export const achievementCollection = skilltreeStore.collection<LocalAchievement>('achievements');
