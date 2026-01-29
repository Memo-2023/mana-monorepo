import { openDB, type IDBPDatabase } from 'idb';
import type { Skill, Activity, UserStats } from '$lib/types';

interface SkillTreeDB {
	skills: {
		key: string;
		value: Skill;
		indexes: {
			'by-branch': string;
			'by-parent': string | null;
			'by-level': number;
		};
	};
	activities: {
		key: string;
		value: Activity;
		indexes: {
			'by-skill': string;
			'by-timestamp': string;
		};
	};
	stats: {
		key: 'user-stats';
		value: UserStats;
	};
}

const DB_NAME = 'skilltree-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SkillTreeDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SkillTreeDB>> {
	if (!dbPromise) {
		dbPromise = openDB<SkillTreeDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				// Skills store
				if (!db.objectStoreNames.contains('skills')) {
					const skillStore = db.createObjectStore('skills', { keyPath: 'id' });
					skillStore.createIndex('by-branch', 'branch');
					skillStore.createIndex('by-parent', 'parentId');
					skillStore.createIndex('by-level', 'level');
				}

				// Activities store
				if (!db.objectStoreNames.contains('activities')) {
					const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
					activityStore.createIndex('by-skill', 'skillId');
					activityStore.createIndex('by-timestamp', 'timestamp');
				}

				// Stats store
				if (!db.objectStoreNames.contains('stats')) {
					db.createObjectStore('stats');
				}
			},
		});
	}
	return dbPromise;
}

// Skills CRUD
export async function getAllSkills(): Promise<Skill[]> {
	const db = await getDB();
	return db.getAll('skills');
}

export async function getSkillById(id: string): Promise<Skill | undefined> {
	const db = await getDB();
	return db.get('skills', id);
}

export async function getSkillsByBranch(branch: string): Promise<Skill[]> {
	const db = await getDB();
	return db.getAllFromIndex('skills', 'by-branch', branch);
}

export async function getChildSkills(parentId: string): Promise<Skill[]> {
	const db = await getDB();
	return db.getAllFromIndex('skills', 'by-parent', parentId);
}

export async function saveSkill(skill: Skill): Promise<void> {
	const db = await getDB();
	skill.updatedAt = new Date().toISOString();
	await db.put('skills', skill);
}

export async function deleteSkill(id: string): Promise<void> {
	const db = await getDB();
	// Delete skill and all its activities
	const activities = await db.getAllFromIndex('activities', 'by-skill', id);
	const tx = db.transaction(['skills', 'activities'], 'readwrite');
	await Promise.all([
		tx.objectStore('skills').delete(id),
		...activities.map((a) => tx.objectStore('activities').delete(a.id)),
	]);
	await tx.done;
}

// Activities CRUD
export async function getAllActivities(): Promise<Activity[]> {
	const db = await getDB();
	return db.getAll('activities');
}

export async function getActivitiesBySkill(skillId: string): Promise<Activity[]> {
	const db = await getDB();
	return db.getAllFromIndex('activities', 'by-skill', skillId);
}

export async function getRecentActivities(limit = 10): Promise<Activity[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('activities', 'by-timestamp');
	return all.reverse().slice(0, limit);
}

export async function saveActivity(activity: Activity): Promise<void> {
	const db = await getDB();
	await db.put('activities', activity);
}

export async function deleteActivity(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('activities', id);
}

// User Stats
export async function getUserStats(): Promise<UserStats> {
	const db = await getDB();
	const stats = await db.get('stats', 'user-stats');
	return (
		stats ?? {
			totalXp: 0,
			totalSkills: 0,
			highestLevel: 0,
			streakDays: 0,
			lastActivityDate: null,
		}
	);
}

export async function saveUserStats(stats: UserStats): Promise<void> {
	const db = await getDB();
	await db.put('stats', stats, 'user-stats');
}

// Utility: Recalculate stats from all skills
export async function recalculateStats(): Promise<UserStats> {
	const skills = await getAllSkills();
	const activities = await getAllActivities();

	const stats: UserStats = {
		totalXp: skills.reduce((sum, s) => sum + s.totalXp, 0),
		totalSkills: skills.length,
		highestLevel: skills.reduce((max, s) => Math.max(max, s.level), 0),
		streakDays: calculateStreak(activities),
		lastActivityDate: activities.length > 0 ? activities[activities.length - 1].timestamp : null,
	};

	await saveUserStats(stats);
	return stats;
}

function calculateStreak(activities: Activity[]): number {
	if (activities.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const sortedDates = activities
		.map((a) => {
			const d = new Date(a.timestamp);
			d.setHours(0, 0, 0, 0);
			return d.getTime();
		})
		.filter((v, i, a) => a.indexOf(v) === i) // unique dates
		.sort((a, b) => b - a); // newest first

	let streak = 0;
	let expectedDate = today.getTime();

	for (const date of sortedDates) {
		if (date === expectedDate || date === expectedDate - 86400000) {
			streak++;
			expectedDate = date - 86400000;
		} else if (date < expectedDate - 86400000) {
			break;
		}
	}

	return streak;
}

// Export all data (for backup)
export async function exportData(): Promise<{
	skills: Skill[];
	activities: Activity[];
	stats: UserStats;
}> {
	const [skills, activities, stats] = await Promise.all([
		getAllSkills(),
		getAllActivities(),
		getUserStats(),
	]);
	return { skills, activities, stats };
}

// Import data (restore backup)
export async function importData(data: {
	skills: Skill[];
	activities: Activity[];
	stats: UserStats;
}): Promise<void> {
	const db = await getDB();
	const tx = db.transaction(['skills', 'activities', 'stats'], 'readwrite');

	// Clear existing data
	await tx.objectStore('skills').clear();
	await tx.objectStore('activities').clear();

	// Import new data
	for (const skill of data.skills) {
		await tx.objectStore('skills').put(skill);
	}
	for (const activity of data.activities) {
		await tx.objectStore('activities').put(activity);
	}
	await tx.objectStore('stats').put(data.stats, 'user-stats');

	await tx.done;
}
