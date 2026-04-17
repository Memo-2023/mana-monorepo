/**
 * Core execution path: resolve key → reserve credits → call provider →
 * commit/refund → persist result.
 *
 * Used by both /v1/search (single) and /v1/search/compare (fan-out).
 */

import type {
	BillingMode,
	ProviderId,
	ProviderMeta,
	SearchHit,
	SearchOptions,
	SearchProvider,
} from '@mana/shared-research';
import type { CreditsClient } from '../clients/mana-credits';
import type { Config } from '../config';
import { ProviderNotConfiguredError } from '../lib/errors';
import { priceFor } from '../lib/pricing';
import type { ConfigStorage } from '../storage/configs';
import { cacheGet, cacheKey, cacheSet } from '../lib/cache';
import { mapEnvKey } from './env-map';

export interface ExecuteSearchInput {
	provider: SearchProvider;
	query: string;
	options: SearchOptions;
	userId: string;
	signal?: AbortSignal;
}

export interface ExecuteSearchOutput {
	success: boolean;
	data?: { results: SearchHit[] };
	meta: ProviderMeta;
}

export interface ExecutorDeps {
	credits: CreditsClient;
	configs: ConfigStorage;
	config: Config;
}

export async function executeSearch(
	input: ExecuteSearchInput,
	deps: ExecutorDeps
): Promise<ExecuteSearchOutput> {
	const { provider, query, options, userId, signal } = input;
	const providerId = provider.id;
	const t0 = performance.now();

	// Resolve API key (BYO first, then server)
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

	const price = billingMode === 'server-key' ? priceFor(providerId, 'search') : 0;

	// Cache check
	const ckey = cacheKey('search', providerId, query, options);
	const cached = await cacheGet<{ results: SearchHit[] }>(ckey);
	if (cached) {
		return {
			success: true,
			data: cached,
			meta: {
				provider: providerId,
				category: 'search',
				latencyMs: Math.round(performance.now() - t0),
				costCredits: 0,
				cacheHit: true,
				billingMode,
			},
		};
	}

	// Reserve credits for paid server-key calls
	let reservationId: string | null = null;
	if (price > 0 && billingMode === 'server-key') {
		try {
			const reservation = await deps.credits.reserve(
				userId,
				price,
				`research:${providerId}:search`
			);
			reservationId = reservation.reservationId;
		} catch (err) {
			return makeError(providerId, t0, err as Error);
		}
	}

	// Execute provider
	try {
		const res = await provider.search(query, options, { apiKey, userId, signal });
		await cacheSet(ckey, { results: res.results }, deps.config.cacheTtlSeconds);

		if (reservationId) {
			await deps.credits
				.commit(reservationId, `search ${providerId}`)
				.catch((err) => console.warn('[executor] commit failed:', err));
		}

		return {
			success: true,
			data: { results: res.results },
			meta: {
				provider: providerId,
				category: 'search',
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

function makeError(providerId: ProviderId, t0: number, err: Error): ExecuteSearchOutput {
	const code = (err as { code?: string }).code ?? err.name ?? 'ERROR';
	return {
		success: false,
		meta: {
			provider: providerId,
			category: 'search',
			latencyMs: Math.round(performance.now() - t0),
			costCredits: 0,
			cacheHit: false,
			billingMode: 'free',
			errorCode: code,
		},
	};
}
