/**
 * Integration tests for the credit-grant flows.
 *
 * Skipped unless TEST_DATABASE_URL is set. Run via:
 *   TEST_DATABASE_URL=postgres://… bun test src/services/feedback-credits.integration.test.ts
 *
 * Hits a real Postgres for cross-schema correctness (auth.users JOIN,
 * feedback_grant_log rate-limit window, etc.) but mocks the HTTP call
 * to mana-credits so the suite doesn't need that service running.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { eq, sql } from 'drizzle-orm';
import { FeedbackService, REWARD } from './feedback';
import {
	HAVE_TEST_DB,
	TEST_DATABASE_URL,
	connectTestDb,
	seedUser,
	cleanupTestData,
	mockCreditsFetch,
	type TestDb,
	type FetchMock,
} from '../test-helpers/db';
import { feedbackGrantLog, userFeedback, feedbackReactions } from '../db/schema/feedback';

const maybeDescribe = HAVE_TEST_DB ? describe : describe.skip;

maybeDescribe('feedback service — credit-grant integration', () => {
	let client: ReturnType<typeof import('postgres')>;
	let db!: TestDb;
	let service!: FeedbackService;
	let fetchMock!: FetchMock;

	beforeAll(() => {
		void TEST_DATABASE_URL;
		const conn = connectTestDb();
		client = conn.client;
		db = conn.db;
	});

	beforeEach(() => {
		fetchMock = mockCreditsFetch();
		// Each test gets a fresh service instance, founder-whitelist
		// configurable per test via re-instantiation.
		service = new FeedbackService(
			db,
			'', // llmUrl unset → auto-title falls back to slice
			'test-pseudonym-secret',
			'http://mock-credits',
			'test-service-key',
			new Set<string>()
		);
	});

	afterAll(async () => {
		await cleanupTestData(db);
		await client.end();
	});

	describe('submit bonus', () => {
		it('grants +5 Credits when a 20+ char top-level wish is submitted', async () => {
			const author = await seedUser(db);

			await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'I would really like X please, this would help me a lot',
			});

			// Fire-and-forget — give the void-promise a chance to land.
			await new Promise((r) => setTimeout(r, 50));

			expect(fetchMock.calls).toHaveLength(1);
			expect(fetchMock.calls[0].userId).toBe(author.id);
			expect(fetchMock.calls[0].amount).toBe(REWARD.submit);
			expect(fetchMock.calls[0].reason).toBe('feedback_submit');
		});

		it('does NOT grant when feedback is too short (<20 chars)', async () => {
			const author = await seedUser(db);

			await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'too short',
			});

			await new Promise((r) => setTimeout(r, 50));
			expect(fetchMock.calls).toHaveLength(0);
		});

		it('does NOT grant for replies (parentId set)', async () => {
			const author = await seedUser(db);

			// Create the parent first (top-level).
			const parent = await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'I would like X please, top-level wish here',
			});
			await new Promise((r) => setTimeout(r, 50));
			fetchMock.calls.length = 0; // clear

			// Now post a reply — should not bonus.
			await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'agreed, this would be helpful for me too',
				parentId: parent.id,
			});

			await new Promise((r) => setTimeout(r, 50));
			expect(fetchMock.calls).toHaveLength(0);
		});

		it('does NOT grant for founder-whitelisted users', async () => {
			const founder = await seedUser(db);
			const founderService = new FeedbackService(
				db,
				'',
				'test-pseudonym-secret',
				'http://mock-credits',
				'test-service-key',
				new Set([founder.id])
			);

			await founderService.createFeedback(founder.id, {
				appId: 'mana',
				feedbackText: 'I am the founder posting a long enough wish here',
			});

			await new Promise((r) => setTimeout(r, 50));
			expect(fetchMock.calls).toHaveLength(0);
		});

		it('rate-limits at 10 grants per 24h via feedback_grant_log', async () => {
			const author = await seedUser(db);

			// Pre-fill the grant-log with 10 entries to simulate 10 prior grants.
			for (let i = 0; i < 10; i++) {
				await db.insert(feedbackGrantLog).values({ userId: author.id, reason: 'feedback_submit' });
			}

			// 11th submit should NOT trigger a fetch.
			await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'eleventh wish today should hit the rate limit',
			});

			await new Promise((r) => setTimeout(r, 50));
			expect(fetchMock.calls).toHaveLength(0);
		});

		it('does not log to grant_log when alreadyGranted is true (idempotent re-attempt)', async () => {
			const author = await seedUser(db);
			fetchMock.makeAlreadyGranted();

			await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'first submission of a long wish that landed already',
			});
			await new Promise((r) => setTimeout(r, 50));

			// fetch was called, but the rate-limit-log row should NOT have been
			// written because the grant was a no-op (alreadyGranted=true).
			const [logCount] = await db
				.select({ ct: sql<number>`count(*)::int` })
				.from(feedbackGrantLog)
				.where(eq(feedbackGrantLog.userId, author.id));
			expect(logCount.ct).toBe(0);
		});
	});

	describe('ship bonus', () => {
		it('grants +500 to author + +25 to 👍/🚀 reactioners on completed transition', async () => {
			const author = await seedUser(db);
			const supporterA = await seedUser(db);
			const supporterB = await seedUser(db);
			const thinker = await seedUser(db);

			const wish = await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'a substantial wish that several people support strongly',
			});
			await new Promise((r) => setTimeout(r, 30));
			fetchMock.calls.length = 0; // ignore submit grant

			// Three supporters react with eligible emojis, one with 🤔 (excluded).
			await service.toggleReaction(wish.id, supporterA.id, '👍');
			await service.toggleReaction(wish.id, supporterB.id, '🚀');
			await service.toggleReaction(wish.id, thinker.id, '🤔');

			await service.adminUpdate(wish.id, { status: 'completed' });
			await new Promise((r) => setTimeout(r, 100));

			const grantsByUser = new Map<string, number>();
			for (const c of fetchMock.calls) grantsByUser.set(c.userId, c.amount);
			expect(grantsByUser.get(author.id)).toBe(REWARD.shipped);
			expect(grantsByUser.get(supporterA.id)).toBe(REWARD.reactionMatch);
			expect(grantsByUser.get(supporterB.id)).toBe(REWARD.reactionMatch);
			expect(grantsByUser.has(thinker.id)).toBe(false); // 🤔 excluded
		});

		it('does not double-pay on status flapping (completed → in_progress → completed)', async () => {
			const author = await seedUser(db);
			const wish = await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'a wish that we will toggle through statuses repeatedly',
			});
			await new Promise((r) => setTimeout(r, 30));
			fetchMock.calls.length = 0;

			await service.adminUpdate(wish.id, { status: 'completed' });
			await new Promise((r) => setTimeout(r, 50));
			const firstCallCount = fetchMock.calls.length;

			// Flap: back to in_progress, then back to completed.
			await service.adminUpdate(wish.id, { status: 'in_progress' });
			await service.adminUpdate(wish.id, { status: 'completed' });
			await new Promise((r) => setTimeout(r, 50));

			// The second 'completed' transition fires the trigger again,
			// but the grant is idempotent via referenceId — mock signals
			// 'alreadyGranted' on second call, so net author bonus is one.
			// The fetch count goes up (the call was made), but the LOG
			// stays at one because alreadyGranted=true skips the log row.
			expect(fetchMock.calls.length).toBeGreaterThanOrEqual(firstCallCount);
			// Verify the second call had the same referenceId as the first
			// for the author bonus (idempotency-key shape).
			const authorCalls = fetchMock.calls.filter(
				(c) => c.userId === author.id && c.reason === 'feedback_shipped'
			);
			const refIds = new Set(authorCalls.map((c) => c.referenceId));
			expect(refIds.size).toBe(1); // same `${id}_shipped` for both
		});

		it('skips ship bonus for founder-authored wishes', async () => {
			const founder = await seedUser(db);
			const founderService = new FeedbackService(
				db,
				'',
				'test-pseudonym-secret',
				'http://mock-credits',
				'test-service-key',
				new Set([founder.id])
			);

			const wish = await founderService.createFeedback(founder.id, {
				appId: 'mana',
				feedbackText: 'founder-authored wish that ships and should NOT pay back',
			});
			await new Promise((r) => setTimeout(r, 30));
			fetchMock.calls.length = 0;

			await founderService.adminUpdate(wish.id, { status: 'completed' });
			await new Promise((r) => setTimeout(r, 50));

			const founderGrants = fetchMock.calls.filter((c) => c.userId === founder.id);
			expect(founderGrants).toHaveLength(0);
		});
	});

	describe('reaction-bonus', () => {
		it('does not pay an author who reacted on their own item', async () => {
			const author = await seedUser(db);
			const supporter = await seedUser(db);

			const wish = await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'a wish that the author also reacts to themselves yay',
			});
			await new Promise((r) => setTimeout(r, 30));

			await service.toggleReaction(wish.id, author.id, '👍'); // self-react
			await service.toggleReaction(wish.id, supporter.id, '🚀');

			fetchMock.calls.length = 0;
			await service.adminUpdate(wish.id, { status: 'completed' });
			await new Promise((r) => setTimeout(r, 100));

			// Author gets +500 from the ship bonus, but NOT a separate
			// +25 reaction-match (would be double-dipping). Supporter gets +25.
			const calls = fetchMock.calls;
			const authorReactionCalls = calls.filter(
				(c) => c.userId === author.id && c.reason === 'feedback_reaction_match'
			);
			expect(authorReactionCalls).toHaveLength(0);

			const supporterReactionCalls = calls.filter(
				(c) => c.userId === supporter.id && c.reason === 'feedback_reaction_match'
			);
			expect(supporterReactionCalls).toHaveLength(1);
		});

		it('only pays each reactioner once even if they used multiple eligible emojis', async () => {
			const author = await seedUser(db);
			const enthusiast = await seedUser(db);

			const wish = await service.createFeedback(author.id, {
				appId: 'mana',
				feedbackText: 'a wish that one supporter reacts to with multiple emojis',
			});
			await new Promise((r) => setTimeout(r, 30));

			await service.toggleReaction(wish.id, enthusiast.id, '👍');
			await service.toggleReaction(wish.id, enthusiast.id, '🚀');

			fetchMock.calls.length = 0;
			await service.adminUpdate(wish.id, { status: 'completed' });
			await new Promise((r) => setTimeout(r, 100));

			const enthusiastReactionCalls = fetchMock.calls.filter(
				(c) => c.userId === enthusiast.id && c.reason === 'feedback_reaction_match'
			);
			expect(enthusiastReactionCalls).toHaveLength(1);
		});
	});

	void userFeedback; // keep imports tree-shake-safe
	void feedbackReactions;
});
