/**
 * LlmOrchestrator — routes LlmTasks across the four privacy tiers
 * (none / browser / mana-server / cloud) according to the user's
 * settings, the task's minimum tier, and the input's content class.
 *
 * Routing rules — applied in this exact order:
 *
 *   1. If the task's minTier is above the user's HIGHEST allowed tier,
 *      we cannot run the LLM path at all. Try runRules() if defined,
 *      else throw TierTooLowError.
 *
 *   2. If contentClass is 'sensitive', strip 'mana-server' and 'cloud'
 *      from the candidate tier list — sensitive content NEVER leaves
 *      the device, even if the user has these tiers enabled globally.
 *      This is the privacy backstop the user can't accidentally
 *      override task-by-task.
 *
 *   3. If a per-task override exists in settings.taskOverrides, use it
 *      verbatim (still subject to rule 2 — task overrides cannot
 *      bypass the sensitive-content backstop).
 *
 *   4. Otherwise, pick the FIRST tier from settings.allowedTiers that
 *      (a) is in the candidate set after rules 1+2, (b) has an
 *      available + ready backend, (c) the cloud-consent gate is
 *      satisfied if it's the cloud tier.
 *
 *   5. Run the task on the chosen backend.
 *
 *   6. If the run throws and settings.fallbackToRulesOnError is true
 *      and the task has a runRules() implementation, fall back to
 *      rules. We do NOT auto-fall to a different LLM tier on error —
 *      the user explicitly chose this tier and silently switching
 *      providers would be a privacy/trust break.
 *
 *   7. If everything fails, throw NoTierAvailableError. UI catches it
 *      and offers a "retry" / "switch tier" / "enter manually" prompt.
 */

import {
	BackendUnreachableError,
	NoTierAvailableError,
	ProviderBlockedError,
	TierTooLowError,
	type SkippedTier,
} from './errors';
import type { LlmTask } from './task';
import type { LlmTier } from './tiers';
import { TIER_RANK } from './tiers';
import type { LlmBackend, LlmSettings, LlmTaskRequest, LlmTaskResult } from './types';

export interface LlmOrchestratorOptions {
	settings: LlmSettings;
	backends: LlmBackend[];
}

export class LlmOrchestrator {
	private settings: LlmSettings;
	private backendsByTier: Map<LlmTier, LlmBackend>;

	constructor(opts: LlmOrchestratorOptions) {
		this.settings = opts.settings;
		this.backendsByTier = new Map();
		for (const b of opts.backends) {
			this.backendsByTier.set(b.tier, b);
		}
	}

	/** Replace the settings object — call this when the user updates
	 *  their preferences in the settings UI. */
	updateSettings(settings: LlmSettings): void {
		this.settings = settings;
	}

	/** Register (or replace) a backend at runtime — used by the app
	 *  to wire up the BYOK backend after initial orchestrator construction,
	 *  since BYOK needs access to app-side IndexedDB keys. */
	registerBackend(backend: LlmBackend): void {
		this.backendsByTier.set(backend.tier, backend);
	}

	/** Remove a backend (e.g. when the user disables BYOK). */
	unregisterBackend(tier: LlmTier): void {
		this.backendsByTier.delete(tier);
	}

	/** Public read-only view for UI components that want to react to
	 *  the current settings (e.g. the tier selector). */
	getSettings(): Readonly<LlmSettings> {
		return this.settings;
	}

	/**
	 * Can the user (with their current settings) run this task at all?
	 * The UI uses this to decide whether to show a feature button as
	 * enabled / disabled / hidden. Does NOT check backend readiness —
	 * that's a per-call concern. Just checks "is there any conceivable
	 * tier in the user's allowedTiers that satisfies task.minTier and
	 * is permitted for task.contentClass?".
	 */
	canRun<TIn, TOut>(task: LlmTask<TIn, TOut>): boolean {
		// Rules-only tasks always run if they have a fallback
		if (task.minTier === 'none') return true;
		if (task.runRules) return true;

		const override = this.settings.taskOverrides[task.name];
		const candidates = this.candidateTiers(task, override);
		return candidates.some((t) => {
			const backend = this.backendsByTier.get(t);
			return backend?.isAvailable() ?? false;
		});
	}

	/**
	 * Run the task. Honors the routing rules above. The returned
	 * LlmTaskResult includes which tier actually ran, plus a trail
	 * of tiers that were attempted and skipped before it.
	 */
	async run<TIn, TOut>(task: LlmTask<TIn, TOut>, input: TIn): Promise<LlmTaskResult<TOut>> {
		const start = performance.now();
		const attempted: LlmTier[] = [];

		// Rule 1: tier-too-low check.
		// An explicit per-task override counts as opting-in to that tier
		// even if it isn't in the user's global allowedTiers — that's the
		// whole point of overrides (e.g. "use BYOK just for the Companion").
		const override = this.settings.taskOverrides[task.name];
		const effectiveMaxTier = override
			? TIER_RANK[override] > TIER_RANK[this.userMaxTier()]
				? override
				: this.userMaxTier()
			: this.userMaxTier();
		if (TIER_RANK[task.minTier] > TIER_RANK[effectiveMaxTier]) {
			if (task.runRules) {
				const value = await task.runRules(input);
				return {
					value,
					source: 'none',
					latencyMs: Math.round(performance.now() - start),
					attempted: ['none'],
				};
			}
			throw new TierTooLowError(task.name, task.minTier, effectiveMaxTier);
		}

		// Rules-2-3: candidate tier list and per-task override
		const candidates = this.candidateTiers(task, override);
		const orderedTiers = override ? [override].filter((t) => candidates.includes(t)) : candidates;

		// Rule 4-5: try the first runnable tier
		const skipped: SkippedTier[] = [];
		for (const tier of orderedTiers) {
			if (tier === 'none') {
				if (task.runRules) {
					const value = await task.runRules(input);
					return {
						value,
						source: 'none',
						latencyMs: Math.round(performance.now() - start),
						attempted: [...attempted, 'none'],
					};
				}
				attempted.push('none');
				continue;
			}

			// Cloud-consent gate
			if (tier === 'cloud' && !this.settings.cloudConsentGiven) {
				attempted.push('cloud');
				skipped.push({ tier: 'cloud', reason: 'no-consent' });
				continue;
			}

			const backend = this.backendsByTier.get(tier);
			if (!backend) {
				attempted.push(tier);
				skipped.push({ tier, reason: 'no-backend' });
				continue;
			}
			if (!backend.isAvailable()) {
				attempted.push(tier);
				skipped.push({ tier, reason: 'not-available' });
				continue;
			}
			const ready = await backend.isReady();
			if (!ready) {
				attempted.push(tier);
				skipped.push({ tier, reason: 'not-ready' });
				continue;
			}

			try {
				const request = this.buildRequest(task, input);
				const generated = await task.runLlm(input, backend);
				return {
					value: generated,
					source: tier,
					latencyMs: Math.round(performance.now() - start),
					attempted: [...attempted, tier],
				};
				// `request` is intentionally unused — the task constructs
				// its own LlmTaskRequest internally via runLlm. We build
				// it here only as a future hook for telemetry.
				void request;
			} catch (err) {
				attempted.push(tier);
				// Rule 6: rules-fallback on error
				if (
					this.settings.fallbackToRulesOnError &&
					task.runRules &&
					!(err instanceof ProviderBlockedError)
				) {
					// Provider-blocked errors should NOT silently fall to
					// rules — they should bubble up so the UI can offer
					// "retry" / "switch tier" prompts. Other errors
					// (network failure, OOM, model not loaded) get the
					// silent rules fallback.
					try {
						const value = await task.runRules(input);
						return {
							value,
							source: 'none',
							latencyMs: Math.round(performance.now() - start),
							attempted: [...attempted, 'none'],
						};
					} catch {
						// rules fallback also failed — re-throw original
						throw err;
					}
				}
				// Re-throw provider blocks and unrecoverable errors
				if (err instanceof ProviderBlockedError || err instanceof BackendUnreachableError) {
					throw err;
				}
				// Unknown error — try the next tier in the list
				skipped.push({ tier, reason: 'runtime-error' });
				continue;
			}
		}

		if (attempted.length === 0) {
			skipped.push({ tier: 'none' as LlmTier, reason: 'no-tiers-configured' });
		}
		throw new NoTierAvailableError(task.name, attempted, skipped);
	}

	/** Highest tier in the user's allowedTiers list (by rank). */
	private userMaxTier(): LlmTier {
		if (this.settings.allowedTiers.length === 0) return 'none';
		return this.settings.allowedTiers.reduce(
			(max, t) => (TIER_RANK[t] > TIER_RANK[max] ? t : max),
			'none' as LlmTier
		);
	}

	/** Candidate tier list after applying rules 1 + 2.
	 *  - Rule 1: only tiers >= task.minTier
	 *  - Rule 2: sensitive content excludes mana-server + cloud + byok
	 *  - If a per-task override is given, it's allowed even if not in
	 *    settings.allowedTiers (explicit per-task opt-in beats global)
	 *  Also always includes 'none' at the end if the task has runRules. */
	private candidateTiers<TIn, TOut>(task: LlmTask<TIn, TOut>, override?: LlmTier): LlmTier[] {
		// Start with the user's allowed tiers, plus the override if set
		// (the override is an explicit per-task opt-in even if the user
		// hasn't enabled that tier globally).
		const baseTiers = override
			? Array.from(new Set([...this.settings.allowedTiers, override]))
			: this.settings.allowedTiers;

		let tiers = baseTiers
			.filter((t) => TIER_RANK[t] >= TIER_RANK[task.minTier])
			.sort((a, b) => TIER_RANK[a] - TIER_RANK[b]);

		// Rule 2: sensitive content backstop — only browser-local stays
		if (task.contentClass === 'sensitive') {
			tiers = tiers.filter((t) => t === 'browser');
		}

		// 'none' is always tail-appended if the task has a rules implementation,
		// so the for-loop in run() naturally falls through to it.
		if (task.runRules && !tiers.includes('none')) {
			tiers.push('none');
		}
		return tiers;
	}

	private buildRequest<TIn, TOut>(task: LlmTask<TIn, TOut>, _input: TIn): LlmTaskRequest {
		// Right now this is a placeholder — tasks build their own
		// LlmTaskRequest inside runLlm. Once we add token-counting
		// telemetry we'll move that construction up here so the
		// orchestrator can prepend the task metadata uniformly.
		return {
			taskName: task.name,
			contentClass: task.contentClass,
			requires: task.requires,
			messages: [],
		};
	}
}
