/**
 * Integration tests for the loop-closure notifications.
 *
 * Verify that adminUpdate enqueues the right notifications, that
 * mark-read scopes correctly to the requesting user, and that
 * Reactioner-Bonus notifications land alongside the credit grants.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { eq } from 'drizzle-orm';
import { FeedbackService } from './feedback';
import { feedbackNotifications } from '../db/schema/feedback';
import {
	HAVE_TEST_DB,
	connectTestDb,
	seedUser,
	cleanupTestData,
	mockCreditsFetch,
	type TestDb,
	type FetchMock,
} from '../test-helpers/db';

const maybeDescribe = HAVE_TEST_DB ? describe : describe.skip;

maybeDescribe('feedback service — notification integration', () => {
	let client: ReturnType<typeof import('postgres')>;
	let db!: TestDb;
	let service!: FeedbackService;
	let fetchMock!: FetchMock;

	beforeAll(() => {
		const conn = connectTestDb();
		client = conn.client;
		db = conn.db;
	});

	beforeEach(() => {
		fetchMock = mockCreditsFetch();
		service = new FeedbackService(
			db,
			'',
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

	it('enqueues an author notification on every status transition', async () => {
		const author = await seedUser(db);
		const wish = await service.createFeedback(author.id, {
			appId: 'mana',
			feedbackText: 'a wish to walk through every single status transition with',
		});
		await new Promise((r) => setTimeout(r, 30));

		await service.adminUpdate(wish.id, { status: 'planned' });
		await new Promise((r) => setTimeout(r, 30));
		await service.adminUpdate(wish.id, { status: 'in_progress' });
		await new Promise((r) => setTimeout(r, 30));
		await service.adminUpdate(wish.id, { status: 'completed' });
		await new Promise((r) => setTimeout(r, 50));

		const notifs = await service.getNotifications(author.id);
		const kinds = notifs.map((n) => n.kind);
		expect(kinds).toContain('status_planned');
		expect(kinds).toContain('status_in_progress');
		expect(kinds).toContain('status_completed');
	});

	it('does NOT enqueue when status is unchanged', async () => {
		const author = await seedUser(db);
		const wish = await service.createFeedback(author.id, {
			appId: 'mana',
			feedbackText: 'a wish where adminUpdate touches non-status fields only',
		});
		await new Promise((r) => setTimeout(r, 30));

		await service.adminUpdate(wish.id, { isPublic: false });
		await new Promise((r) => setTimeout(r, 30));

		const notifs = await service.getNotifications(author.id);
		expect(notifs.filter((n) => n.kind.startsWith('status_'))).toHaveLength(0);
	});

	it('enqueues an admin_response notification when adminResponse is added', async () => {
		const author = await seedUser(db);
		const wish = await service.createFeedback(author.id, {
			appId: 'mana',
			feedbackText: 'a wish that the admin will respond to with a real reply text',
		});
		await new Promise((r) => setTimeout(r, 30));

		await service.adminUpdate(wish.id, {
			adminResponse: 'Danke für den Hinweis — wir schauen uns das an.',
		});
		await new Promise((r) => setTimeout(r, 30));

		const notifs = await service.getNotifications(author.id);
		const responseNotifs = notifs.filter((n) => n.kind === 'admin_response');
		expect(responseNotifs).toHaveLength(1);
		expect(responseNotifs[0].body).toContain('Danke für den Hinweis');
	});

	it('enqueues a reactioner_bonus notification on completed transition', async () => {
		const author = await seedUser(db);
		const supporter = await seedUser(db);
		const wish = await service.createFeedback(author.id, {
			appId: 'mana',
			feedbackText: 'a wish that one supporter reacts to and watches it ship',
		});
		await new Promise((r) => setTimeout(r, 30));

		await service.toggleReaction(wish.id, supporter.id, '🚀');
		await service.adminUpdate(wish.id, { status: 'completed' });
		await new Promise((r) => setTimeout(r, 100));

		const supporterNotifs = await service.getNotifications(supporter.id);
		const bonusNotifs = supporterNotifs.filter((n) => n.kind === 'reactioner_bonus');
		expect(bonusNotifs).toHaveLength(1);
		expect(bonusNotifs[0].creditsAwarded).toBe(25);
	});

	it('markNotificationRead scopes to the requesting user (cannot read someone else)', async () => {
		const owner = await seedUser(db);
		const stranger = await seedUser(db);
		const wish = await service.createFeedback(owner.id, {
			appId: 'mana',
			feedbackText: 'wish whose notification we will try to read as a stranger',
		});
		await new Promise((r) => setTimeout(r, 30));

		await service.adminUpdate(wish.id, { status: 'planned' });
		await new Promise((r) => setTimeout(r, 30));

		const ownerNotifs = await service.getNotifications(owner.id);
		expect(ownerNotifs).toHaveLength(1);
		const notif = ownerNotifs[0];
		expect(notif.readAt).toBeNull();

		// Stranger tries to mark the owner's notification — must be a no-op.
		await service.markNotificationRead(notif.id, stranger.id);
		const [unchanged] = await db
			.select()
			.from(feedbackNotifications)
			.where(eq(feedbackNotifications.id, notif.id))
			.limit(1);
		expect(unchanged.readAt).toBeNull();

		// Owner marks it — readAt is set.
		await service.markNotificationRead(notif.id, owner.id);
		const [marked] = await db
			.select()
			.from(feedbackNotifications)
			.where(eq(feedbackNotifications.id, notif.id))
			.limit(1);
		expect(marked.readAt).not.toBeNull();
	});

	it('markAllNotificationsRead only touches the requesting user’s rows', async () => {
		const userA = await seedUser(db);
		const userB = await seedUser(db);
		const wishA = await service.createFeedback(userA.id, {
			appId: 'mana',
			feedbackText: 'wish authored by user A that gets a status notification',
		});
		const wishB = await service.createFeedback(userB.id, {
			appId: 'mana',
			feedbackText: 'wish authored by user B that gets a status notification',
		});
		await new Promise((r) => setTimeout(r, 30));

		await service.adminUpdate(wishA.id, { status: 'planned' });
		await service.adminUpdate(wishB.id, { status: 'planned' });
		await new Promise((r) => setTimeout(r, 30));

		const result = await service.markAllNotificationsRead(userA.id);
		expect(result.count).toBe(1);

		const aNotifs = await service.getNotifications(userA.id);
		const bNotifs = await service.getNotifications(userB.id);
		expect(aNotifs.every((n) => n.readAt)).toBe(true);
		expect(bNotifs.every((n) => n.readAt === null)).toBe(true);
	});

	void fetchMock; // mock swallows grant calls so they don't fail tests
});
