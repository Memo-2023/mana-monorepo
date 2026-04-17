/**
 * POST /v1/extract          — single-provider extract
 * POST /v1/extract/compare  — fan-out
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { ExtractedContent } from '@mana/shared-research';
import { EXTRACT_PROVIDER_IDS, extractOptionsSchema } from '@mana/shared-research';
import type { ExecutorDeps } from '../executor/execute-extract';
import { executeExtract } from '../executor/execute-extract';
import type { HonoEnv } from '../lib/hono-env';
import type { ProviderRegistry } from '../providers/registry';
import { getExtractProvider } from '../providers/registry';
import type { RunStorage } from '../storage/runs';
import { BadRequestError } from '../lib/errors';
import type { Config } from '../config';
import { EXTRACT_ROUTE_DEFAULT, pickExtractProvider } from '../router/auto-route';

const MAX_COMPARE_PROVIDERS = 4;

const extractBodySchema = z.object({
	url: z.string().url(),
	provider: z.enum(EXTRACT_PROVIDER_IDS).optional(),
	options: extractOptionsSchema.optional(),
});

const extractCompareBodySchema = z.object({
	url: z.string().url(),
	providers: z.array(z.enum(EXTRACT_PROVIDER_IDS)).min(1).max(MAX_COMPARE_PROVIDERS),
	options: extractOptionsSchema.optional(),
});

export function createExtractRoutes(
	registry: ProviderRegistry,
	storage: RunStorage,
	deps: ExecutorDeps,
	config: Config
) {
	return new Hono<HonoEnv>()
		.post('/', async (c) => {
			const user = c.get('user');
			const body = extractBodySchema.parse(await c.req.json());

			const providerId =
				body.provider ?? pickExtractProvider(EXTRACT_ROUTE_DEFAULT, config) ?? 'readability';

			const provider = getExtractProvider(registry, providerId);

			const run = await storage.createRun({
				userId: user.userId,
				query: body.url,
				mode: body.provider ? 'single' : 'auto',
				category: 'extract',
				providersRequested: [providerId],
				billingMode: provider.requiresApiKey ? 'server-key' : 'free',
			});

			const out = await executeExtract(
				{
					provider,
					url: body.url,
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
				url: body.url,
				provider: providerId,
				success: out.success,
				data: out.data,
				meta: out.meta,
			});
		})
		.post('/compare', async (c) => {
			const user = c.get('user');
			const body = extractCompareBodySchema.parse(await c.req.json());

			if (new Set(body.providers).size !== body.providers.length) {
				throw new BadRequestError('Duplicate providers in request');
			}

			const providers = body.providers.map((id) => getExtractProvider(registry, id));
			const anyPaid = providers.some((p) => p.requiresApiKey);

			const run = await storage.createRun({
				userId: user.userId,
				query: body.url,
				mode: 'compare',
				category: 'extract',
				providersRequested: body.providers,
				billingMode: anyPaid ? 'mixed' : 'free',
			});

			const settled = await Promise.all(
				providers.map((provider) =>
					executeExtract(
						{
							provider,
							url: body.url,
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
				url: body.url,
				results: providers.map((provider, i) => ({
					provider: provider.id,
					success: settled[i].success,
					data: settled[i].data as { content: ExtractedContent } | undefined,
					meta: settled[i].meta,
				})),
			});
		});
}
