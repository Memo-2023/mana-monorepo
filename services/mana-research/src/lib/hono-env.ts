/**
 * Hono Context Variables typing for mana-research.
 *
 * Allows `c.get('user')` / `c.set('user', ...)` to be typed throughout the
 * service. Used via `new Hono<{ Variables: HonoVariables }>()`.
 */

import type { AuthUser } from '../middleware/jwt-auth';

export interface HonoVariables {
	user: AuthUser;
	appId?: string;
	service?: boolean;
}

export type HonoEnv = { Variables: HonoVariables };
