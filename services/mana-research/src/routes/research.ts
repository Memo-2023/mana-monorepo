/**
 * POST /v1/research          — single-agent research (or auto-routed)
 * POST /v1/research/compare  — fan-out to multiple agents
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { AgentAnswer } from '@mana/shared-research';
import { AGENT_PROVIDER_IDS, agentOptionsSchema } from '@mana/shared-research';
import type { ExecutorDeps } from '../executor/execute-research';
import { executeResearch } from '../executor/execute-research';
import type { HonoEnv } from '../lib/hono-env';
import type { ProviderRegistry } from '../providers/registry';
import { getAgent } from '../providers/registry';
import type { RunStorage } from '../storage/runs';
import { BadRequestError } from '../lib/errors';
import type { Config } from '../config';
import { pickAgent } from '../router/auto-route';

const MAX_COMPARE_AGENTS = 4;

const researchBodySchema = z.object({
	query: z.string().min(1).max(2000),
	provider: z.enum(AGENT_PROVIDER_IDS).optional(),
	options: agentOptionsSchema.optional(),
});

const compareBodySchema = z.object({
	query: z.string().min(1).max(2000),
	providers: z.array(z.enum(AGENT_PROVIDER_IDS)).min(1).max(MAX_COMPARE_AGENTS),
	options: agentOptionsSchema.optional(),
});

export function createResearchRoutes(
	registry: ProviderRegistry,
	storage: RunStorage,
	deps: ExecutorDeps,
	config: Config
) {
	return new Hono<HonoEnv>()
		.post('/', async (c) => {
			const user = c.get('user');
			const body = researchBodySchema.parse(await c.req.json());

			const providerId = body.provider ?? pickAgent(config);
			if (!providerId) {
				throw new BadRequestError(
					'No research agent configured. Set at least one of PERPLEXITY_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENAI_API_KEY.'
				);
			}

			const provider = getAgent(registry, providerId);

			const run = await storage.createRun({
				userId: user.userId,
				query: body.query,
				mode: body.provider ? 'single' : 'auto',
				category: 'agent',
				providersRequested: [providerId],
				billingMode: provider.requiresApiKey ? 'server-key' : 'free',
			});

			const out = await executeResearch(
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

			const providers = body.providers.map((id) => getAgent(registry, id));
			const anyPaid = providers.some((p) => p.requiresApiKey);

			const run = await storage.createRun({
				userId: user.userId,
				query: body.query,
				mode: 'compare',
				category: 'agent',
				providersRequested: body.providers,
				billingMode: anyPaid ? 'mixed' : 'free',
			});

			const settled = await Promise.all(
				providers.map((provider) =>
					executeResearch(
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
					data: settled[i].data as { answer: AgentAnswer } | undefined,
					meta: settled[i].meta,
				})),
			});
		});
}
