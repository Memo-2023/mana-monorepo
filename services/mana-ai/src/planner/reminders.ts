/**
 * Per-round reminder producers for the mana-ai mission runner.
 *
 * Each producer is a small pure function that reads some snapshot (agent
 * state, mission metadata, tick-level usage counters) and returns a short
 * German string to inject as a `<reminder>` tag on the next LLM call.
 * Producers return `null` when there's nothing to say so the caller can
 * cleanly filter them out.
 *
 * Composition happens in `buildReminderChannel()` which wires the active
 * producers into a single `ReminderChannel` callback compatible with
 * `runPlannerLoop`'s new reminderChannel input. The loop invokes the
 * channel once per round; we re-evaluate every producer each round so
 * usage drift across rounds (rounds can accumulate 10k+ completion
 * tokens) shows up in the NEXT reminder.
 *
 * See `docs/plans/agent-loop-improvements-m1.md` §2 for the
 * Claude-Code `<system-reminder>` pattern this implements.
 */

import type { ReminderChannel } from '@mana/shared-ai';
import type { ServerAgent } from '../db/agents-projection';
import type { ServerMission } from '../db/missions-projection';

export interface ReminderContext {
	readonly agent: ServerAgent | null;
	readonly mission: ServerMission;
	/** Tokens already charged to this agent in the rolling 24h window
	 *  BEFORE the current mission run started. Round-level usage
	 *  accrual is tracked separately by the loop and added on top. */
	readonly pretickUsage24h: number;
}

/**
 * Warn when the agent is nearing its daily token cap. Threshold at 75 %
 * gives the planner room to wind down cleanly before the hard skip at
 * 100 % (enforced at tick-level, not here).
 *
 * Returns null for:
 *   - missions without an agent (legacy one-off missions)
 *   - agents without a cap (`maxTokensPerDay == null`)
 *   - usage below the warn threshold
 */
export function tokenBudgetReminder(ctx: ReminderContext, roundUsage: number): string | null {
	const cap = ctx.agent?.maxTokensPerDay;
	if (!ctx.agent || cap == null || cap <= 0) return null;

	const total = ctx.pretickUsage24h + roundUsage;
	const pct = total / cap;
	if (pct < 0.75) return null;

	const pctDisplay = Math.round(pct * 100);
	const agentName = ctx.agent.name;
	if (pct >= 1.0) {
		return (
			`Agent ${agentName} hat das Tagesbudget komplett ausgeschoepft ` +
			`(${total} / ${cap} Tokens = ${pctDisplay}%). Schliesse die ` +
			`Mission JETZT mit einer Summary ab — weitere Tool-Calls werden ` +
			`kurz nach diesem Turn vom Runner abgeschnitten.`
		);
	}
	return (
		`Agent ${agentName} hat ${pctDisplay}% des Tagesbudgets verbraucht ` +
		`(${total} / ${cap} Tokens). Plane sparsam — vermeide redundante ` +
		`Tool-Calls und liefere zuegig eine abschliessende Plan-Summary.`
	);
}

/**
 * Nudge the planner to end when it is clearly iterating without new
 * information: 3+ rounds in and the last 2 tool-calls returned
 * `success: false`. Heuristic guard against infinite retry loops where
 * the LLM keeps calling the same failing tool with slightly different
 * arguments.
 *
 * Reads the `recentCalls` sliding window from LoopState — the last 5
 * executed calls in oldest-first order. We only look at the tail 2
 * because a run that mixes failures and successes is not a true retry
 * loop, it's just flaky tools.
 */
export function retryLoopReminder(state: {
	readonly round: number;
	readonly recentCalls: readonly { readonly result: { readonly success: boolean } }[];
}): string | null {
	if (state.round < 3) return null;
	const tail = state.recentCalls.slice(-2);
	if (tail.length === 2 && tail.every((ec) => !ec.result.success)) {
		return (
			`Die letzten 2 Tool-Calls sind fehlgeschlagen. Brich die ` +
			`Wiederholung ab — formuliere stattdessen einen Summary-Text, ` +
			`der dem Nutzer erklaert, was schief lief.`
		);
	}
	return null;
}

/**
 * Build a ReminderChannel that runs every producer per round and returns
 * the concatenation of their non-null outputs. Each caller binds the
 * context with a closure; the loop only sees the callback.
 *
 * Ordering: token-budget first (most actionable), retry-loop second.
 * Additional producers should slot in before retry-loop unless they
 * explicitly supersede it.
 */
export function buildReminderChannel(ctx: ReminderContext): ReminderChannel {
	return (state) => {
		const out: string[] = [];
		const budget = tokenBudgetReminder(ctx, state.usage.totalTokens);
		if (budget) out.push(budget);
		const retry = retryLoopReminder({ round: state.round, recentCalls: state.recentCalls });
		if (retry) out.push(retry);
		return out;
	};
}
