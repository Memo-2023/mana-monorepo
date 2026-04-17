/**
 * /v1/provider-configs — per-user BYO-key + budget CRUD.
 *
 * Keys are stored in research.provider_configs.apiKeyEncrypted. Phase 4
 * persists plaintext with a TODO for AES-GCM-256 encryption (see
 * src/storage/configs.ts `decryptKey` — same plaintext path on read).
 * A separate commit will wire in the shared-crypto KEK pattern.
 */

import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
	AGENT_PROVIDER_IDS,
	EXTRACT_PROVIDER_IDS,
	SEARCH_PROVIDER_IDS,
} from '@mana/shared-research';
import type { HonoEnv } from '../lib/hono-env';
import type { Database } from '../db/connection';
import { providerConfigs } from '../db/schema/research';
import { NotFoundError } from '../lib/errors';

const ALL_PROVIDER_IDS = [
	...SEARCH_PROVIDER_IDS,
	...EXTRACT_PROVIDER_IDS,
	...AGENT_PROVIDER_IDS,
] as const;

const upsertSchema = z.object({
	providerId: z.enum(ALL_PROVIDER_IDS),
	apiKey: z.string().min(8).max(512).optional(),
	enabled: z.boolean().optional(),
	dailyBudgetCredits: z.number().int().nonnegative().nullable().optional(),
	monthlyBudgetCredits: z.number().int().nonnegative().nullable().optional(),
});

/**
 * Mask a stored API key so the UI can render "••••last4" without sending the
 * raw secret to the browser on subsequent loads.
 */
function maskKey(raw: string | null): string | null {
	if (!raw) return null;
	if (raw.length <= 8) return '••••';
	return `••••${raw.slice(-4)}`;
}

export function createProviderConfigRoutes(db: Database) {
	return new Hono<HonoEnv>()
		.get('/', async (c) => {
			const user = c.get('user');
			const rows = await db
				.select()
				.from(providerConfigs)
				.where(eq(providerConfigs.userId, user.userId));
			return c.json({
				configs: rows.map((r) => ({
					id: r.id,
					providerId: r.providerId,
					enabled: r.enabled,
					dailyBudgetCredits: r.dailyBudgetCredits,
					monthlyBudgetCredits: r.monthlyBudgetCredits,
					maskedKey: maskKey(r.apiKeyEncrypted),
					hasKey: !!r.apiKeyEncrypted,
					updatedAt: r.updatedAt,
				})),
			});
		})
		.post('/', async (c) => {
			const user = c.get('user');
			const body = upsertSchema.parse(await c.req.json());

			const [existing] = await db
				.select()
				.from(providerConfigs)
				.where(
					and(
						eq(providerConfigs.userId, user.userId),
						eq(providerConfigs.providerId, body.providerId)
					)
				)
				.limit(1);

			if (existing) {
				const patch: Partial<typeof providerConfigs.$inferInsert> = {
					updatedAt: new Date(),
				};
				if (body.apiKey !== undefined) patch.apiKeyEncrypted = body.apiKey;
				if (body.enabled !== undefined) patch.enabled = body.enabled;
				if (body.dailyBudgetCredits !== undefined)
					patch.dailyBudgetCredits = body.dailyBudgetCredits;
				if (body.monthlyBudgetCredits !== undefined)
					patch.monthlyBudgetCredits = body.monthlyBudgetCredits;

				const [updated] = await db
					.update(providerConfigs)
					.set(patch)
					.where(eq(providerConfigs.id, existing.id))
					.returning();
				return c.json({
					id: updated.id,
					providerId: updated.providerId,
					enabled: updated.enabled,
					dailyBudgetCredits: updated.dailyBudgetCredits,
					monthlyBudgetCredits: updated.monthlyBudgetCredits,
					maskedKey: maskKey(updated.apiKeyEncrypted),
					hasKey: !!updated.apiKeyEncrypted,
				});
			}

			const [created] = await db
				.insert(providerConfigs)
				.values({
					userId: user.userId,
					providerId: body.providerId,
					apiKeyEncrypted: body.apiKey ?? null,
					enabled: body.enabled ?? true,
					dailyBudgetCredits: body.dailyBudgetCredits ?? null,
					monthlyBudgetCredits: body.monthlyBudgetCredits ?? null,
				})
				.returning();
			return c.json({
				id: created.id,
				providerId: created.providerId,
				enabled: created.enabled,
				dailyBudgetCredits: created.dailyBudgetCredits,
				monthlyBudgetCredits: created.monthlyBudgetCredits,
				maskedKey: maskKey(created.apiKeyEncrypted),
				hasKey: !!created.apiKeyEncrypted,
			});
		})
		.delete('/:providerId', async (c) => {
			const user = c.get('user');
			const providerId = c.req.param('providerId');
			const deleted = await db
				.delete(providerConfigs)
				.where(
					and(eq(providerConfigs.userId, user.userId), eq(providerConfigs.providerId, providerId))
				)
				.returning();
			if (deleted.length === 0) throw new NotFoundError('Config not found');
			return c.json({ success: true });
		});
}
