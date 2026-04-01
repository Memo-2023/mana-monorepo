/**
 * Zod validation schemas for all Memoro API endpoints.
 */

import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────────

export const paginationQuery = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0),
});

// ── Memos ─────────────────────────────────────────────────────────────────────

export const createMemoBody = z.object({
	filePath: z.string().min(1, 'filePath is required'),
	duration: z.number({ required_error: 'duration is required' }).min(0),
	spaceId: z.string().uuid().optional(),
	blueprintId: z.string().uuid().optional(),
	memoId: z.string().uuid().optional(),
	recordingStartedAt: z.string().optional(),
	location: z.unknown().optional(),
	mediaType: z.string().optional(),
});

export const appendMemoBody = z.object({
	filePath: z.string().min(1, 'filePath is required'),
	duration: z.number({ required_error: 'duration is required' }).min(0),
	recordingIndex: z.number().int().min(0).optional(),
	recordingLanguages: z.array(z.string()).optional(),
	enableDiarization: z.boolean().optional(),
});

export const combineMemoBody = z.object({
	memoIds: z.array(z.string().uuid()).min(2, 'At least 2 memoIds are required'),
});

export const questionMemoBody = z.object({
	question: z
		.string()
		.min(1, 'question is required')
		.transform((v) => v.trim()),
});

// ── Spaces ────────────────────────────────────────────────────────────────────

export const createSpaceBody = z.object({
	name: z
		.string()
		.min(1, 'name is required')
		.transform((v) => v.trim()),
	description: z.string().optional(),
});

export const linkMemoBody = z.object({
	memoId: z.string().uuid('memoId must be a valid UUID'),
});

export const inviteBody = z.object({
	email: z
		.string()
		.email('Valid email is required')
		.transform((v) => v.trim()),
});

// ── Invites ───────────────────────────────────────────────────────────────────

export const inviteActionBody = z.object({
	inviteId: z.string().uuid('inviteId is required'),
});

// ── Meetings ──────────────────────────────────────────────────────────────────

const meetingUrlPattern = /^https:\/\/(teams\.microsoft\.com|meet\.google\.com|[\w-]+\.zoom\.us)\//;

export const createBotBody = z.object({
	meeting_url: z
		.string()
		.regex(meetingUrlPattern, 'Please provide a valid Teams, Google Meet, or Zoom meeting URL'),
	space_id: z.string().uuid().optional(),
});

export const recordingToMemoBody = z.object({
	blueprintId: z.string().uuid().optional(),
});

// ── Credits ───────────────────────────────────────────────────────────────────

export const checkCreditsBody = z.object({
	operation: z.string().min(1, 'operation is required'),
	amount: z.number({ required_error: 'amount is required' }).min(0),
});

export const consumeCreditsBody = z.object({
	operation: z.string().min(1, 'operation is required'),
	amount: z.number({ required_error: 'amount is required' }).min(0),
	description: z.string().min(1, 'description is required'),
	metadata: z.record(z.unknown()).optional(),
});

// ── Settings ──────────────────────────────────────────────────────────────────

export const updateMemoroSettingsBody = z
	.record(z.unknown())
	.refine((obj) => Object.keys(obj).length > 0, 'At least one setting is required');

export const updateDataUsageBody = z.object({
	accepted: z.boolean({ required_error: 'accepted is required' }),
});

export const updateProfileBody = z
	.object({
		display_name: z.string().optional(),
		avatar_url: z.string().url().optional(),
		bio: z.string().max(500).optional(),
	})
	.refine(
		(obj) => Object.values(obj).some((v) => v !== undefined),
		'At least one field is required'
	);

// ── Internal ──────────────────────────────────────────────────────────────────

export const transcriptionCompletedBody = z.object({
	memoId: z.string().min(1, 'memoId is required'),
	userId: z.string().min(1, 'userId is required'),
	transcriptionResult: z
		.object({
			transcript: z.string().optional(),
			utterances: z
				.array(
					z.object({
						offset: z.number(),
						duration: z.number(),
						text: z.string(),
						speaker: z.string().optional(),
					})
				)
				.optional(),
			speakers: z.record(z.unknown()).optional(),
			speakerMap: z.record(z.unknown()).optional(),
			languages: z.array(z.string()).optional(),
			primary_language: z.string().optional(),
			duration: z.number().optional(),
		})
		.optional(),
	route: z.string().optional(),
	success: z.boolean(),
	error: z.string().optional(),
	fallbackStage: z.string().optional(),
});

export const appendTranscriptionCompletedBody = z.object({
	memoId: z.string().min(1, 'memoId is required'),
	userId: z.string().min(1, 'userId is required'),
	recordingIndex: z.number().int().min(0),
	transcriptionResult: z
		.object({
			transcript: z.string().optional(),
			utterances: z
				.array(
					z.object({
						offset: z.number(),
						duration: z.number(),
						text: z.string(),
						speaker: z.string().optional(),
					})
				)
				.optional(),
			speakers: z.record(z.unknown()).optional(),
			speakerMap: z.record(z.unknown()).optional(),
			languages: z.array(z.string()).optional(),
			primary_language: z.string().optional(),
			duration: z.number().optional(),
		})
		.optional(),
	success: z.boolean(),
	error: z.string().optional(),
	route: z.string().optional(),
});

export const batchMetadataBody = z.object({
	memoId: z.string().min(1, 'memoId is required'),
	jobId: z.string().min(1, 'jobId is required'),
	batchTranscription: z.boolean().optional(),
	userId: z.string().optional(),
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

export const manualCleanupBody = z.object({
	userIds: z.array(z.string().uuid()).optional(),
});
