/**
 * Tick orchestrator.
 *
 * One `tick()` cycle:
 *   1. Ask mana-auth which personas are due.
 *   2. Run up to N in parallel (N = config.concurrency).
 *   3. Per persona: login → resolve space → claude-main → claude-rating
 *      → POST actions + feedback back to mana-auth.
 *
 * Errors in one persona don't stop the others — each persona is
 * wrapped in try/catch, and the outer tick swallows individual failures
 * while still reporting tick-level success.
 */

import type { Config } from '../config.ts';
import type { AuthClient } from '../clients/auth.ts';
import type { ManaAuthInternalClient, DuePersona } from '../clients/mana-auth-internal.ts';
import { personaPassword } from '../password.ts';
import { newTickId, runMainTurn, runRatingTurn, type SessionInput } from './claude-session.ts';

export interface TickDependencies {
	config: Config;
	auth: AuthClient;
	internal: ManaAuthInternalClient;
}

export interface TickResult {
	due: number;
	ranSuccessfully: number;
	failed: Array<{ persona: string; error: string }>;
	durationMs: number;
}

export async function tick(deps: TickDependencies): Promise<TickResult> {
	const start = Date.now();

	if (deps.config.paused) {
		return { due: 0, ranSuccessfully: 0, failed: [], durationMs: 0 };
	}

	const due = await deps.internal.listDuePersonas();
	if (due.length === 0) {
		return { due: 0, ranSuccessfully: 0, failed: [], durationMs: Date.now() - start };
	}

	const failed: TickResult['failed'] = [];
	let success = 0;

	// Simple semaphore: process in chunks of `concurrency`. For M3 scale
	// (tens of personas) this is good enough; a proper worker-pool can
	// come later.
	const batchSize = Math.max(1, deps.config.concurrency);
	for (let i = 0; i < due.length; i += batchSize) {
		const batch = due.slice(i, i + batchSize);
		const outcomes = await Promise.allSettled(batch.map((p) => runOnePersona(p, deps)));
		for (let j = 0; j < outcomes.length; j++) {
			const persona = batch[j];
			const outcome = outcomes[j];
			if (outcome.status === 'fulfilled') {
				success++;
			} else {
				failed.push({
					persona: persona.email,
					error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
				});
			}
		}
	}

	return {
		due: due.length,
		ranSuccessfully: success,
		failed,
		durationMs: Date.now() - start,
	};
}

// ─── Per-persona pipeline ─────────────────────────────────────────

async function runOnePersona(persona: DuePersona, deps: TickDependencies): Promise<void> {
	const tickId = newTickId();
	const password = personaPassword(persona.email, deps.config.personaSeedSecret);

	const { jwt, spaceId } = await deps.auth.loginAndResolvePersonalSpace(persona.email, password);

	const sessionInput: SessionInput = {
		tickId,
		personaEmail: persona.email,
		systemPrompt: persona.systemPrompt,
		moduleMix: persona.moduleMix,
		mcpUrl: deps.config.mcpUrl,
		jwt,
		spaceId,
		anthropicApiKey: deps.config.anthropicApiKey,
	};

	const { actions, modulesUsed } = await runMainTurn(sessionInput);

	// Always persist actions, even if none — that itself is useful
	// signal for the dashboard ("persona showed up but did nothing").
	if (actions.length > 0) {
		await deps.internal.postActions(persona.userId, actions);
	}

	const feedback = await runRatingTurn(sessionInput, modulesUsed);
	if (feedback.length > 0) {
		await deps.internal.postFeedback(persona.userId, feedback);
	}

	console.info(
		`[tick] ${persona.email} — ${actions.length} tool calls across ${modulesUsed.size} modules, ${feedback.length} ratings`
	);
}
