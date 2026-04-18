/**
 * Shared test helpers for mana-events.
 *
 * Each test suite gets its own Hono app built via createApp() with a
 * fake auth middleware that injects whichever userId the test wants
 * via an X-Test-User header. Avoids spinning up a real mana-auth +
 * JWKS for unit tests.
 */

import type { MiddlewareHandler } from 'hono';
import { sql } from 'drizzle-orm';
import { createApp } from '../app';
import { getDb, type Database } from '../db/connection';
import type { Config } from '../config';
import type { AuthUser } from '../middleware/jwt-auth';

const TEST_DB_URL =
	process.env.TEST_DATABASE_URL ||
	process.env.DATABASE_URL ||
	'postgresql://mana:devpassword@localhost:5432/mana_platform';

export const TEST_USER_ID = '00000000-0000-0000-0000-00000000beef';
export const OTHER_USER_ID = '00000000-0000-0000-0000-0000000ff1ce';

/** Test app + db handle that share lifetime. */
export interface TestApp {
	db: Database;
	fetch: (req: Request) => Promise<Response> | Response;
	wipe(): Promise<void>;
}

const TEST_CONFIG: Config = {
	port: 0,
	databaseUrl: TEST_DB_URL,
	manaAuthUrl: 'http://localhost:0',
	cors: { origins: ['*'] },
	rateLimit: {
		// Tight cap so the rate-limit test can hit it without sending
		// hundreds of requests.
		rsvpPerTokenPerHour: 5,
		rsvpMaxPerToken: 20,
	},
	manaResearchUrl: 'http://localhost:3068',
	manaLlmUrl: 'http://localhost:3025',
	meetupApiKey: null,
};

/**
 * Auth mock — reads the user id from the X-Test-User header. If the
 * header is missing the request is rejected with 401, mirroring the
 * real jwtAuth behaviour.
 */
function mockAuth(): MiddlewareHandler {
	return async (c, next) => {
		const userId = c.req.header('X-Test-User');
		if (!userId) {
			return c.json({ statusCode: 401, message: 'Missing test user' }, 401);
		}
		const user: AuthUser = { userId, email: `${userId}@test.local`, role: 'user' };
		c.set('user', user);
		await next();
	};
}

/** Build a fresh test app + return helpers for it. */
export function buildTestApp(overrides: Partial<Config> = {}): TestApp {
	const config: Config = { ...TEST_CONFIG, ...overrides };
	const db = getDb(config.databaseUrl);
	const app = createApp(db, config, mockAuth());

	return {
		db,
		fetch: (req: Request) => app.fetch(req),
		async wipe() {
			// Cascade FK from events_published handles public_rsvps + rate buckets
			await db.execute(sql`DELETE FROM events.events_published`);
			// Discovery tables — cascade handles discovered_events + user_actions
			await db.execute(sql`DELETE FROM event_discovery.discovery_user_actions`);
			await db.execute(sql`DELETE FROM event_discovery.discovered_events`);
			await db.execute(sql`DELETE FROM event_discovery.discovery_sources`);
			await db.execute(sql`DELETE FROM event_discovery.discovery_interests`);
			await db.execute(sql`DELETE FROM event_discovery.discovery_regions`);
		},
	};
}

/** Convenience: authenticated request as TEST_USER_ID. */
export function authedRequest(url: string, init: RequestInit & { user?: string } = {}): Request {
	const headers = new Headers(init.headers);
	headers.set('X-Test-User', init.user || TEST_USER_ID);
	if (init.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	return new Request(url, { ...init, headers });
}

/** Convenience: unauthenticated request (for /api/v1/rsvp/* and /health). */
export function publicRequest(url: string, init: RequestInit = {}): Request {
	const headers = new Headers(init.headers);
	if (init.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	return new Request(url, { ...init, headers });
}

/** Build a JSON body. */
export function jsonBody(payload: unknown): string {
	return JSON.stringify(payload);
}
