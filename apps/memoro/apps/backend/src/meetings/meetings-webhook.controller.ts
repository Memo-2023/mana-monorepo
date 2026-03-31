import {
	Controller,
	Post,
	Body,
	Headers,
	Logger,
	BadRequestException,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { MeetingsProxyService } from './meetings-proxy.service';
import { CreditConsumptionService } from '../credits/credit-consumption.service';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { OPERATION_COSTS } from '../credits/pricing.constants';

@Controller('meetings/webhooks')
export class MeetingsWebhookController {
	private readonly logger = new Logger(MeetingsWebhookController.name);
	private readonly webhookSecret: string;
	private readonly processedEvents: Set<string> = new Set();

	constructor(
		private readonly configService: ConfigService,
		private readonly meetingsProxyService: MeetingsProxyService,
		private readonly creditConsumptionService: CreditConsumptionService
	) {
		this.webhookSecret = this.configService.get<string>('MEETING_BOT_WEBHOOK_SECRET') || '';

		if (!this.webhookSecret) {
			this.logger.warn(
				'MEETING_BOT_WEBHOOK_SECRET not configured - webhook signature verification disabled'
			);
		}
	}

	/**
	 * Verify HMAC signature from meeting-bot service
	 */
	private verifySignature(payload: string, signature: string): boolean {
		if (!this.webhookSecret) {
			this.logger.warn('[verifySignature] No webhook secret configured, skipping verification');
			return true;
		}

		if (!signature) {
			this.logger.error('[verifySignature] No signature provided');
			return false;
		}

		try {
			// Signature format: sha256=<hex>
			const [algorithm, providedSignature] = signature.split('=');

			if (algorithm !== 'sha256' || !providedSignature) {
				this.logger.error('[verifySignature] Invalid signature format');
				return false;
			}

			const expectedSignature = createHmac('sha256', this.webhookSecret)
				.update(payload)
				.digest('hex');

			const providedBuffer = Buffer.from(providedSignature, 'hex');
			const expectedBuffer = Buffer.from(expectedSignature, 'hex');

			if (providedBuffer.length !== expectedBuffer.length) {
				return false;
			}

			return timingSafeEqual(providedBuffer, expectedBuffer);
		} catch (error) {
			this.logger.error('[verifySignature] Error verifying signature:', error);
			return false;
		}
	}

	/**
	 * Generate idempotency key from event
	 */
	private getIdempotencyKey(event: WebhookEventDto): string {
		return `${event.bot.id}:${event.event}:${event.timestamp}`;
	}

	/**
	 * Calculate credits from duration
	 */
	private calculateCredits(durationSeconds: number): number {
		const minutes = durationSeconds / 60;
		const cost = Math.ceil(minutes * OPERATION_COSTS.TRANSCRIPTION_PER_MINUTE);
		return Math.max(cost, 2); // Minimum 2 credits
	}

	/**
	 * Handle webhook events from meeting-bot service
	 * POST /meetings/webhooks/bot-events
	 */
	@Post('bot-events')
	async handleBotEvent(
		@Body() payload: WebhookEventDto,
		@Headers('x-webhook-signature') signature: string
	) {
		this.logger.log(`[handleBotEvent] Received event: ${payload.event} for bot ${payload.bot.id}`);

		// Verify signature if secret is configured
		if (this.webhookSecret) {
			const payloadString = JSON.stringify(payload);
			if (!this.verifySignature(payloadString, signature)) {
				this.logger.error('[handleBotEvent] Invalid webhook signature');
				throw new UnauthorizedException('Invalid webhook signature');
			}
		}

		// Check for duplicate event (idempotency)
		const idempotencyKey = this.getIdempotencyKey(payload);
		if (this.processedEvents.has(idempotencyKey)) {
			this.logger.log(`[handleBotEvent] Duplicate event ignored: ${idempotencyKey}`);
			return { success: true, message: 'Event already processed' };
		}

		// Mark as processed (in memory - for production use a database)
		this.processedEvents.add(idempotencyKey);

		// Clean up old events (keep last 1000)
		if (this.processedEvents.size > 1000) {
			const iterator = this.processedEvents.values();
			for (let i = 0; i < 500; i++) {
				this.processedEvents.delete(iterator.next().value);
			}
		}

		try {
			if (payload.event === 'recording.completed') {
				return await this.handleRecordingCompleted(payload);
			} else if (payload.event === 'recording.failed') {
				return await this.handleRecordingFailed(payload);
			}

			this.logger.warn(`[handleBotEvent] Unknown event type: ${payload.event}`);
			return { success: true, message: 'Unknown event type' };
		} catch (error) {
			this.logger.error(`[handleBotEvent] Error processing event:`, error);
			// Remove from processed set so it can be retried
			this.processedEvents.delete(idempotencyKey);
			throw new BadRequestException('Failed to process webhook event');
		}
	}

	/**
	 * Handle recording completed event
	 */
	private async handleRecordingCompleted(payload: WebhookEventDto) {
		this.logger.log(
			`[handleRecordingCompleted] Processing completed recording for bot ${payload.bot.id}`
		);

		const { bot, recording } = payload;
		const durationSeconds = recording?.duration_seconds || 0;
		const creditsToConsume = this.calculateCredits(durationSeconds);

		this.logger.log(
			`[handleRecordingCompleted] Duration: ${durationSeconds}s, Credits: ${creditsToConsume}`
		);

		// Consume credits
		try {
			const creditResult = await this.creditConsumptionService.consumeCreditsForOperation(
				bot.user_id,
				'meeting_recording' as any,
				creditsToConsume,
				`Meeting recording completed - ${Math.round(durationSeconds / 60)} minutes`,
				{
					botId: bot.id,
					recordingId: recording?.id,
					durationSeconds,
					durationMinutes: Math.round(durationSeconds / 60),
				},
				bot.space_id
			);

			this.logger.log(`[handleRecordingCompleted] Credits consumed:`, creditResult);

			// Update bot with credits consumed
			await this.meetingsProxyService.updateBotCredits(bot.id, creditsToConsume, durationSeconds);
		} catch (error) {
			this.logger.error(`[handleRecordingCompleted] Failed to consume credits:`, error);
			// Don't fail the webhook - recording is still valid
			// Credits can be reconciled manually if needed
		}

		return {
			success: true,
			message: 'Recording completed processed',
			botId: bot.id,
			recordingId: recording?.id,
			creditsConsumed: creditsToConsume,
		};
	}

	/**
	 * Handle recording failed event
	 */
	private async handleRecordingFailed(payload: WebhookEventDto) {
		this.logger.log(
			`[handleRecordingFailed] Processing failed recording for bot ${payload.bot.id}`
		);

		const { bot, error } = payload;

		this.logger.error(
			`[handleRecordingFailed] Bot ${bot.id} failed: ${error?.code} - ${error?.message}`
		);

		// No credits consumed on failure
		// Update bot state if needed (should already be updated by meeting-bot)

		return {
			success: true,
			message: 'Recording failure processed',
			botId: bot.id,
			error: error?.message,
		};
	}
}
