/**
 * Integration-test scaffolding for mana-analytics.
 *
 * Connects to TEST_DATABASE_URL, exposes helpers to seed + clean up
 * test data, and patches globalThis.fetch so calls to mana-credits
 * are captured locally instead of hitting a real service. The whole
 * suite skips itself when TEST_DATABASE_URL is unset so a fresh
 * `bun test` doesn't fail in environments without a Postgres.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { authUsers } from '../db/schema/auth-users';
import {
	userFeedback,
	feedbackReactions,
	feedbackNotifications,
	feedbackGrantLog,
} from '../db/schema/feedback';
import * as schema from '../db/schema';

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
export const HAVE_TEST_DB = TEST_DATABASE_URL.length > 0;

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

export function connectTestDb() {
	const client = postgres(TEST_DATABASE_URL, { max: 3 });
	const db = drizzle(client, { schema });
	return { client, db };
}

export interface SeededUser {
	id: string;
	email: string;
	name: string;
}

let seededIds = new Set<string>();

/**
 * Insert a fresh row in auth.users for a test, returns the userId.
 * Always namespaced with `test-` prefix so a missed cleanup never
 * collides with real production data.
 */
export async function seedUser(
	db: TestDb,
	overrides: Partial<{ name: string; communityShowRealName: boolean; communityKarma: number }> = {}
): Promise<SeededUser> {
	const id = `test-${randomUUID()}`;
	const email = `${id}@test.local`;
	const name = overrides.name ?? `Test User ${id.slice(5, 10)}`;

	// Use a raw SQL insert because the cross-schema authUsers Drizzle
	// model only declares the columns mana-analytics READS — auth.users
	// has additional NOT NULL columns (email, etc.) we'd otherwise miss.
	await db.execute(sql`
		INSERT INTO auth.users (id, email, name, community_show_real_name, community_karma)
		VALUES (
			${id},
			${email},
			${name},
			${overrides.communityShowRealName ?? false},
			${overrides.communityKarma ?? 0}
		)
		ON CONFLICT (id) DO NOTHING
	`);
	seededIds.add(id);
	return { id, email, name };
}

/** Read auth.users.community_karma for a test user. */
export async function getKarma(db: TestDb, userId: string): Promise<number> {
	const [row] = await db
		.select({ karma: authUsers.communityKarma })
		.from(authUsers)
		.where(eq(authUsers.id, userId))
		.limit(1);
	return row?.karma ?? 0;
}

/** Truncate test-namespaced rows after a suite. */
export async function cleanupTestData(db: TestDb): Promise<void> {
	if (seededIds.size === 0) return;
	const ids = Array.from(seededIds);

	// Delete in dependency-aware order.
	for (const id of ids) {
		await db.delete(feedbackNotifications).where(sql`user_id = ${id}`);
		await db.delete(feedbackReactions).where(sql`user_id = ${id}`);
		await db.delete(feedbackGrantLog).where(sql`user_id = ${id}`);
		await db.delete(userFeedback).where(sql`user_id = ${id}`);
	}
	for (const id of ids) {
		await db.delete(authUsers).where(eq(authUsers.id, id));
	}
	seededIds.clear();
}

/**
 * Replace globalThis.fetch with a recorder. Returns the captured calls
 * + a `restore()` to put the original fetch back. The mock returns a
 * fixed `{ ok: true, alreadyGranted: false, newBalance: <amount> }`
 * response for /credits/grant — enough to keep grantCredits happy.
 */
export interface CreditGrantCall {
	userId: string;
	amount: number;
	reason: string;
	referenceId: string;
	description?: string;
}

export interface FetchMock {
	calls: CreditGrantCall[];
	restore: () => void;
	makeAlreadyGranted: () => void;
}

export function mockCreditsFetch(): FetchMock {
	const original = globalThis.fetch;
	const calls: CreditGrantCall[] = [];
	let alreadyGrantedNext = false;

	globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
		const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
		if (u.includes('/internal/credits/grant')) {
			const body = init?.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : {}) : {};
			calls.push(body as CreditGrantCall);
			const resp = {
				ok: true,
				alreadyGranted: alreadyGrantedNext,
				newBalance: alreadyGrantedNext ? 0 : (body as CreditGrantCall).amount,
				transactionId: `mock-tx-${calls.length}`,
			};
			alreadyGrantedNext = false;
			return new Response(JSON.stringify(resp), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			});
		}
		// Pass-through for non-credits calls.
		return original(url, init);
	}) as typeof fetch;

	return {
		calls,
		restore: () => {
			globalThis.fetch = original;
		},
		makeAlreadyGranted: () => {
			alreadyGrantedNext = true;
		},
	};
}
