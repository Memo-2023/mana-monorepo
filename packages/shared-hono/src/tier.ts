/**
 * Access tier helpers for server-side gating.
 *
 * Mirrors the hierarchy in @mana/shared-branding/mana-apps.ts. Kept here so
 * Bun/Hono services don't need to pull in a Svelte-facing package.
 *
 * If you change the hierarchy, update BOTH files.
 */

import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AccessTier } from './types';

const TIER_LEVELS: Record<AccessTier, number> = {
	guest: 0,
	public: 1,
	beta: 2,
	alpha: 3,
	founder: 4,
};

function normalizeTier(value: unknown): AccessTier {
	if (typeof value === 'string' && value in TIER_LEVELS) {
		return value as AccessTier;
	}
	return 'public';
}

export function getTierLevel(tier: string | undefined): number {
	if (!tier) return 0;
	return TIER_LEVELS[tier as AccessTier] ?? 0;
}

export function hasTier(userTier: string | undefined, minTier: AccessTier): boolean {
	return getTierLevel(userTier) >= TIER_LEVELS[minTier];
}

/**
 * Require a minimum access tier on a Hono route.
 *
 * Must run AFTER `authMiddleware()` so `userTier` is set on the context.
 *
 * Usage:
 * ```ts
 * app.use('/api/*', authMiddleware());
 * app.post('/api/v1/ai/generate', requireTier('alpha'), handler);
 * ```
 */
export function requireTier(minTier: AccessTier) {
	return async (c: Context, next: Next) => {
		const userTier = normalizeTier(c.get('userTier'));
		if (!hasTier(userTier, minTier)) {
			throw new HTTPException(403, {
				message: `Requires access tier '${minTier}' — current tier '${userTier}' is insufficient.`,
			});
		}
		return next();
	};
}
