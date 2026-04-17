/**
 * POST /v1/search          — single-provider search (or auto-routed if provider omitted)
 * POST /v1/search/compare  — fan-out to N providers, persist as eval_run
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { ProviderId, SearchHit } from '@mana/shared-research';
import { SEARCH_PROVIDER_IDS, searchOptionsSchema } from '@mana/shared-research';
import type { ExecutorDeps } from '../executor/execute';
import { executeSearch } from '../executor/execute';
import type { HonoEnv } from '../lib/hono-env';
import type { ProviderRegistry } from '../providers/registry';
import { getSearchProvider } from '../providers/registry';
import type { RunStorage } from '../storage/runs';
import { BadRequestError } from '../lib/errors';
import type { Config } from '../config';
import { SEARCH_ROUTE_MAP, pickSearchProvider } from '../router/auto-route';
import { classify } from '../router/classify';
import type { ManaLlmClient } from '../clients/mana-llm';

const MAX_COMPARE_PROVIDERS = 5;

const searchBodySchema = z.object({
	query: z.string().min(1).max(1000),
	provider: z.enum(SEARCH_PROVIDER_IDS).optional(),
	options: searchOptionsSchema.optional(),
	useLlmClassifier: z.boolean().optional(),
});

const compareBodySchema = z.object({
	query: z.string().min(1).max(1000),
	providers: z.array(z.enum(SEARCH_PROVIDER_IDS)).min(1).max(MAX_COMPARE_PROVIDERS),
	options: searchOptionsSchema.optional(),
});

export function createSearchRoutes(
	registry: ProviderRegistry,
	storage: RunStorage,
	deps: ExecutorDeps,
	config: Config,
	llm: ManaLlmClient
) {
	return new Hono<HonoEnv>()
		.post('/', async (c) => {
			const user = c.get('user');
			const body = searchBodySchema.parse(await c.req.json());

			// Auto-route when no explicit provider
			let providerId: ProviderId;
			let queryType: string | undefined;
			let mode: 'single' | 'auto' = 'single';

			if (body.provider) {
				providerId = body.provider;
			} else {
				mode = 'auto';
				const cls = await classify(body.query, {
					useLlm: body.useLlmClassifier,
					llm,
				});
				queryType = cls.type;
				const picked = pickSearchProvider(SEARCH_ROUTE_MAP[cls.type], config);
				providerId = picked ?? 'searxng';
			}

			const provider = getSearchProvider(registry, providerId);

			const run = await storage.createRun({
				userId: user.userId,
				query: body.query,
				queryType,
				mode,
				category: 'search',
				providersRequested: [providerId],
				billingMode: provider.requiresApiKey ? 'server-key' : 'free',
			});

			const out = await executeSearch(
				{
					provider,
					query: body.query,
					options: body.options ?? {},
					userId: user.userId,
				},
				deps
			);

			await storage.addResult({
				runId: run.id,
				providerId,
				success: out.success,
				latencyMs: out.meta.latencyMs,
				costCredits: out.meta.costCredits,
				billingMode: out.meta.billingMode,
				cacheHit: out.meta.cacheHit,
				normalizedResult: out.data ?? null,
				errorCode: out.meta.errorCode ?? null,
			});

			if (out.meta.costCredits > 0) {
				await storage.finalizeRunCost(run.id, out.meta.costCredits);
			}

			return c.json({
				runId: run.id,
				query: body.query,
				provider: providerId,
				queryType,
				success: out.success,
				data: out.data,
				meta: out.meta,
			});
		})
		.post('/compare', async (c) => {
			const user = c.get('user');
			const body = compareBodySchema.parse(await c.req.json());

			if (new Set(body.providers).size !== body.providers.length) {
				throw new BadRequestError('Duplicate providers in request');
			}

			const providers = body.providers.map((id) => getSearchProvider(registry, id));
			const anyPaid = providers.some((p) => p.requiresApiKey);

			const run = await storage.createRun({
				userId: user.userId,
				query: body.query,
				mode: 'compare',
				category: 'search',
				providersRequested: body.providers,
				billingMode: anyPaid ? 'mixed' : 'free',
			});

			const settled = await Promise.all(
				providers.map((provider) =>
					executeSearch(
						{
							provider,
							query: body.query,
							options: body.options ?? {},
							userId: user.userId,
						},
						deps
					)
				)
			);

			let totalCost = 0;
			for (let i = 0; i < providers.length; i++) {
				const out = settled[i];
				totalCost += out.meta.costCredits;
				await storage.addResult({
					runId: run.id,
					providerId: providers[i].id,
					success: out.success,
					latencyMs: out.meta.latencyMs,
					costCredits: out.meta.costCredits,
					billingMode: out.meta.billingMode,
					cacheHit: out.meta.cacheHit,
					normalizedResult: out.data ?? null,
					errorCode: out.meta.errorCode ?? null,
				});
			}
			if (totalCost > 0) await storage.finalizeRunCost(run.id, totalCost);

			return c.json({
				runId: run.id,
				query: body.query,
				results: providers.map((provider, i) => ({
					provider: provider.id,
					success: settled[i].success,
					data: settled[i].data as { results: SearchHit[] } | undefined,
					meta: settled[i].meta,
				})),
			});
		});
}
