import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	calculateLevel,
	xpForNextLevel,
	xpProgress,
	createDefaultSkill,
	createActivity,
	LEVEL_THRESHOLDS,
	LEVEL_NAMES,
	BRANCH_INFO,
	type Skill,
	type SkillBranch,
} from './index';

describe('Level System', () => {
	describe('calculateLevel', () => {
		it('should return level 0 for 0 XP', () => {
			expect(calculateLevel(0)).toBe(0);
		});

		it('should return level 0 for XP below 100', () => {
			expect(calculateLevel(50)).toBe(0);
			expect(calculateLevel(99)).toBe(0);
		});

		it('should return level 1 for XP between 100 and 499', () => {
			expect(calculateLevel(100)).toBe(1);
			expect(calculateLevel(250)).toBe(1);
			expect(calculateLevel(499)).toBe(1);
		});

		it('should return level 2 for XP between 500 and 1499', () => {
			expect(calculateLevel(500)).toBe(2);
			expect(calculateLevel(1000)).toBe(2);
			expect(calculateLevel(1499)).toBe(2);
		});

		it('should return level 3 for XP between 1500 and 3999', () => {
			expect(calculateLevel(1500)).toBe(3);
			expect(calculateLevel(2500)).toBe(3);
			expect(calculateLevel(3999)).toBe(3);
		});

		it('should return level 4 for XP between 4000 and 9999', () => {
			expect(calculateLevel(4000)).toBe(4);
			expect(calculateLevel(7000)).toBe(4);
			expect(calculateLevel(9999)).toBe(4);
		});

		it('should return level 5 (max) for XP 10000 and above', () => {
			expect(calculateLevel(10000)).toBe(5);
			expect(calculateLevel(50000)).toBe(5);
			expect(calculateLevel(1000000)).toBe(5);
		});

		it('should handle negative XP by returning 0', () => {
			expect(calculateLevel(-100)).toBe(0);
		});
	});

	describe('xpForNextLevel', () => {
		it('should return 100 XP for level 0', () => {
			expect(xpForNextLevel(0)).toBe(100);
		});

		it('should return 500 XP for level 1', () => {
			expect(xpForNextLevel(1)).toBe(500);
		});

		it('should return 1500 XP for level 2', () => {
			expect(xpForNextLevel(2)).toBe(1500);
		});

		it('should return 4000 XP for level 3', () => {
			expect(xpForNextLevel(3)).toBe(4000);
		});

		it('should return 10000 XP for level 4', () => {
			expect(xpForNextLevel(4)).toBe(10000);
		});

		it('should return Infinity for max level (5)', () => {
			expect(xpForNextLevel(5)).toBe(Infinity);
		});

		it('should return Infinity for levels beyond max', () => {
			expect(xpForNextLevel(6)).toBe(Infinity);
			expect(xpForNextLevel(100)).toBe(Infinity);
		});
	});

	describe('xpProgress', () => {
		it('should return 0% at level threshold', () => {
			expect(xpProgress(0, 0)).toBe(0);
			expect(xpProgress(100, 1)).toBe(0);
			expect(xpProgress(500, 2)).toBe(0);
		});

		it('should return 50% at midpoint', () => {
			// Level 0: 0-100, midpoint is 50
			expect(xpProgress(50, 0)).toBe(50);
			// Level 1: 100-500, midpoint is 300
			expect(xpProgress(300, 1)).toBe(50);
		});

		it('should return close to 100% near next threshold', () => {
			expect(xpProgress(99, 0)).toBeCloseTo(99, 0);
			expect(xpProgress(499, 1)).toBeCloseTo(99.75, 1);
		});

		it('should return 100% for max level', () => {
			expect(xpProgress(10000, 5)).toBe(100);
			expect(xpProgress(50000, 5)).toBe(100);
		});

		it('should clamp progress between 0 and 100', () => {
			// Progress should never exceed 100
			expect(xpProgress(200, 0)).toBeLessThanOrEqual(100);
			// Progress should never be negative
			expect(xpProgress(-10, 0)).toBeGreaterThanOrEqual(0);
		});

		it('should calculate correct progress for level 2', () => {
			// Level 2: 500-1500 (range of 1000)
			// At 750 XP: (750-500)/(1500-500) = 250/1000 = 25%
			expect(xpProgress(750, 2)).toBe(25);
		});
	});

	describe('LEVEL_THRESHOLDS', () => {
		it('should have 6 levels (0-5)', () => {
			expect(LEVEL_THRESHOLDS).toHaveLength(6);
		});

		it('should start at 0', () => {
			expect(LEVEL_THRESHOLDS[0]).toBe(0);
		});

		it('should be in ascending order', () => {
			for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
				expect(LEVEL_THRESHOLDS[i]).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]);
			}
		});

		it('should have expected values', () => {
			expect(LEVEL_THRESHOLDS).toEqual([0, 100, 500, 1500, 4000, 10000]);
		});
	});

	describe('LEVEL_NAMES', () => {
		it('should have a name for each level', () => {
			expect(LEVEL_NAMES).toHaveLength(6);
		});

		it('should have German names', () => {
			expect(LEVEL_NAMES[0]).toBe('Unbekannt');
			expect(LEVEL_NAMES[1]).toBe('Anfänger');
			expect(LEVEL_NAMES[2]).toBe('Fortgeschritten');
			expect(LEVEL_NAMES[3]).toBe('Kompetent');
			expect(LEVEL_NAMES[4]).toBe('Experte');
			expect(LEVEL_NAMES[5]).toBe('Meister');
		});
	});
});

describe('Branch System', () => {
	describe('BRANCH_INFO', () => {
		const branches: SkillBranch[] = [
			'intellect',
			'body',
			'creativity',
			'social',
			'practical',
			'mindset',
			'custom',
		];

		it('should have info for all 7 branches', () => {
			expect(Object.keys(BRANCH_INFO)).toHaveLength(7);
		});

		it.each(branches)('should have complete info for %s branch', (branch) => {
			const info = BRANCH_INFO[branch];
			expect(info).toBeDefined();
			expect(info.name).toBeTruthy();
			expect(info.icon).toBeTruthy();
			expect(info.color).toBeTruthy();
			expect(info.description).toBeTruthy();
		});

		it('should have German names', () => {
			expect(BRANCH_INFO.intellect.name).toBe('Intellekt');
			expect(BRANCH_INFO.body.name).toBe('Körper');
			expect(BRANCH_INFO.creativity.name).toBe('Kreativität');
			expect(BRANCH_INFO.social.name).toBe('Sozial');
			expect(BRANCH_INFO.practical.name).toBe('Praktisch');
			expect(BRANCH_INFO.mindset.name).toBe('Mindset');
			expect(BRANCH_INFO.custom.name).toBe('Eigene');
		});

		it('should have correct icons', () => {
			expect(BRANCH_INFO.intellect.icon).toBe('brain');
			expect(BRANCH_INFO.body.icon).toBe('dumbbell');
			expect(BRANCH_INFO.creativity.icon).toBe('palette');
			expect(BRANCH_INFO.social.icon).toBe('users');
			expect(BRANCH_INFO.practical.icon).toBe('wrench');
			expect(BRANCH_INFO.mindset.icon).toBe('heart');
			expect(BRANCH_INFO.custom.icon).toBe('star');
		});
	});
});

describe('Factory Functions', () => {
	describe('createDefaultSkill', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-01-28T12:00:00Z'));
		});

		it('should create a skill with default values', () => {
			const skill = createDefaultSkill();

			expect(skill.id).toBeTruthy();
			expect(skill.name).toBe('');
			expect(skill.description).toBe('');
			expect(skill.branch).toBe('custom');
			expect(skill.parentId).toBeNull();
			expect(skill.icon).toBe('star');
			expect(skill.color).toBeNull();
			expect(skill.currentXp).toBe(0);
			expect(skill.totalXp).toBe(0);
			expect(skill.level).toBe(0);
		});

		it('should generate unique IDs', () => {
			const skill1 = createDefaultSkill();
			const skill2 = createDefaultSkill();
			expect(skill1.id).not.toBe(skill2.id);
		});

		it('should set timestamps', () => {
			const skill = createDefaultSkill();
			expect(skill.createdAt).toBeTruthy();
			expect(skill.updatedAt).toBeTruthy();
			expect(skill.createdAt).toBe(skill.updatedAt);
		});

		it('should merge partial values', () => {
			const skill = createDefaultSkill({
				name: 'TypeScript',
				description: 'Learn TypeScript',
				branch: 'intellect',
				totalXp: 500,
				level: 2,
			});

			expect(skill.name).toBe('TypeScript');
			expect(skill.description).toBe('Learn TypeScript');
			expect(skill.branch).toBe('intellect');
			expect(skill.totalXp).toBe(500);
			expect(skill.level).toBe(2);
			// Default values should still be set
			expect(skill.icon).toBe('star');
			expect(skill.parentId).toBeNull();
		});

		it('should allow overriding all fields', () => {
			const customSkill: Partial<Skill> = {
				id: 'custom-id',
				name: 'Custom Skill',
				description: 'A custom skill',
				branch: 'body',
				parentId: 'parent-123',
				icon: 'star',
				color: '#FF0000',
				currentXp: 100,
				totalXp: 100,
				level: 1,
			};

			const skill = createDefaultSkill(customSkill);

			expect(skill.id).toBe('custom-id');
			expect(skill.name).toBe('Custom Skill');
			expect(skill.parentId).toBe('parent-123');
			expect(skill.color).toBe('#FF0000');
		});
	});

	describe('createActivity', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-01-28T12:00:00Z'));
		});

		it('should create an activity with required fields', () => {
			const activity = createActivity('skill-123', 50, 'Practiced for 30 minutes');

			expect(activity.id).toBeTruthy();
			expect(activity.skillId).toBe('skill-123');
			expect(activity.xpEarned).toBe(50);
			expect(activity.description).toBe('Practiced for 30 minutes');
			expect(activity.duration).toBeNull();
			expect(activity.timestamp).toBeTruthy();
		});

		it('should include duration when provided', () => {
			const activity = createActivity('skill-123', 100, 'Long session', 60);

			expect(activity.duration).toBe(60);
		});

		it('should set duration to null when undefined', () => {
			const activity = createActivity('skill-123', 25, 'Quick practice', undefined);

			expect(activity.duration).toBeNull();
		});

		it('should generate unique IDs', () => {
			const activity1 = createActivity('skill-1', 10, 'Activity 1');
			const activity2 = createActivity('skill-1', 10, 'Activity 2');

			expect(activity1.id).not.toBe(activity2.id);
		});

		it('should set current timestamp', () => {
			const activity = createActivity('skill-123', 10, 'Test');
			const expectedTime = new Date('2026-01-28T12:00:00Z').toISOString();

			expect(activity.timestamp).toBe(expectedTime);
		});

		it('should handle zero XP', () => {
			const activity = createActivity('skill-123', 0, 'Just a note');

			expect(activity.xpEarned).toBe(0);
		});

		it('should handle large XP values', () => {
			const activity = createActivity('skill-123', 10000, 'Major milestone');

			expect(activity.xpEarned).toBe(10000);
		});
	});
});

describe('Edge Cases', () => {
	describe('Level calculations with boundary values', () => {
		it('should handle exact threshold values', () => {
			expect(calculateLevel(100)).toBe(1);
			expect(calculateLevel(500)).toBe(2);
			expect(calculateLevel(1500)).toBe(3);
			expect(calculateLevel(4000)).toBe(4);
			expect(calculateLevel(10000)).toBe(5);
		});

		it('should handle one below threshold', () => {
			expect(calculateLevel(99)).toBe(0);
			expect(calculateLevel(499)).toBe(1);
			expect(calculateLevel(1499)).toBe(2);
			expect(calculateLevel(3999)).toBe(3);
			expect(calculateLevel(9999)).toBe(4);
		});
	});

	describe('Progress calculations at boundaries', () => {
		it('should handle zero XP at level 0', () => {
			expect(xpProgress(0, 0)).toBe(0);
		});

		it('should handle XP exactly at level-up', () => {
			// When XP equals next threshold, progress should be 100% for current level
			// But calculateLevel would put them at next level
			// This tests the edge case
			expect(xpProgress(100, 0)).toBe(100);
		});
	});
});
