/**
 * Extract-side executor. Same shape as executeSearch but for URL extraction.
 */

import type {
	BillingMode,
	ExtractedContent,
	ExtractOptions,
	ExtractProvider,
	ProviderId,
	ProviderMeta,
} from '@mana/shared-research';
import type { CreditsClient } from '../clients/mana-credits';
import type { Config } from '../config';
import { ProviderNotConfiguredError } from '../lib/errors';
import { priceFor } from '../lib/pricing';
import type { ConfigStorage } from '../storage/configs';
import { cacheGet, cacheKey, cacheSet } from '../lib/cache';
import { mapEnvKey } from './env-map';

export interface ExecuteExtractInput {
	provider: ExtractProvider;
	url: string;
	options: ExtractOptions;
	userId: string;
	signal?: AbortSignal;
}

export interface ExecuteExtractOutput {
	success: boolean;
	data?: { content: ExtractedContent };
	meta: ProviderMeta;
}

export interface ExecutorDeps {
	credits: CreditsClient;
	configs: ConfigStorage;
	config: Config;
}

export async function executeExtract(
	input: ExecuteExtractInput,
	deps: ExecutorDeps
): Promise<ExecuteExtractOutput> {
	const { provider, url, options, userId, signal } = input;
	const providerId = provider.id;
	const t0 = performance.now();

	// Resolve API key (BYO → server → none)
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
	} else if (providerId === 'jina-reader' && deps.config.providerKeys.jina) {
		// jina-reader is zero-auth but a key lifts the rate limit
		apiKey = deps.config.providerKeys.jina;
	}

	const price = billingMode === 'server-key' ? priceFor(providerId, 'extract') : 0;

	const ckey = cacheKey('extract', providerId, url, options);
	const cached = await cacheGet<{ content: ExtractedContent }>(ckey);
	if (cached) {
		return {
			success: true,
			data: cached,
			meta: {
				provider: providerId,
				category: 'extract',
				latencyMs: Math.round(performance.now() - t0),
				costCredits: 0,
				cacheHit: true,
				billingMode,
			},
		};
	}

	let reservationId: string | null = null;
	if (price > 0 && billingMode === 'server-key') {
		try {
			const reservation = await deps.credits.reserve(
				userId,
				price,
				`research:${providerId}:extract`
			);
			reservationId = reservation.reservationId;
		} catch (err) {
			return makeError(providerId, t0, err as Error);
		}
	}

	try {
		const res = await provider.extract(url, options, { apiKey, userId, signal });
		await cacheSet(ckey, { content: res.content }, deps.config.cacheTtlSeconds * 24);

		if (reservationId) {
			await deps.credits
				.commit(reservationId, `extract ${providerId}`)
				.catch((err) => console.warn('[executor] commit failed:', err));
		}

		return {
			success: true,
			data: { content: res.content },
			meta: {
				provider: providerId,
				category: 'extract',
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

function makeError(providerId: ProviderId, t0: number, err: Error): ExecuteExtractOutput {
	const code = (err as { code?: string }).code ?? err.name ?? 'ERROR';
	return {
		success: false,
		meta: {
			provider: providerId,
			category: 'extract',
			latencyMs: Math.round(performance.now() - t0),
			costCredits: 0,
			cacheHit: false,
			billingMode: 'free',
			errorCode: code,
		},
	};
}
