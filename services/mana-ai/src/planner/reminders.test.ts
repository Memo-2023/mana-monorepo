import { describe, expect, it } from 'bun:test';
import {
	buildReminderChannel,
	compactedReminder,
	retryLoopReminder,
	tokenBudgetReminder,
	type ReminderContext,
} from './reminders';
import type { ServerAgent } from '../db/agents-projection';
import type { ServerMission } from '../db/missions-projection';
import type { LoopState } from '@mana/shared-ai';

// ─── Fixtures ──────────────────────────────────────────────────────

function makeAgent(overrides: Partial<ServerAgent> = {}): ServerAgent {
	return {
		id: 'agent-1',
		userId: 'user-1',
		spaceId: 'space-1',
		name: 'Mana',
		role: null,
		systemPrompt: null,
		memory: null,
		state: 'active',
		maxTokensPerDay: 100_000,
		maxConcurrentMissions: 3,
		policy: null,
		updatedAt: '2026-04-23T00:00:00Z',
		...overrides,
	} as ServerAgent;
}

function makeMission(overrides: Partial<ServerMission> = {}): ServerMission {
	return {
		id: 'mission-1',
		userId: 'user-1',
		spaceId: 'space-1',
		title: 'Test',
		objective: 'Do the thing',
		state: 'active',
		nextRunAt: '2026-04-23T00:00:00Z',
		iterations: [],
		agentId: 'agent-1',
		...overrides,
	} as ServerMission;
}

function makeState(overrides: Partial<LoopState> = {}): LoopState {
	return {
		round: 1,
		toolCallCount: 0,
		usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
		recentCalls: [],
		compactionsDone: 0,
		...overrides,
	};
}

function mkExecutedCall(
	success: boolean,
	toolName = 'create_thing'
): {
	round: number;
	call: { id: string; name: string; arguments: Record<string, unknown> };
	result: { success: boolean; message: string };
} {
	return {
		round: 1,
		call: { id: crypto.randomUUID(), name: toolName, arguments: {} },
		result: { success, message: success ? 'ok' : 'boom' },
	};
}

// ─── tokenBudgetReminder ──────────────────────────────────────────

describe('tokenBudgetReminder', () => {
	it('returns null when agent has no cap', () => {
		const ctx: ReminderContext = {
			agent: makeAgent({ maxTokensPerDay: null as unknown as number }),
			mission: makeMission(),
			pretickUsage24h: 50_000,
		};
		expect(tokenBudgetReminder(ctx, 10_000)).toBeNull();
	});

	it('returns null when agent is absent (legacy mission)', () => {
		const ctx: ReminderContext = { agent: null, mission: makeMission(), pretickUsage24h: 0 };
		expect(tokenBudgetReminder(ctx, 99_000)).toBeNull();
	});

	it('returns null below 75% utilisation', () => {
		const ctx: ReminderContext = {
			agent: makeAgent({ maxTokensPerDay: 100_000 }),
			mission: makeMission(),
			pretickUsage24h: 50_000,
		};
		expect(tokenBudgetReminder(ctx, 20_000)).toBeNull(); // 70%
	});

	it('warns at the 75% threshold with severity=warn', () => {
		const ctx: ReminderContext = {
			agent: makeAgent({ maxTokensPerDay: 100_000 }),
			mission: makeMission(),
			pretickUsage24h: 50_000,
		};
		const r = tokenBudgetReminder(ctx, 25_000); // 75%
		expect(r).not.toBeNull();
		expect(r!.severity).toBe('warn');
		expect(r!.producer).toBe('token-budget');
		expect(r!.text).toContain('75%');
		expect(r!.text).toContain('Mana');
	});

	it('escalates at/above 100% with severity=escalate', () => {
		const ctx: ReminderContext = {
			agent: makeAgent({ maxTokensPerDay: 100_000 }),
			mission: makeMission(),
			pretickUsage24h: 90_000,
		};
		const r = tokenBudgetReminder(ctx, 15_000); // 105%
		expect(r).not.toBeNull();
		expect(r!.severity).toBe('escalate');
		expect(r!.text).toContain('ausgeschoepft');
		expect(r!.text).toContain('JETZT');
	});

	it('adds pretick and round usage correctly', () => {
		const ctx: ReminderContext = {
			agent: makeAgent({ maxTokensPerDay: 100_000 }),
			mission: makeMission(),
			pretickUsage24h: 80_000,
		};
		// 80k + 0k = 80% → warns
		expect(tokenBudgetReminder(ctx, 0)?.severity).toBe('warn');
		// 80k + 20k = 100% → escalates
		expect(tokenBudgetReminder(ctx, 20_000)?.severity).toBe('escalate');
	});
});

// ─── retryLoopReminder ────────────────────────────────────────────

describe('retryLoopReminder', () => {
	it('is silent before round 3', () => {
		expect(
			retryLoopReminder({
				round: 2,
				recentCalls: [mkExecutedCall(false), mkExecutedCall(false)],
			})
		).toBeNull();
	});

	it('warns when the last 2 calls failed at round >= 3 with severity=warn', () => {
		const r = retryLoopReminder({
			round: 3,
			recentCalls: [mkExecutedCall(false), mkExecutedCall(false)],
		});
		expect(r).not.toBeNull();
		expect(r!.severity).toBe('warn');
		expect(r!.producer).toBe('retry-loop');
		expect(r!.text).toContain('fehlgeschlagen');
	});

	it('stays silent when only one of the last 2 failed', () => {
		expect(
			retryLoopReminder({
				round: 4,
				recentCalls: [mkExecutedCall(true), mkExecutedCall(false)],
			})
		).toBeNull();
	});

	it('stays silent with fewer than 2 calls recorded', () => {
		expect(retryLoopReminder({ round: 5, recentCalls: [mkExecutedCall(false)] })).toBeNull();
	});

	it('looks only at the TAIL 2 — a flaky run with intermittent success is not a retry loop', () => {
		// 5 calls: F, F, F, OK, F → tail-2 is [OK, F] → silent
		expect(
			retryLoopReminder({
				round: 5,
				recentCalls: [
					mkExecutedCall(false),
					mkExecutedCall(false),
					mkExecutedCall(false),
					mkExecutedCall(true),
					mkExecutedCall(false),
				],
			})
		).toBeNull();
	});
});

// ─── compactedReminder ────────────────────────────────────────────

describe('compactedReminder', () => {
	it('is silent when no compaction has happened', () => {
		expect(compactedReminder({ compactionsDone: 0 })).toBeNull();
	});

	it('fires once compactionsDone >= 1 with severity=info', () => {
		const r = compactedReminder({ compactionsDone: 1 });
		expect(r).not.toBeNull();
		expect(r!.severity).toBe('info');
		expect(r!.producer).toBe('compacted');
		expect(r!.text).toContain('compact-summary');
		expect(r!.text).toContain('frag nicht');
	});

	it('fires for counts greater than 1 too (future multi-compact)', () => {
		expect(compactedReminder({ compactionsDone: 3 })).not.toBeNull();
	});
});

// ─── buildReminderChannel — composition ───────────────────────────

describe('buildReminderChannel', () => {
	it('returns an empty array when no producer fires', () => {
		const channel = buildReminderChannel({
			agent: makeAgent({ maxTokensPerDay: 100_000 }),
			mission: makeMission(),
			pretickUsage24h: 0,
		});
		expect(channel(makeState())).toEqual([]);
	});

	it('surfaces the budget reminder when usage is high', () => {
		const channel = buildReminderChannel({
			agent: makeAgent({ maxTokensPerDay: 10_000 }),
			mission: makeMission(),
			pretickUsage24h: 8_000,
		});
		const out = channel(
			makeState({ usage: { promptTokens: 500, completionTokens: 500, totalTokens: 1_000 } })
		);
		expect(out).toHaveLength(1);
		expect(out[0]).toContain('90%');
	});

	it('fires retryLoopReminder end-to-end through the channel', () => {
		const channel = buildReminderChannel({
			agent: makeAgent({ maxTokensPerDay: 1_000_000 }), // budget silent
			mission: makeMission(),
			pretickUsage24h: 0,
		});
		const out = channel(
			makeState({
				round: 4,
				recentCalls: [mkExecutedCall(false), mkExecutedCall(false)],
			})
		);
		expect(out).toHaveLength(1);
		expect(out[0]).toContain('fehlgeschlagen');
	});

	it('puts compacted reminder FIRST when it fires alongside budget warning', () => {
		const channel = buildReminderChannel({
			agent: makeAgent({ maxTokensPerDay: 10_000 }),
			mission: makeMission(),
			pretickUsage24h: 9_000, // triggers budget warn
		});
		const out = channel(
			makeState({
				round: 2,
				compactionsDone: 1,
				usage: { promptTokens: 500, completionTokens: 500, totalTokens: 1_000 },
			})
		);
		expect(out).toHaveLength(2);
		expect(out[0]).toContain('compact-summary'); // compacted first
		expect(out[1]).toContain('Tagesbudget'); // budget second
	});

	it('can fire budget + retry together (composition)', () => {
		const channel = buildReminderChannel({
			agent: makeAgent({ maxTokensPerDay: 10_000 }),
			mission: makeMission(),
			pretickUsage24h: 9_000,
		});
		const out = channel(
			makeState({
				round: 3,
				usage: { promptTokens: 500, completionTokens: 500, totalTokens: 1_000 },
				recentCalls: [mkExecutedCall(false), mkExecutedCall(false)],
			})
		);
		expect(out).toHaveLength(2);
		expect(out[0]).toContain('ausgeschoepft'); // budget first
		expect(out[1]).toContain('fehlgeschlagen'); // retry second
	});

	it('uses the updated totalTokens each round (re-evaluated)', () => {
		const channel = buildReminderChannel({
			agent: makeAgent({ maxTokensPerDay: 10_000 }),
			mission: makeMission(),
			pretickUsage24h: 5_000,
		});
		// Round 1 — 50% → silent
		expect(channel(makeState())).toEqual([]);
		// Round 2 — 5k + 3k = 80% → warns
		const round2 = channel(
			makeState({
				round: 2,
				usage: { promptTokens: 1500, completionTokens: 1500, totalTokens: 3_000 },
			})
		);
		expect(round2).toHaveLength(1);
		expect(round2[0]).toContain('80%');
	});
});
