/**
 * Privacy-boundary tests für die `redact()`-Funktion.
 *
 * Kritisch: anonymous public endpoint darf NIE einen Klarnamen
 * ausliefern, auch wenn der User-Account `communityShowRealName=true`
 * gesetzt hat. Diese Tests sind das Sicherheitsnetz für die ›Public
 * bleibt anonym‹-Garantie der Community-Surface.
 */
import { describe, expect, it } from 'bun:test';
import { __TEST__ } from './feedback';

const { redact } = __TEST__;

const baseFeedback = {
	id: 'feedback-1',
	userId: 'user-42',
	appId: 'mana',
	title: 'Test',
	feedbackText: 'I would like X please',
	category: 'feature' as const,
	status: 'submitted' as const,
	isPublic: true,
	adminResponse: null,
	voteCount: 0 as never,
	displayHash: 'abc123def456',
	displayName: 'Wachsame Eule #4528',
	moduleContext: null,
	parentId: null,
	reactions: { '👍': 3, '❤️': 1 },
	score: 4,
	deviceInfo: { ip: '1.2.3.4' } as never,
	createdAt: new Date('2026-04-27T10:00:00Z'),
	updatedAt: new Date('2026-04-27T10:00:00Z'),
} as Parameters<typeof redact>[0];

const optedInAuthor = {
	name: 'Till Schäfer',
	communityShowRealName: true,
	communityKarma: 47,
};

const optedOutAuthor = {
	name: 'Till Schäfer',
	communityShowRealName: false,
	communityKarma: 47,
};

describe('redact (privacy-boundary)', () => {
	it('NEVER leaks realName on the anonymous path even when author opted in', () => {
		const item = redact(baseFeedback, optedInAuthor, { includeRealName: false });
		expect(item.realName).toBeUndefined();
	});

	it('NEVER leaks realName on the auth path when author opted OUT', () => {
		const item = redact(baseFeedback, optedOutAuthor, { includeRealName: true });
		expect(item.realName).toBeUndefined();
	});

	it('exposes realName ONLY when author opted-in AND auth-path requested it', () => {
		const item = redact(baseFeedback, optedInAuthor, { includeRealName: true });
		expect(item.realName).toBe('Till Schäfer');
	});

	it('strips userId, deviceInfo, voteCount from output', () => {
		const item = redact(baseFeedback, optedInAuthor, { includeRealName: true });
		expect((item as Record<string, unknown>).userId).toBeUndefined();
		expect((item as Record<string, unknown>).deviceInfo).toBeUndefined();
		expect((item as Record<string, unknown>).voteCount).toBeUndefined();
	});

	it('exposes karma always — it is public information', () => {
		const item1 = redact(baseFeedback, optedInAuthor, { includeRealName: false });
		const item2 = redact(baseFeedback, optedOutAuthor, { includeRealName: false });
		expect(item1.karma).toBe(47);
		expect(item2.karma).toBe(47);
	});

	it('falls back to karma=0 when author row is null (deleted user)', () => {
		const item = redact(baseFeedback, null, { includeRealName: true });
		expect(item.karma).toBe(0);
		expect(item.realName).toBeUndefined();
	});

	it('exposes displayHash + displayName on every output (needed for avatar + profile-URL)', () => {
		const anonymous = redact(baseFeedback, optedInAuthor, { includeRealName: false });
		const auth = redact(baseFeedback, optedInAuthor, { includeRealName: true });
		expect(anonymous.displayHash).toBe('abc123def456');
		expect(auth.displayHash).toBe('abc123def456');
		expect(anonymous.displayName).toBe('Wachsame Eule #4528');
		expect(auth.displayName).toBe('Wachsame Eule #4528');
	});

	it('default options strip realName (defensive default)', () => {
		// When no options passed, behaves like the anonymous path.
		const item = redact(baseFeedback, optedInAuthor);
		expect(item.realName).toBeUndefined();
	});

	it('falls back to displayName="Anonym" when missing', () => {
		const itemWithoutName = { ...baseFeedback, displayName: null };
		const item = redact(itemWithoutName as never, null, { includeRealName: false });
		expect(item.displayName).toBe('Anonym');
	});
});
