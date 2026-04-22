/**
 * Internal service-to-service research routes.
 *
 * POST   /api/v1/internal/research/async       — submit an async research job for a user
 * GET    /api/v1/internal/research/async/:id   — poll a job (scoped to the X-User-Id header)
 *
 * Callers (mana-ai today) authenticate via `X-Service-Key` and pass the
 * target user id in `X-User-Id`. Credits are reserved against that user
 * exactly like the user-facing path; the difference is only in how the
 * caller is authorised.
 *
 * Keep the logic here a thin wrapper over the same submit/poll helpers
 * the user-facing /async route uses — divergence would be silent and
 * surprising for anyone debugging a mana-ai request against the user API
 * later.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { agentOptionsSchema } from '@mana/shared-research';
import type { HonoEnv } from '../lib/hono-env';
import type { AsyncJobStorage } from '../storage/async-jobs';
import type { CreditsClient } from '../clients/mana-credits';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../lib/errors';
import type { Config } from '../config';
import { priceFor } from '../lib/pricing';
import { pollDeepResearch, submitDeepResearch } from '../providers/agent/openai-deep-research';
import {
	pollGeminiDeepResearch,
	submitGeminiDeepResearch,
} from '../providers/agent/gemini-deep-research';

const ASYNC_PROVIDER_IDS = [
	'openai-deep-research',
	'gemini-deep-research',
	'gemini-deep-research-max',
] as const;
type AsyncProviderId = (typeof ASYNC_PROVIDER_IDS)[number];

const submitBodySchema = z.object({
	query: z.string().min(1).max(4000),
	provider: z.enum(ASYNC_PROVIDER_IDS),
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
				missingKeyMessage: 'openai-deep-research requires OPENAI_API_KEY',
				submit: (q, o, k, s) => submitDeepResearch(q, o, k, s),
				poll: (id, k, s) => pollDeepResearch(id, k, s),
			};
		case 'gemini-deep-research':
			return {
				apiKey: config.providerKeys.googleGenai ?? null,
				missingKeyMessage: 'gemini-deep-research requires GOOGLE_GENAI_API_KEY',
				submit: (q, o, k, s) => submitGeminiDeepResearch('standard', q, o, k, s),
				poll: (id, k, s) => pollGeminiDeepResearch('standard', id, k, s),
			};
		case 'gemini-deep-research-max':
			return {
				apiKey: config.providerKeys.googleGenai ?? null,
				missingKeyMessage: 'gemini-deep-research-max requires GOOGLE_GENAI_API_KEY',
				submit: (q, o, k, s) => submitGeminiDeepResearch('max', q, o, k, s),
				poll: (id, k, s) => pollGeminiDeepResearch('max', id, k, s),
			};
	}
}

function requireUserId(userId: string | undefined): string {
	if (!userId) {
		throw new UnauthorizedError('X-User-Id header is required on internal research routes');
	}
	return userId;
}

export function createInternalResearchRoutes(
	config: Config,
	asyncStorage: AsyncJobStorage,
	credits: CreditsClient
) {
	return new Hono<HonoEnv>()
		.post('/async', async (c) => {
			const userId = requireUserId(c.req.header('X-User-Id'));
			const body = submitBodySchema.parse(await c.req.json());

			const providerId = body.provider;
			const dispatch = dispatchAsync(providerId, config);
			if (!dispatch.apiKey) throw new BadRequestError(dispatch.missingKeyMessage);

			const price = priceFor(providerId, 'research');
			const reservation = await credits.reserve(
				userId,
				price,
				`research:${providerId}:internal-submit`
			);

			try {
				const submission = await dispatch.submit(body.query, body.options ?? {}, dispatch.apiKey);
				const job = await asyncStorage.create({
					userId,
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
			const userId = requireUserId(c.req.header('X-User-Id'));
			const job = await asyncStorage.get(c.req.param('id'), userId);
			if (!job) throw new NotFoundError('Task not found');

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

			if (!job.externalId) throw new BadRequestError('Task has no external id yet');

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
					error: `${dispatch.missingKeyMessage}; cannot poll`,
				});
			}

			const poll = await dispatch.poll(job.externalId, dispatch.apiKey).catch((err: Error) => ({
				status: 'failed' as const,
				error: err.message,
			}));

			if (poll.status === 'completed' && poll.answer) {
				const answer = { ...poll.answer, query: job.query };
				await asyncStorage.updateStatus(job.id, { status: 'completed', result: { answer } });
				if (job.reservationId) {
					await credits
						.commit(job.reservationId, `research ${job.providerId}`)
						.catch((err) => console.warn('[internal] commit failed:', err));
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
						.catch((err) => console.warn('[internal] refund failed:', err));
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
		});
}
