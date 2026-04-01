/**
 * Tests for Memoro API Zod validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
	createMemoBody,
	appendMemoBody,
	combineMemoBody,
	questionMemoBody,
	createSpaceBody,
	linkMemoBody,
	inviteBody,
	inviteActionBody,
	createBotBody,
	checkCreditsBody,
	consumeCreditsBody,
	updateDataUsageBody,
	updateProfileBody,
	paginationQuery,
	transcriptionCompletedBody,
	batchMetadataBody,
	manualCleanupBody,
} from '../schemas';

// ── createMemoBody ────────────────────────────────────────────────

describe('createMemoBody', () => {
	it('accepts valid input', () => {
		const result = createMemoBody.safeParse({
			filePath: 'user/recording.m4a',
			duration: 120,
		});
		expect(result.success).toBe(true);
	});

	it('accepts full input with optional fields', () => {
		const result = createMemoBody.safeParse({
			filePath: 'user/recording.m4a',
			duration: 60,
			spaceId: '11111111-2222-3333-4444-555555555555',
			blueprintId: '11111111-2222-3333-4444-555555555555',
			memoId: '11111111-2222-3333-4444-555555555555',
			recordingStartedAt: '2026-01-01T00:00:00Z',
			mediaType: 'audio',
		});
		expect(result.success).toBe(true);
	});

	it('rejects empty filePath', () => {
		const result = createMemoBody.safeParse({ filePath: '', duration: 10 });
		expect(result.success).toBe(false);
	});

	it('rejects missing duration', () => {
		const result = createMemoBody.safeParse({ filePath: 'test.m4a' });
		expect(result.success).toBe(false);
	});

	it('rejects negative duration', () => {
		const result = createMemoBody.safeParse({ filePath: 'test.m4a', duration: -1 });
		expect(result.success).toBe(false);
	});

	it('rejects invalid spaceId UUID', () => {
		const result = createMemoBody.safeParse({
			filePath: 'test.m4a',
			duration: 10,
			spaceId: 'not-a-uuid',
		});
		expect(result.success).toBe(false);
	});
});

// ── appendMemoBody ────────────────────────────────────────────────

describe('appendMemoBody', () => {
	it('accepts valid input', () => {
		const result = appendMemoBody.safeParse({
			filePath: 'user/append.m4a',
			duration: 30,
		});
		expect(result.success).toBe(true);
	});

	it('accepts optional recordingLanguages', () => {
		const result = appendMemoBody.safeParse({
			filePath: 'user/append.m4a',
			duration: 30,
			recordingLanguages: ['de', 'en'],
			enableDiarization: true,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.recordingLanguages).toEqual(['de', 'en']);
			expect(result.data.enableDiarization).toBe(true);
		}
	});

	it('rejects missing filePath', () => {
		const result = appendMemoBody.safeParse({ duration: 30 });
		expect(result.success).toBe(false);
	});
});

// ── combineMemoBody ───────────────────────────────────────────────

describe('combineMemoBody', () => {
	it('accepts 2 valid UUIDs', () => {
		const result = combineMemoBody.safeParse({
			memoIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
		});
		expect(result.success).toBe(true);
	});

	it('rejects single memoId', () => {
		const result = combineMemoBody.safeParse({
			memoIds: ['11111111-1111-1111-1111-111111111111'],
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty array', () => {
		const result = combineMemoBody.safeParse({ memoIds: [] });
		expect(result.success).toBe(false);
	});

	it('rejects invalid UUIDs', () => {
		const result = combineMemoBody.safeParse({
			memoIds: ['not-a-uuid', 'also-not-uuid'],
		});
		expect(result.success).toBe(false);
	});
});

// ── questionMemoBody ──────────────────────────────────────────────

describe('questionMemoBody', () => {
	it('accepts a question', () => {
		const result = questionMemoBody.safeParse({ question: 'What is this about?' });
		expect(result.success).toBe(true);
	});

	it('trims whitespace', () => {
		const result = questionMemoBody.safeParse({ question: '  What is this?  ' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.question).toBe('What is this?');
	});

	it('rejects empty question', () => {
		const result = questionMemoBody.safeParse({ question: '' });
		expect(result.success).toBe(false);
	});

	it('trims whitespace-only question to empty (caught by min length in route)', () => {
		const result = questionMemoBody.safeParse({ question: '   ' });
		// Trim produces empty string but min(1) runs before transform in Zod
		// The trim transform still runs, route handler checks for empty after trim
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.question).toBe('');
	});
});

// ── createSpaceBody ───────────────────────────────────────────────

describe('createSpaceBody', () => {
	it('accepts name only', () => {
		const result = createSpaceBody.safeParse({ name: 'My Space' });
		expect(result.success).toBe(true);
	});

	it('accepts name and description', () => {
		const result = createSpaceBody.safeParse({
			name: 'My Space',
			description: 'A great space',
		});
		expect(result.success).toBe(true);
	});

	it('trims name', () => {
		const result = createSpaceBody.safeParse({ name: '  My Space  ' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.name).toBe('My Space');
	});

	it('rejects empty name', () => {
		const result = createSpaceBody.safeParse({ name: '' });
		expect(result.success).toBe(false);
	});
});

// ── linkMemoBody ──────────────────────────────────────────────────

describe('linkMemoBody', () => {
	it('accepts valid UUID', () => {
		const result = linkMemoBody.safeParse({
			memoId: '11111111-2222-3333-4444-555555555555',
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid UUID', () => {
		const result = linkMemoBody.safeParse({ memoId: 'not-a-uuid' });
		expect(result.success).toBe(false);
	});
});

// ── inviteBody ────────────────────────────────────────────────────

describe('inviteBody', () => {
	it('accepts valid email', () => {
		const result = inviteBody.safeParse({ email: 'user@example.com' });
		expect(result.success).toBe(true);
	});

	it('rejects invalid email', () => {
		const result = inviteBody.safeParse({ email: 'not-an-email' });
		expect(result.success).toBe(false);
	});

	it('rejects email with leading/trailing whitespace (Zod email validates before trim)', () => {
		const result = inviteBody.safeParse({ email: '  user@example.com  ' });
		expect(result.success).toBe(false);
	});
});

// ── inviteActionBody ──────────────────────────────────────────────

describe('inviteActionBody', () => {
	it('accepts valid UUID', () => {
		const result = inviteActionBody.safeParse({
			inviteId: '11111111-2222-3333-4444-555555555555',
		});
		expect(result.success).toBe(true);
	});

	it('rejects non-UUID', () => {
		const result = inviteActionBody.safeParse({ inviteId: 'abc' });
		expect(result.success).toBe(false);
	});
});

// ── createBotBody ─────────────────────────────────────────────────

describe('createBotBody', () => {
	it('accepts Google Meet URL', () => {
		const result = createBotBody.safeParse({
			meeting_url: 'https://meet.google.com/abc-defg-hij',
		});
		expect(result.success).toBe(true);
	});

	it('accepts Zoom URL', () => {
		const result = createBotBody.safeParse({
			meeting_url: 'https://us02web.zoom.us/j/123456789',
		});
		expect(result.success).toBe(true);
	});

	it('accepts Teams URL', () => {
		const result = createBotBody.safeParse({
			meeting_url: 'https://teams.microsoft.com/l/meetup-join/123',
		});
		expect(result.success).toBe(true);
	});

	it('rejects non-meeting URL', () => {
		const result = createBotBody.safeParse({
			meeting_url: 'https://example.com/meeting',
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty URL', () => {
		const result = createBotBody.safeParse({ meeting_url: '' });
		expect(result.success).toBe(false);
	});
});

// ── Credits schemas ───────────────────────────────────────────────

describe('checkCreditsBody', () => {
	it('accepts valid input', () => {
		const result = checkCreditsBody.safeParse({ operation: 'transcription', amount: 5 });
		expect(result.success).toBe(true);
	});

	it('rejects empty operation', () => {
		const result = checkCreditsBody.safeParse({ operation: '', amount: 5 });
		expect(result.success).toBe(false);
	});

	it('rejects negative amount', () => {
		const result = checkCreditsBody.safeParse({ operation: 'transcription', amount: -1 });
		expect(result.success).toBe(false);
	});
});

describe('consumeCreditsBody', () => {
	it('accepts valid input', () => {
		const result = consumeCreditsBody.safeParse({
			operation: 'transcription',
			amount: 5,
			description: 'Memo transcription',
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing description', () => {
		const result = consumeCreditsBody.safeParse({
			operation: 'transcription',
			amount: 5,
		});
		expect(result.success).toBe(false);
	});
});

// ── Settings schemas ──────────────────────────────────────────────

describe('updateDataUsageBody', () => {
	it('accepts true', () => {
		const result = updateDataUsageBody.safeParse({ accepted: true });
		expect(result.success).toBe(true);
	});

	it('accepts false', () => {
		const result = updateDataUsageBody.safeParse({ accepted: false });
		expect(result.success).toBe(true);
	});

	it('rejects string', () => {
		const result = updateDataUsageBody.safeParse({ accepted: 'yes' });
		expect(result.success).toBe(false);
	});
});

describe('updateProfileBody', () => {
	it('accepts display_name', () => {
		const result = updateProfileBody.safeParse({ display_name: 'John' });
		expect(result.success).toBe(true);
	});

	it('accepts avatar_url', () => {
		const result = updateProfileBody.safeParse({
			avatar_url: 'https://example.com/avatar.jpg',
		});
		expect(result.success).toBe(true);
	});

	it('rejects empty object', () => {
		const result = updateProfileBody.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects bio over 500 chars', () => {
		const result = updateProfileBody.safeParse({ bio: 'x'.repeat(501) });
		expect(result.success).toBe(false);
	});

	it('rejects invalid avatar URL', () => {
		const result = updateProfileBody.safeParse({ avatar_url: 'not-a-url' });
		expect(result.success).toBe(false);
	});
});

// ── paginationQuery ───────────────────────────────────────────────

describe('paginationQuery', () => {
	it('uses defaults when empty', () => {
		const result = paginationQuery.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(50);
			expect(result.data.offset).toBe(0);
		}
	});

	it('coerces string values', () => {
		const result = paginationQuery.safeParse({ limit: '20', offset: '10' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(20);
			expect(result.data.offset).toBe(10);
		}
	});

	it('clamps limit to max 100', () => {
		const result = paginationQuery.safeParse({ limit: '200' });
		expect(result.success).toBe(false);
	});

	it('rejects negative offset', () => {
		const result = paginationQuery.safeParse({ offset: '-1' });
		expect(result.success).toBe(false);
	});
});

// ── Internal schemas ──────────────────────────────────────────────

describe('transcriptionCompletedBody', () => {
	it('accepts minimal success callback', () => {
		const result = transcriptionCompletedBody.safeParse({
			memoId: 'abc123',
			userId: 'user456',
			success: true,
		});
		expect(result.success).toBe(true);
	});

	it('accepts full transcription result', () => {
		const result = transcriptionCompletedBody.safeParse({
			memoId: 'abc123',
			userId: 'user456',
			success: true,
			transcriptionResult: {
				transcript: 'Hello world',
				utterances: [
					{ offset: 0, duration: 1000, text: 'Hello', speaker: 'Speaker 1' },
					{ offset: 1000, duration: 1000, text: 'world' },
				],
				languages: ['en'],
				primary_language: 'en',
				duration: 2.0,
			},
			route: 'whisperx',
		});
		expect(result.success).toBe(true);
	});

	it('accepts error callback', () => {
		const result = transcriptionCompletedBody.safeParse({
			memoId: 'abc123',
			userId: 'user456',
			success: false,
			error: 'Transcription failed',
			fallbackStage: 'azure-batch',
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing memoId', () => {
		const result = transcriptionCompletedBody.safeParse({
			userId: 'user456',
			success: true,
		});
		expect(result.success).toBe(false);
	});
});

describe('batchMetadataBody', () => {
	it('accepts valid input', () => {
		const result = batchMetadataBody.safeParse({
			memoId: 'abc123',
			jobId: 'job-456',
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing jobId', () => {
		const result = batchMetadataBody.safeParse({ memoId: 'abc123' });
		expect(result.success).toBe(false);
	});
});

describe('manualCleanupBody', () => {
	it('accepts empty object', () => {
		const result = manualCleanupBody.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts user IDs', () => {
		const result = manualCleanupBody.safeParse({
			userIds: ['11111111-2222-3333-4444-555555555555'],
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid UUIDs', () => {
		const result = manualCleanupBody.safeParse({
			userIds: ['not-a-uuid'],
		});
		expect(result.success).toBe(false);
	});
});
