/**
 * Agent-side executor. Same shape as search/extract but for long-running
 * LLM-backed research calls with citations.
 */

import type {
	AgentAnswer,
	AgentOptions,
	BillingMode,
	ProviderId,
	ProviderMeta,
	ResearchAgent,
} from '@mana/shared-research';
import type { CreditsClient } from '../clients/mana-credits';
import type { Config } from '../config';
import { ProviderNotConfiguredError } from '../lib/errors';
import { priceFor } from '../lib/pricing';
import type { ConfigStorage } from '../storage/configs';
import { cacheGet, cacheKey, cacheSet } from '../lib/cache';
import { mapEnvKey } from './env-map';

export interface ExecuteResearchInput {
	provider: ResearchAgent;
	query: string;
	options: AgentOptions;
	userId: string;
	signal?: AbortSignal;
}

export interface ExecuteResearchOutput {
	success: boolean;
	data?: { answer: AgentAnswer };
	meta: ProviderMeta;
}

export interface ExecutorDeps {
	credits: CreditsClient;
	configs: ConfigStorage;
	config: Config;
}

export async function executeResearch(
	input: ExecuteResearchInput,
	deps: ExecutorDeps
): Promise<ExecuteResearchOutput> {
	const { provider, query, options, userId, signal } = input;
	const providerId = provider.id;
	const t0 = performance.now();

	let apiKey: string | null = null;
	let billingMode: BillingMode = 'free';

	if (provider.requiresApiKey) {
		const userConfig = await deps.configs.getForUser(userId, providerId);
		if (userConfig?.enabled && userConfig.apiKeyEncrypted) {
			apiKey = await deps.configs.decryptKey(userConfig);
			if (apiKey) billingMode = 'byo-key';
		}
		if (!apiKey) {
			apiKey = deps.config.providerKeys[mapEnvKey(providerId)] ?? null;
			if (apiKey) billingMode = 'server-key';
		}
		if (!apiKey) {
			return makeError(providerId, t0, new ProviderNotConfiguredError(providerId));
		}
	}

	// Agent responses depend on query + model — include model in cache key
	const ckey = cacheKey('agent', providerId, query, options);
	const cached = await cacheGet<{ answer: AgentAnswer }>(ckey);
	if (cached) {
		return {
			success: true,
			data: cached,
			meta: {
				provider: providerId,
				category: 'agent',
				latencyMs: Math.round(performance.now() - t0),
				costCredits: 0,
				cacheHit: true,
				billingMode,
			},
		};
	}

	const price = billingMode === 'server-key' ? priceFor(providerId, 'research') : 0;

	let reservationId: string | null = null;
	if (price > 0 && billingMode === 'server-key') {
		try {
			const reservation = await deps.credits.reserve(
				userId,
				price,
				`research:${providerId}:research`
			);
			reservationId = reservation.reservationId;
		} catch (err) {
			return makeError(providerId, t0, err as Error);
		}
	}

	try {
		const res = await provider.research(query, options, { apiKey, userId, signal });
		await cacheSet(ckey, { answer: res.answer }, deps.config.cacheTtlSeconds);

		if (reservationId) {
			await deps.credits
				.commit(reservationId, `research ${providerId}`)
				.catch((err) => console.warn('[executor] commit failed:', err));
		}

		return {
			success: true,
			data: { answer: res.answer },
			meta: {
				provider: providerId,
				category: 'agent',
				latencyMs: Math.round(performance.now() - t0),
				costCredits: price,
				cacheHit: false,
				billingMode,
			},
		};
	} catch (err) {
		if (reservationId) {
			await deps.credits
				.refund(reservationId)
				.catch((refundErr) => console.warn('[executor] refund failed:', refundErr));
		}
		return makeError(providerId, t0, err as Error);
	}
}

function makeError(providerId: ProviderId, t0: number, err: Error): ExecuteResearchOutput {
	const code = (err as { code?: string }).code ?? err.name ?? 'ERROR';
	console.warn(`[executor.research] ${providerId} failed:`, err.message, err);
	return {
		success: false,
		meta: {
			provider: providerId,
			category: 'agent',
			latencyMs: Math.round(performance.now() - t0),
			costCredits: 0,
			cacheHit: false,
			billingMode: 'free',
			errorCode: code,
		},
	};
}
