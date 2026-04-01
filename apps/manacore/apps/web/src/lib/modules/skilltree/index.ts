/**
 * SkillTree module — barrel exports.
 */

export { skillStore } from './stores/skills.svelte';
export {
	achievementStore,
	buildAchievementStatus,
	getUnlockedAchievements,
	getLockedAchievements,
	getAchievementsByCategory,
	getAchievementStats,
	getCompletionPercentage,
} from './stores/achievements.svelte';
export {
	useAllSkills,
	useAllActivities,
	useAllAchievements,
	toSkill,
	toActivity,
	groupByBranch,
	getTopSkills,
	getRecentActivities,
	computeBranchStats,
	calculateStreak,
	computeUserStats,
	filterByBranch,
	getSkillById,
	getSkillActivities,
} from './queries';
export { skillTable, activityTable, achievementTable, SKILLTREE_GUEST_SEED } from './collections';
export type {
	LocalSkill,
	LocalActivity,
	LocalAchievement,
	Skill,
	Activity,
	SkillBranch,
	UserStats,
	AchievementCategory,
	AchievementRarity,
	AchievementCondition,
	Achievement,
	AchievementWithStatus,
	AchievementUnlockResult,
} from './types';
export {
	LEVEL_THRESHOLDS,
	LEVEL_NAMES,
	BRANCH_INFO,
	RARITY_INFO,
	ACHIEVEMENT_CATEGORY_INFO,
	ACHIEVEMENT_DEFINITIONS,
	calculateLevel,
	xpForNextLevel,
	xpProgress,
	createDefaultSkill,
	createActivity,
} from './types';
