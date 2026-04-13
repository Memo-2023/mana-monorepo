/**
 * Nudge Feedback Loop types.
 *
 * Tracks how users respond to nudges so the system can learn
 * which nudges are helpful and when to send them.
 */

import type { NudgeType } from '../rules/types';

export interface NudgeOutcome {
	id?: number; // auto-increment
	nudgeId: string;
	nudgeType: NudgeType;
	outcome: 'acted' | 'dismissed' | 'snoozed' | 'expired';
	/** Milliseconds between nudge shown and user reaction */
	latencyMs?: number;
	timestamp: string;
}
