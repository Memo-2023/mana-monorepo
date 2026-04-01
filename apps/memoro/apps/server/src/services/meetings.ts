/**
 * Meetings proxy service — proxies to meeting-bot service + direct Supabase queries.
 */

import { createServiceClient } from '../lib/supabase';

export type MeetingBotState =
	| 'registering'
	| 'provisioning'
	| 'joining'
	| 'waiting_room'
	| 'joined'
	| 'recording'
	| 'recording_error'
	| 'leaving'
	| 'left'
	| 'error';

export type MeetingVendor = 'teams' | 'meet' | 'zoom';

export interface MeetingBot {
	id: string;
	created_at: string;
	ended_at?: string;
	updated_at: string;
	vendor: MeetingVendor;
	state: MeetingBotState;
	meeting_id?: string;
	meeting_code: string;
	meeting_url?: string;
	external_bot_id?: string;
	user_id: string;
	space_id?: string;
	credits_consumed?: number;
	duration_seconds?: number;
}

export interface MeetingRecording {
	id: string;
	created_at: string;
	updated_at: string;
	file_url?: string;
	video_url?: string;
	audio_url?: string;
	transcript?: string;
	duration_seconds?: number;
	bot_id: string;
	user_id: string;
	space_id?: string;
	audio_signed_url?: string | null;
	video_signed_url?: string | null;
}

export interface MeetingBotWithRecording extends MeetingBot {
	recording?: MeetingRecording;
}

export interface CreateBotResponse {
	id: string;
	external_bot_id: string;
	meeting_url: string;
	state: MeetingBotState;
	created_at: string;
}

export interface WebhookEvent {
	event: 'recording.completed' | 'recording.failed';
	timestamp: string;
	bot: {
		id: string;
		external_bot_id: string;
		user_id: string;
		space_id?: string;
		state: string;
		completed_at?: string;
		failed_at?: string;
	};
	recording?: {
		id: string;
		video_url?: string;
		audio_url?: string;
		file_url?: string;
		transcript?: string;
		speakers?: object;
		duration_seconds?: number;
		created_at: string;
	};
	error?: {
		code: string;
		message: string;
	};
}

const MEETING_BOT_API_URL = process.env.MEETING_BOT_API_URL ?? '';
const MEETING_BOT_API_KEY = process.env.MEETING_BOT_API_KEY ?? '';
const USER_UPLOADS_BUCKET = process.env.USER_UPLOADS_BUCKET ?? 'user-uploads';

export function detectPlatform(meetingUrl: string): MeetingVendor {
	if (/teams\.microsoft\.com/i.test(meetingUrl)) return 'teams';
	if (/meet\.google\.com/i.test(meetingUrl)) return 'meet';
	if (/zoom\.(us|com)/i.test(meetingUrl)) return 'zoom';
	throw new Error('Unsupported meeting platform. Use Teams, Meet, or Zoom.');
}

export function validateMeetingUrl(url: string): boolean {
	if (!url) return false;
	return /(teams\.microsoft\.com|meet\.google\.com|zoom\.(us|com))/i.test(url);
}

export async function createBot(
	userId: string,
	meetingUrl: string,
	webhookBaseUrl: string,
	spaceId?: string
): Promise<CreateBotResponse> {
	if (!MEETING_BOT_API_URL || !MEETING_BOT_API_KEY) {
		throw new Error('Meeting bot service not configured');
	}

	const response = await fetch(`${MEETING_BOT_API_URL}/bots`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': MEETING_BOT_API_KEY,
		},
		body: JSON.stringify({
			user_id: userId,
			space_id: spaceId,
			meeting_url: meetingUrl,
			completed_webhook_url: `${webhookBaseUrl}/meetings/webhooks/bot-events`,
			failed_webhook_url: `${webhookBaseUrl}/meetings/webhooks/bot-events`,
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({})) as Record<string, unknown>;
		throw new Error((err.message as string) || `Failed to create meeting bot: ${response.statusText}`);
	}

	return response.json();
}

export async function stopBot(botId: string, userId: string): Promise<void> {
	// Verify ownership first
	const bot = await getBotById(botId, userId);
	if (!bot) throw new Error('Bot not found');

	if (!MEETING_BOT_API_URL || !MEETING_BOT_API_KEY) {
		throw new Error('Meeting bot service not configured');
	}

	const response = await fetch(`${MEETING_BOT_API_URL}/bots/${botId}/stop`, {
		method: 'POST',
		headers: { 'x-api-key': MEETING_BOT_API_KEY },
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({})) as Record<string, unknown>;
		throw new Error((err.message as string) || `Failed to stop meeting bot: ${response.statusText}`);
	}
}

export async function getBots(
	userId: string,
	spaceId?: string,
	limit = 50,
	offset = 0
): Promise<MeetingBotWithRecording[]> {
	const supabase = createServiceClient();

	let query = supabase
		.from('meeting_bots')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (spaceId) query = query.eq('space_id', spaceId);

	const { data: bots, error } = await query;
	if (error) throw new Error('Failed to fetch bots');

	return Promise.all(
		(bots ?? []).map(async (bot: MeetingBot) => {
			const { data: recordings } = await supabase
				.from('meeting_recordings')
				.select('*')
				.eq('bot_id', bot.id)
				.limit(1);
			return { ...bot, recording: recordings?.[0] ?? undefined };
		})
	);
}

export async function getBotById(
	botId: string,
	userId: string
): Promise<MeetingBotWithRecording | null> {
	const supabase = createServiceClient();

	const { data: bot, error } = await supabase
		.from('meeting_bots')
		.select('*')
		.eq('id', botId)
		.eq('user_id', userId)
		.single();

	if (error || !bot) return null;

	const { data: recordings } = await supabase
		.from('meeting_recordings')
		.select('*')
		.eq('bot_id', botId)
		.limit(1);

	return { ...bot, recording: recordings?.[0] ?? undefined };
}

async function generateSignedUrl(storagePath: string): Promise<string | null> {
	if (!storagePath) return null;
	const supabase = createServiceClient();
	const { data, error } = await supabase.storage
		.from(USER_UPLOADS_BUCKET)
		.createSignedUrl(storagePath, 3600);
	if (error) return null;
	return data?.signedUrl ?? null;
}

async function addSignedUrls(recording: MeetingRecording): Promise<MeetingRecording> {
	const [audioSignedUrl, videoSignedUrl] = await Promise.all([
		recording.audio_url ? generateSignedUrl(recording.audio_url) : null,
		recording.video_url ? generateSignedUrl(recording.video_url) : null,
	]);
	return { ...recording, audio_signed_url: audioSignedUrl, video_signed_url: videoSignedUrl };
}

export async function getRecordings(
	userId: string,
	spaceId?: string,
	limit = 50,
	offset = 0
): Promise<MeetingRecording[]> {
	const supabase = createServiceClient();

	let query = supabase
		.from('meeting_recordings')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (spaceId) query = query.eq('space_id', spaceId);

	const { data: recordings, error } = await query;
	if (error) throw new Error('Failed to fetch recordings');

	return Promise.all((recordings ?? []).map(addSignedUrls));
}

export async function getRecordingById(
	recordingId: string,
	userId: string
): Promise<MeetingRecording | null> {
	const supabase = createServiceClient();

	const { data: recording, error } = await supabase
		.from('meeting_recordings')
		.select('*')
		.eq('id', recordingId)
		.eq('user_id', userId)
		.single();

	if (error || !recording) return null;
	return addSignedUrls(recording);
}

export async function updateBotCredits(
	botId: string,
	creditsConsumed: number,
	durationSeconds?: number
): Promise<void> {
	const supabase = createServiceClient();
	const update: Record<string, unknown> = {
		credits_consumed: creditsConsumed,
		updated_at: new Date().toISOString(),
	};
	if (durationSeconds !== undefined) update.duration_seconds = durationSeconds;

	const { error } = await supabase.from('meeting_bots').update(update).eq('id', botId);
	if (error) throw new Error('Failed to update bot credits');
}
