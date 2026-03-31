import {
	Controller,
	Post,
	Get,
	Param,
	Body,
	Query,
	Req,
	UseGuards,
	Logger,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../decorators/user.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';
import { MeetingsProxyService } from './meetings-proxy.service';
import { CreditConsumptionService } from '../credits/credit-consumption.service';
import { CreateBotDto, ListBotsQueryDto, ListRecordingsQueryDto } from './dto/create-bot.dto';
import { OPERATION_COSTS } from '../credits/pricing.constants';

// Minimum credits required to start a recording (5 minutes worth)
const MINIMUM_RECORDING_CREDITS = 10;

@Controller('meetings')
@UseGuards(AuthGuard)
export class MeetingsController {
	private readonly logger = new Logger(MeetingsController.name);

	constructor(
		private readonly meetingsProxyService: MeetingsProxyService,
		private readonly creditConsumptionService: CreditConsumptionService
	) {}

	/**
	 * Validate meeting URL format
	 */
	private validateMeetingUrl(url: string): boolean {
		if (!url) return false;
		// Check for supported platforms
		return /(teams\.microsoft\.com|meet\.google\.com|zoom\.(us|com))/i.test(url);
	}

	/**
	 * Create a new meeting bot to record a meeting
	 * POST /meetings/bots
	 */
	@Post('bots')
	async createBot(@User() user: JwtPayload & { token: string }, @Body() dto: CreateBotDto) {
		this.logger.log(`[createBot] User ${user.sub} creating bot for: ${dto.meeting_url}`);

		// Validate meeting URL
		if (!dto.meeting_url || !this.validateMeetingUrl(dto.meeting_url)) {
			throw new BadRequestException(
				'Please provide a valid Teams, Google Meet, or Zoom meeting URL'
			);
		}

		// Validate user has minimum credits
		const creditCheck = await this.creditConsumptionService.validateCreditsForOperation(
			user.sub,
			'meeting_recording' as any,
			MINIMUM_RECORDING_CREDITS,
			dto.space_id
		);

		if (!creditCheck.hasEnoughCredits) {
			throw new BadRequestException({
				error: 'InsufficientCredits',
				message: `Not enough credits to start recording. Need at least ${MINIMUM_RECORDING_CREDITS} credits.`,
				details: {
					requiredCredits: MINIMUM_RECORDING_CREDITS,
					availableCredits: creditCheck.availableCredits,
				},
			});
		}

		// Create the bot via meeting-bot service
		const bot = await this.meetingsProxyService.createBot(user.sub, dto.meeting_url, dto.space_id);

		return {
			success: true,
			bot,
			message: 'Meeting bot created. It will join the meeting shortly.',
			creditInfo: {
				estimatedCostPerMinute: OPERATION_COSTS.TRANSCRIPTION_PER_MINUTE,
				minimumCredits: MINIMUM_RECORDING_CREDITS,
				availableCredits: creditCheck.availableCredits,
			},
		};
	}

	/**
	 * List user's meeting bots
	 * GET /meetings/bots
	 */
	@Get('bots')
	async listBots(@User() user: JwtPayload & { token: string }, @Query() query: ListBotsQueryDto) {
		this.logger.log(`[listBots] User ${user.sub} listing bots`);

		const bots = await this.meetingsProxyService.getBots(
			user.sub,
			query.space_id,
			query.limit || 50,
			query.offset || 0
		);

		return {
			success: true,
			bots,
			total: bots.length,
		};
	}

	/**
	 * Get a specific bot by ID
	 * GET /meetings/bots/:id
	 */
	@Get('bots/:id')
	async getBot(@User() user: JwtPayload & { token: string }, @Param('id') botId: string) {
		this.logger.log(`[getBot] User ${user.sub} getting bot ${botId}`);

		const bot = await this.meetingsProxyService.getBotById(botId, user.sub);

		if (!bot) {
			throw new NotFoundException('Bot not found');
		}

		return {
			success: true,
			bot,
		};
	}

	/**
	 * Stop a meeting bot
	 * POST /meetings/bots/:id/stop
	 */
	@Post('bots/:id/stop')
	async stopBot(@User() user: JwtPayload & { token: string }, @Param('id') botId: string) {
		this.logger.log(`[stopBot] User ${user.sub} stopping bot ${botId}`);

		const result = await this.meetingsProxyService.stopBot(botId, user.sub);

		return {
			success: result.success,
			message: 'Bot stop signal sent. Recording will end shortly.',
		};
	}

	/**
	 * List user's recordings
	 * GET /meetings/recordings
	 */
	@Get('recordings')
	async listRecordings(
		@User() user: JwtPayload & { token: string },
		@Query() query: ListRecordingsQueryDto
	) {
		this.logger.log(`[listRecordings] User ${user.sub} listing recordings`);

		const recordings = await this.meetingsProxyService.getRecordings(
			user.sub,
			query.space_id,
			query.limit || 50,
			query.offset || 0
		);

		return {
			success: true,
			recordings,
			total: recordings.length,
		};
	}

	/**
	 * Get a specific recording by ID
	 * GET /meetings/recordings/:id
	 */
	@Get('recordings/:id')
	async getRecording(
		@User() user: JwtPayload & { token: string },
		@Param('id') recordingId: string
	) {
		this.logger.log(`[getRecording] User ${user.sub} getting recording ${recordingId}`);

		const recording = await this.meetingsProxyService.getRecordingById(recordingId, user.sub);

		if (!recording) {
			throw new NotFoundException('Recording not found');
		}

		return {
			success: true,
			recording,
		};
	}

	/**
	 * Convert a meeting recording to a memo
	 * POST /meetings/recordings/:id/to-memo
	 *
	 * This endpoint triggers the full transcription/processing pipeline
	 * by calling the internal /memoro/process-uploaded-audio endpoint.
	 */
	@Post('recordings/:id/to-memo')
	async convertToMemo(
		@User() user: JwtPayload & { token: string },
		@Param('id') recordingId: string,
		@Body() body: { blueprintId?: string },
		@Req() req
	) {
		const token = req.token;
		this.logger.log(`[convertToMemo] User ${user.sub} converting recording ${recordingId} to memo`);

		// Get the recording
		const recording = await this.meetingsProxyService.getRecordingById(recordingId, user.sub);

		if (!recording) {
			throw new NotFoundException('Recording not found');
		}

		// Use audio_url if available, otherwise fall back to video_url
		const filePath = recording.audio_url || recording.video_url;

		if (!filePath) {
			throw new BadRequestException('Recording has no audio or video file');
		}

		// Get duration from recording or default to a reasonable estimate
		const duration = recording.duration_seconds || 45;

		try {
			// Call the internal process-uploaded-audio endpoint
			// This handles everything: credit check, memo creation, transcription
			const port = process.env.PORT || 3001;
			const response = await fetch(`http://localhost:${port}/memoro/process-uploaded-audio`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					filePath: filePath,
					duration: duration,
					spaceId: recording.space_id,
					blueprintId: body.blueprintId,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
				this.logger.error(`[convertToMemo] Failed to process audio:`, errorData);
				throw new BadRequestException(errorData.message || 'Failed to process recording');
			}

			const result = await response.json();

			this.logger.log(
				`[convertToMemo] Created memo ${result.memoId} from recording ${recordingId}`
			);

			return {
				success: true,
				memoId: result.memoId,
				memo: result.memo,
				audioPath: filePath,
				status: result.status,
				message: 'Recording converted to memo. Transcription in progress.',
			};
		} catch (error) {
			this.logger.error(`[convertToMemo] Error converting recording to memo:`, error);
			throw new BadRequestException(error.message || 'Failed to convert recording to memo');
		}
	}
}
