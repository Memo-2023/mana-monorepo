/**
 * Pulse Rule Engine types.
 *
 * Rules are deterministic (no LLM) and produce Nudges from projections.
 */

import type { DaySnapshot, StreakInfo } from '$lib/data/projections/types';
import type { LocalGoal } from '../goals/types';

export interface PulseRule {
	id: string;
	name: string;
	/** When to check */
	trigger: { kind: 'interval'; minutes: number } | { kind: 'schedule'; hours: number[] }; // e.g. [8, 18] = 08:00 and 18:00
	/** Returns a Nudge if action needed, null otherwise */
	check: (ctx: RuleContext) => Nudge | null;
}

export interface RuleContext {
	day: DaySnapshot;
	streaks: StreakInfo[];
	goals: LocalGoal[];
	now: Date;
	hour: number; // 0-23
}

export interface Nudge {
	id: string;
	type: NudgeType;
	title: string;
	body: string;
	priority: 'low' | 'medium' | 'high';
	/** Button label */
	actionLabel?: string;
	/** Route to navigate to */
	actionRoute?: string;
	/** Tool name for Companion to execute */
	actionTool?: string;
	/** When this nudge becomes irrelevant */
	expiresAt?: string;
}

export type NudgeType =
	| 'streak_warning'
	| 'goal_progress'
	| 'goal_reached'
	| 'morning_summary'
	| 'overdue_tasks'
	| 'water_reminder'
	| 'meal_reminder';
