/**
 * Writing module — one-shot prose generation against mana-llm.
 *
 * M3 scope: the client sends a fully-built prompt (system + user), we
 * round-trip to mana-llm and return the raw completion text. Draft +
 * version bookkeeping stays entirely client-side — the browser writes
 * the returned text into a new LocalDraftVersion via the generations
 * store. This keeps the server stateless and lets the same endpoint
 * serve refinement calls later (shorten / expand / tone).
 *
 * Later milestones:
 *   M6 — selection-refinement tools will call this same endpoint with
 *        different system/user prompts (shorten, expand, change tone).
 *   M7 — long-form drafts flip to mana-ai missions with streaming; the
 *        sync endpoint here stays for short-form as a fast path.
 */

import { Hono } from 'hono';
import { llmText, LlmError } from '../../lib/llm';
import { logger, type AuthVariables } from '@mana/shared-hono';

const DEFAULT_MODEL = process.env.WRITING_MODEL || 'ollama/gemma3:4b';

/** Hard cap so a runaway briefing can't burn unlimited tokens. */
const MAX_OUTPUT_TOKENS = 8000;

interface GenerationRequest {
	systemPrompt?: string;
	userPrompt: string;
	/** Kind discriminator — logged for observability, not used for routing. */
	kind?: string;
	/** Ghostwriter default 0.7; selection-refinements might want 0.3. */
	temperature?: number;
	/** Token ceiling. Server clamps to MAX_OUTPUT_TOKENS. */
	maxTokens?: number;
	/** Optional model override — most callers leave this unset. */
	model?: string;
}

const routes = new Hono<{ Variables: AuthVariables }>();

routes.post('/generations', async (c) => {
	const userId = c.get('userId');
	const body = (await c.req.json()) as Partial<GenerationRequest>;

	if (!body.userPrompt || typeof body.userPrompt !== 'string') {
		return c.json({ error: 'userPrompt required' }, 400);
	}

	const maxTokens = Math.min(MAX_OUTPUT_TOKENS, Math.max(64, body.maxTokens ?? 2000));
	const temperature =
		typeof body.temperature === 'number' ? Math.max(0, Math.min(1.2, body.temperature)) : 0.7;
	const model = body.model || DEFAULT_MODEL;

	const startedAt = Date.now();
	try {
		const result = await llmText({
			model,
			system: body.systemPrompt,
			user: body.userPrompt,
			temperature,
			maxTokens,
		});
		const durationMs = Date.now() - startedAt;
		logger.info('writing.generation_ok', {
			userId,
			kind: body.kind,
			model: result.model,
			outputChars: result.text.length,
			tokenUsage: result.tokenUsage,
			durationMs,
		});
		return c.json({
			output: result.text,
			model: result.model,
			tokenUsage: result.tokenUsage,
			durationMs,
		});
	} catch (err) {
		const durationMs = Date.now() - startedAt;
		const message = err instanceof Error ? err.message : String(err);
		logger.error('writing.generation_failed', {
			userId,
			kind: body.kind,
			model,
			error: message,
			status: err instanceof LlmError ? err.status : undefined,
			durationMs,
		});
		return c.json({ error: 'Generation failed', detail: message, durationMs }, 500);
	}
});

export { routes as writingRoutes };
