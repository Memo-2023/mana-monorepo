import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
	MeetingBot,
	MeetingRecording,
	MeetingBotWithRecording,
	CreateBotRequest,
	CreateBotResponse,
	MeetingVendor,
} from './interfaces/meeting.interfaces';

@Injectable()
export class MeetingsProxyService {
	private readonly logger = new Logger(MeetingsProxyService.name);
	private readonly meetingBotApiUrl: string;
	private readonly meetingBotApiKey: string;
	private readonly memoroServiceUrl: string;
	private readonly supabaseClient: SupabaseClient;

	constructor(private configService: ConfigService) {
		this.meetingBotApiUrl = this.configService.get<string>('MEETING_BOT_API_URL') || '';
		this.meetingBotApiKey = this.configService.get<string>('MEETING_BOT_API_KEY') || '';
		this.memoroServiceUrl =
			this.configService.get<string>('MEMORO_SERVICE_URL') || 'http://localhost:3001';

		// Initialize Supabase client for direct database access
		const supabaseUrl = this.configService.get<string>('MEMORO_SUPABASE_URL');
		const supabaseServiceKey = this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY');

		if (supabaseUrl && supabaseServiceKey) {
			this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
		}

		if (!this.meetingBotApiUrl) {
			this.logger.warn('MEETING_BOT_API_URL not configured - meeting bot proxy disabled');
		}
	}

	/**
	 * Detect meeting platform from URL
	 */
	detectPlatform(meetingUrl: string): MeetingVendor {
		if (/teams\.microsoft\.com/i.test(meetingUrl)) return 'teams';
		if (/meet\.google\.com/i.test(meetingUrl)) return 'meet';
		if (/zoom\.(us|com)/i.test(meetingUrl)) return 'zoom';
		throw new BadRequestException('Unsupported meeting platform. Use Teams, Meet, or Zoom.');
	}

	/**
	 * Create a new meeting bot via meeting-bot service
	 */
	async createBot(
		userId: string,
		meetingUrl: string,
		spaceId?: string
	): Promise<CreateBotResponse> {
		this.logger.log(`[createBot] Creating bot for user ${userId}, meeting: ${meetingUrl}`);

		if (!this.meetingBotApiUrl || !this.meetingBotApiKey) {
			throw new BadRequestException('Meeting bot service not configured');
		}

		const platform = this.detectPlatform(meetingUrl);
		this.logger.log(`[createBot] Detected platform: ${platform}`);

		const webhookBaseUrl = this.memoroServiceUrl.replace(/\/$/, '');

		const requestBody: CreateBotRequest = {
			user_id: userId,
			space_id: spaceId,
			meeting_url: meetingUrl,
			completed_webhook_url: `${webhookBaseUrl}/meetings/webhooks/bot-events`,
			failed_webhook_url: `${webhookBaseUrl}/meetings/webhooks/bot-events`,
		};

		try {
			const response = await fetch(`${this.meetingBotApiUrl}/bots`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.meetingBotApiKey,
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				this.logger.error(`[createBot] Meeting bot service error: ${response.status}`, errorData);
				throw new BadRequestException(
					errorData.message || `Failed to create meeting bot: ${response.statusText}`
				);
			}

			const result = await response.json();
			this.logger.log(`[createBot] Bot created successfully: ${result.id}`);

			return result;
		} catch (error) {
			if (error instanceof BadRequestException) throw error;
			this.logger.error(`[createBot] Error creating bot:`, error);
			throw new BadRequestException('Failed to connect to meeting bot service');
		}
	}

	/**
	 * Stop a meeting bot
	 */
	async stopBot(botId: string, userId: string): Promise<{ success: boolean }> {
		this.logger.log(`[stopBot] Stopping bot ${botId} for user ${userId}`);

		// First verify the bot belongs to this user
		const bot = await this.getBotById(botId, userId);
		if (!bot) {
			throw new NotFoundException('Bot not found');
		}

		if (!this.meetingBotApiUrl || !this.meetingBotApiKey) {
			throw new BadRequestException('Meeting bot service not configured');
		}

		try {
			const response = await fetch(`${this.meetingBotApiUrl}/bots/${botId}/stop`, {
				method: 'POST',
				headers: {
					'x-api-key': this.meetingBotApiKey,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				this.logger.error(`[stopBot] Meeting bot service error: ${response.status}`, errorData);
				throw new BadRequestException(
					errorData.message || `Failed to stop meeting bot: ${response.statusText}`
				);
			}

			this.logger.log(`[stopBot] Bot ${botId} stopped successfully`);
			return { success: true };
		} catch (error) {
			if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
			this.logger.error(`[stopBot] Error stopping bot:`, error);
			throw new BadRequestException('Failed to stop meeting bot');
		}
	}

	/**
	 * Get bots for a user directly from database
	 */
	async getBots(
		userId: string,
		spaceId?: string,
		limit = 50,
		offset = 0
	): Promise<MeetingBotWithRecording[]> {
		this.logger.log(`[getBots] Getting bots for user ${userId}`);

		if (!this.supabaseClient) {
			throw new BadRequestException('Database not configured');
		}

		let query = this.supabaseClient
			.from('meeting_bots')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (spaceId) {
			query = query.eq('space_id', spaceId);
		}

		const { data: bots, error } = await query;

		if (error) {
			this.logger.error(`[getBots] Database error:`, error);
			throw new BadRequestException('Failed to fetch bots');
		}

		// Fetch recordings for each bot
		const botsWithRecordings: MeetingBotWithRecording[] = await Promise.all(
			(bots || []).map(async (bot: MeetingBot) => {
				const { data: recordings } = await this.supabaseClient
					.from('meeting_recordings')
					.select('*')
					.eq('bot_id', bot.id)
					.limit(1);

				return {
					...bot,
					recording: recordings?.[0] || undefined,
				};
			})
		);

		return botsWithRecordings;
	}

	/**
	 * Get a specific bot by ID
	 */
	async getBotById(botId: string, userId: string): Promise<MeetingBotWithRecording | null> {
		this.logger.log(`[getBotById] Getting bot ${botId} for user ${userId}`);

		if (!this.supabaseClient) {
			throw new BadRequestException('Database not configured');
		}

		const { data: bot, error } = await this.supabaseClient
			.from('meeting_bots')
			.select('*')
			.eq('id', botId)
			.eq('user_id', userId)
			.single();

		if (error || !bot) {
			return null;
		}

		// Fetch recording
		const { data: recordings } = await this.supabaseClient
			.from('meeting_recordings')
			.select('*')
			.eq('bot_id', botId)
			.limit(1);

		return {
			...bot,
			recording: recordings?.[0] || undefined,
		};
	}

	/**
	 * Generate signed URL for a storage path
	 */
	private async generateSignedUrl(storagePath: string): Promise<string | null> {
		if (!storagePath || !this.supabaseClient) return null;

		try {
			const bucket = this.configService.get<string>('USER_UPLOADS_BUCKET') || 'user-uploads';
			const { data, error } = await this.supabaseClient.storage
				.from(bucket)
				.createSignedUrl(storagePath, 3600); // 1 hour expiry

			if (error) {
				this.logger.error(`[generateSignedUrl] Error creating signed URL:`, error);
				return null;
			}

			return data?.signedUrl || null;
		} catch (error) {
			this.logger.error(`[generateSignedUrl] Error:`, error);
			return null;
		}
	}

	/**
	 * Add signed URLs to a recording
	 */
	private async addSignedUrls(recording: MeetingRecording): Promise<MeetingRecording> {
		const [audioSignedUrl, videoSignedUrl] = await Promise.all([
			recording.audio_url ? this.generateSignedUrl(recording.audio_url) : null,
			recording.video_url ? this.generateSignedUrl(recording.video_url) : null,
		]);

		return {
			...recording,
			audio_signed_url: audioSignedUrl,
			video_signed_url: videoSignedUrl,
		};
	}

	/**
	 * Get recordings for a user
	 */
	async getRecordings(
		userId: string,
		spaceId?: string,
		limit = 50,
		offset = 0
	): Promise<MeetingRecording[]> {
		this.logger.log(`[getRecordings] Getting recordings for user ${userId}`);

		if (!this.supabaseClient) {
			throw new BadRequestException('Database not configured');
		}

		let query = this.supabaseClient
			.from('meeting_recordings')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (spaceId) {
			query = query.eq('space_id', spaceId);
		}

		const { data: recordings, error } = await query;

		if (error) {
			this.logger.error(`[getRecordings] Database error:`, error);
			throw new BadRequestException('Failed to fetch recordings');
		}

		// Add signed URLs to each recording
		const recordingsWithUrls = await Promise.all(
			(recordings || []).map((recording) => this.addSignedUrls(recording))
		);

		return recordingsWithUrls;
	}

	/**
	 * Get a specific recording by ID
	 */
	async getRecordingById(recordingId: string, userId: string): Promise<MeetingRecording | null> {
		this.logger.log(`[getRecordingById] Getting recording ${recordingId} for user ${userId}`);

		if (!this.supabaseClient) {
			throw new BadRequestException('Database not configured');
		}

		const { data: recording, error } = await this.supabaseClient
			.from('meeting_recordings')
			.select('*')
			.eq('id', recordingId)
			.eq('user_id', userId)
			.single();

		if (error || !recording) {
			return null;
		}

		// Add signed URLs
		return this.addSignedUrls(recording);
	}

	/**
	 * Update bot with credits consumed
	 */
	async updateBotCredits(
		botId: string,
		creditsConsumed: number,
		durationSeconds?: number
	): Promise<void> {
		this.logger.log(`[updateBotCredits] Updating bot ${botId} with ${creditsConsumed} credits`);

		if (!this.supabaseClient) {
			throw new BadRequestException('Database not configured');
		}

		const updateData: Partial<MeetingBot> = {
			credits_consumed: creditsConsumed,
			updated_at: new Date().toISOString(),
		};

		if (durationSeconds !== undefined) {
			updateData.duration_seconds = durationSeconds;
		}

		const { error } = await this.supabaseClient
			.from('meeting_bots')
			.update(updateData)
			.eq('id', botId);

		if (error) {
			this.logger.error(`[updateBotCredits] Failed to update bot:`, error);
			throw new BadRequestException('Failed to update bot credits');
		}
	}
}
