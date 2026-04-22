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
import type { AsyncJobStorage } from '../storage/async-jobs';
import type { CreditsClient } from '../clients/mana-credits';
import { BadRequestError, NotFoundError } from '../lib/errors';
import type { Config } from '../config';
import { pickAgent } from '../router/auto-route';
import { priceFor } from '../lib/pricing';
import { pollDeepResearch, submitDeepResearch } from '../providers/agent/openai-deep-research';
import {
	pollGeminiDeepResearch,
	submitGeminiDeepResearch,
} from '../providers/agent/gemini-deep-research';

const MAX_COMPARE_AGENTS = 4;

const ASYNC_PROVIDER_IDS = [
	'openai-deep-research',
	'gemini-deep-research',
	'gemini-deep-research-max',
] as const;
type AsyncProviderId = (typeof ASYNC_PROVIDER_IDS)[number];

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

const asyncSubmitBodySchema = z.object({
	query: z.string().min(1).max(4000),
	provider: z.enum(ASYNC_PROVIDER_IDS).optional().default('openai-deep-research'),
	options: agentOptionsSchema.optional(),
});

interface AsyncDispatch {
	apiKey: string | null;
	missingKeyMessage: string;
	submit(
		query: string,
		options: { systemPrompt?: string; maxTokens?: number; model?: string },
		apiKey: string,
		signal?: AbortSignal
	): Promise<{ externalId: string; status: 'queued' | 'running' }>;
	poll(
		externalId: string,
		apiKey: string,
		signal?: AbortSignal
	): Promise<{
		status: 'queued' | 'running' | 'completed' | 'failed';
		answer?: import('@mana/shared-research').AgentAnswer;
		error?: string;
	}>;
}

function dispatchAsync(providerId: AsyncProviderId, config: Config): AsyncDispatch {
	switch (providerId) {
		case 'openai-deep-research':
			return {
				apiKey: config.providerKeys.openai ?? null,
				missingKeyMessage:
					'openai-deep-research requires OPENAI_API_KEY on the server or via BYO key',
				submit: (q, o, k, s) => submitDeepResearch(q, o, k, s),
				poll: (id, k, s) => pollDeepResearch(id, k, s),
			};
		case 'gemini-deep-research':
			return {
				apiKey: config.providerKeys.googleGenai ?? null,
				missingKeyMessage:
					'gemini-deep-research requires GOOGLE_GENAI_API_KEY on the server or via BYO key',
				submit: (q, o, k, s) => submitGeminiDeepResearch('standard', q, o, k, s),
				poll: (id, k, s) => pollGeminiDeepResearch('standard', id, k, s),
			};
		case 'gemini-deep-research-max':
			return {
				apiKey: config.providerKeys.googleGenai ?? null,
				missingKeyMessage:
					'gemini-deep-research-max requires GOOGLE_GENAI_API_KEY on the server or via BYO key',
				submit: (q, o, k, s) => submitGeminiDeepResearch('max', q, o, k, s),
				poll: (id, k, s) => pollGeminiDeepResearch('max', id, k, s),
			};
	}
}

export function createResearchRoutes(
	registry: ProviderRegistry,
	storage: RunStorage,
	deps: ExecutorDeps,
	config: Config,
	asyncStorage: AsyncJobStorage,
	credits: CreditsClient
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
			const resultIds: string[] = [];
			for (let i = 0; i < providers.length; i++) {
				const out = settled[i];
				totalCost += out.meta.costCredits;
				const row = await storage.addResult({
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
				resultIds.push(row.id);
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
					resultId: resultIds[i],
				})),
			});
		})
		.post('/async', async (c) => {
			const user = c.get('user');
			const body = asyncSubmitBodySchema.parse(await c.req.json());

			const providerId = body.provider;
			const dispatch = dispatchAsync(providerId, config);
			if (!dispatch.apiKey) {
				throw new BadRequestError(dispatch.missingKeyMessage);
			}

			const price = priceFor(providerId, 'research');
			const reservation = await credits.reserve(
				user.userId,
				price,
				`research:${providerId}:submit`
			);

			try {
				const submission = await dispatch.submit(body.query, body.options ?? {}, dispatch.apiKey);
				const job = await asyncStorage.create({
					userId: user.userId,
					providerId,
					externalId: submission.externalId,
					status: submission.status,
					query: body.query,
					options: body.options ?? {},
					reservationId: reservation.reservationId,
					costCredits: price,
				});
				return c.json({
					taskId: job.id,
					status: job.status,
					providerId,
					costCredits: price,
				});
			} catch (err) {
				await credits.refund(reservation.reservationId).catch(() => {});
				throw err;
			}
		})
		.get('/async/:id', async (c) => {
			const user = c.get('user');
			const job = await asyncStorage.get(c.req.param('id'), user.userId);
			if (!job) throw new NotFoundError('Task not found');

			// Short-circuit terminal states.
			if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
				return c.json({
					taskId: job.id,
					status: job.status,
					query: job.query,
					providerId: job.providerId,
					costCredits: job.costCredits,
					createdAt: job.createdAt,
					updatedAt: job.updatedAt,
					result: job.result,
					error: job.errorMessage,
				});
			}

			// Poll upstream.
			if (!job.externalId) {
				throw new BadRequestError('Task has no external id yet');
			}
			const jobProviderId = job.providerId as AsyncProviderId;
			if (!(ASYNC_PROVIDER_IDS as readonly string[]).includes(jobProviderId)) {
				throw new BadRequestError(`Unknown async provider on job: ${job.providerId}`);
			}
			const dispatch = dispatchAsync(jobProviderId, config);
			if (!dispatch.apiKey) {
				return c.json({
					taskId: job.id,
					status: job.status,
					query: job.query,
					providerId: job.providerId,
					costCredits: job.costCredits,
					createdAt: job.createdAt,
					updatedAt: job.updatedAt,
					error: `${dispatch.missingKeyMessage.replace(' requires ', ' is missing ')}; cannot poll`,
				});
			}

			const poll = await dispatch.poll(job.externalId, dispatch.apiKey).catch((err: Error) => ({
				status: 'failed' as const,
				error: err.message,
			}));

			if (poll.status === 'completed' && poll.answer) {
				const answer = { ...poll.answer, query: job.query };
				await asyncStorage.updateStatus(job.id, {
					status: 'completed',
					result: { answer },
				});
				if (job.reservationId) {
					await credits
						.commit(job.reservationId, `research ${job.providerId}`)
						.catch((err) => console.warn('[async] commit failed:', err));
				}
				return c.json({
					taskId: job.id,
					status: 'completed',
					query: job.query,
					providerId: job.providerId,
					costCredits: job.costCredits,
					createdAt: job.createdAt,
					updatedAt: new Date(),
					result: { answer },
				});
			}

			if (poll.status === 'failed') {
				await asyncStorage.updateStatus(job.id, {
					status: 'failed',
					errorMessage: poll.error ?? 'unknown',
				});
				if (job.reservationId) {
					await credits
						.refund(job.reservationId)
						.catch((err) => console.warn('[async] refund failed:', err));
				}
				return c.json({
					taskId: job.id,
					status: 'failed',
					query: job.query,
					providerId: job.providerId,
					costCredits: 0,
					createdAt: job.createdAt,
					updatedAt: new Date(),
					error: poll.error,
				});
			}

			// queued / running — update touch and return current
			if (poll.status !== job.status) {
				await asyncStorage.updateStatus(job.id, { status: poll.status });
			}
			return c.json({
				taskId: job.id,
				status: poll.status,
				query: job.query,
				providerId: job.providerId,
				costCredits: job.costCredits,
				createdAt: job.createdAt,
				updatedAt: new Date(),
			});
		})
		.get('/async', async (c) => {
			const user = c.get('user');
			const limit = Math.min(parseInt(c.req.query('limit') ?? '25', 10), 100);
			const jobs = await asyncStorage.list(user.userId, limit);
			return c.json({ tasks: jobs });
		});
}
