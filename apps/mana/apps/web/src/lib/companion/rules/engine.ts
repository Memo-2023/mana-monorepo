/**
 * Pulse Rule Engine — Evaluates rules against projections and produces nudges.
 *
 * Integrates as a ReminderSource into the existing reminder scheduler.
 * Interval rules run every N minutes; schedule rules run once at specific hours.
 */

import { db } from '$lib/data/database';
import type { DaySnapshot, StreakInfo } from '$lib/data/projections/types';
import type { LocalGoal } from '../goals/types';
import type { PulseRule, RuleContext, Nudge } from './types';
import { DEFAULT_RULES } from './rules';

const DISMISSED_KEY = 'mana:dismissed-nudges';
const LAST_RUN_KEY = 'mana:pulse-last-run';

function getDismissed(): Set<string> {
	try {
		const raw = localStorage.getItem(DISMISSED_KEY);
		return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
	} catch {
		return new Set();
	}
}

export function dismissNudge(nudgeId: string): void {
	const dismissed = getDismissed();
	dismissed.add(nudgeId);
	// Keep only last 200 entries
	const arr = [...dismissed].slice(-200);
	localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr));
}

function getLastRun(): Record<string, number> {
	try {
		const raw = localStorage.getItem(LAST_RUN_KEY);
		return raw ? (JSON.parse(raw) as Record<string, number>) : {};
	} catch {
		return {};
	}
}

function setLastRun(ruleId: string, timestamp: number): void {
	const runs = getLastRun();
	runs[ruleId] = timestamp;
	localStorage.setItem(LAST_RUN_KEY, JSON.stringify(runs));
}

function shouldRun(rule: PulseRule, now: Date): boolean {
	const lastRun = getLastRun();
	const lastMs = lastRun[rule.id] ?? 0;
	const elapsedMs = now.getTime() - lastMs;

	if (rule.trigger.kind === 'interval') {
		return elapsedMs >= rule.trigger.minutes * 60 * 1000;
	}

	if (rule.trigger.kind === 'schedule') {
		const hour = now.getHours();
		if (!rule.trigger.hours.includes(hour)) return false;
		// Only run once per hour slot
		const lastHour = lastMs > 0 ? new Date(lastMs).getHours() : -1;
		const lastDate = lastMs > 0 ? new Date(lastMs).toDateString() : '';
		return lastHour !== hour || lastDate !== now.toDateString();
	}

	return false;
}

/**
 * Run all rules and return any nudges that should be shown.
 *
 * @param day     - Current DaySnapshot
 * @param streaks - Current streaks
 * @param goals   - Active goals
 * @param rules   - Rules to evaluate (defaults to built-in rules)
 */
export function evaluateRules(
	day: DaySnapshot,
	streaks: StreakInfo[],
	goals: LocalGoal[],
	rules: PulseRule[] = DEFAULT_RULES
): Nudge[] {
	const now = new Date();
	const dismissed = getDismissed();
	const ctx: RuleContext = {
		day,
		streaks,
		goals,
		now,
		hour: now.getHours(),
	};

	const nudges: Nudge[] = [];

	for (const rule of rules) {
		if (!shouldRun(rule, now)) continue;

		const nudge = rule.check(ctx);
		setLastRun(rule.id, now.getTime());

		if (nudge && !dismissed.has(nudge.id)) {
			nudges.push(nudge);
		}
	}

	return nudges;
}

/**
 * Create a ReminderSource adapter for the existing reminder scheduler.
 *
 * This bridges the Pulse Rule Engine into the existing infrastructure
 * so nudges appear as OS notifications via the notification service.
 */
export function createPulseReminderSource(
	getDay: () => DaySnapshot,
	getStreaks: () => StreakInfo[],
	getGoals: () => LocalGoal[]
) {
	return {
		id: 'companion-pulse',

		async checkDue() {
			const nudges = evaluateRules(getDay(), getStreaks(), getGoals());
			return nudges.map((n) => ({
				id: n.id,
				title: n.title,
				body: n.body,
				tag: `pulse-${n.type}`,
			}));
		},

		async markSent(id: string) {
			// Nudges are one-shot per ID (date+hour encoded)
			// No additional tracking needed beyond the lastRun mechanism
		},
	};
}
