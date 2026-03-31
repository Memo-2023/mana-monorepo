import { skillCollection, activityCollection, achievementCollection } from '$lib/data/local-store';

export async function exportData() {
	const [skills, activities, achievements] = await Promise.all([
		skillCollection.getAll(),
		activityCollection.getAll(),
		achievementCollection.getAll(),
	]);
	return { skills, activities, achievements, exportedAt: new Date().toISOString() };
}

export async function importData(data: {
	skills?: unknown[];
	activities?: unknown[];
	achievements?: unknown[];
}) {
	if (Array.isArray(data.skills)) {
		for (const skill of data.skills) {
			await skillCollection.insert(skill as never).catch(() => null);
		}
	}
	if (Array.isArray(data.activities)) {
		for (const activity of data.activities) {
			await activityCollection.insert(activity as never).catch(() => null);
		}
	}
	if (Array.isArray(data.achievements)) {
		for (const achievement of data.achievements) {
			await achievementCollection.insert(achievement as never).catch(() => null);
		}
	}
}
