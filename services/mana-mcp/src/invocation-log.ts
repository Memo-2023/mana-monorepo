/**
 * Per-user rolling invocation log, consumed by the policy gate's
 * rate-limiter. Pure in-memory — sessions are per-process in mana-mcp
 * and the rate-limit window is short (60s), so persistence is pointless.
 *
 * Each user gets their own ring buffer capped at `MAX_EVENTS`. We prune
 * older-than-window events opportunistically on every `append`, so the
 * buffer stays small.
 */

import { RATE_LIMIT_WINDOW_MS, type InvocationEvent } from '@mana/tool-registry';

const MAX_EVENTS_PER_USER = 512;

const logs = new Map<string, InvocationEvent[]>();

export function appendInvocation(userId: string, toolName: string, at: number = Date.now()): void {
	let events = logs.get(userId);
	if (!events) {
		events = [];
		logs.set(userId, events);
	}
	events.push({ toolName, at });

	// Drop events outside the window. Done in-place; O(n) per append is
	// acceptable at our event rates.
	const cutoff = at - RATE_LIMIT_WINDOW_MS;
	while (events.length > 0 && events[0].at < cutoff) {
		events.shift();
	}

	// Hard ceiling — protects against a burst-and-disconnect session that
	// would otherwise accumulate forever between periodic cleanups.
	if (events.length > MAX_EVENTS_PER_USER) {
		events.splice(0, events.length - MAX_EVENTS_PER_USER);
	}
}

export function getRecentInvocations(userId: string): readonly InvocationEvent[] {
	return logs.get(userId) ?? [];
}

/** Test-only — the log is a module-level singleton otherwise. */
export function __resetInvocationLogForTests(): void {
	logs.clear();
}
