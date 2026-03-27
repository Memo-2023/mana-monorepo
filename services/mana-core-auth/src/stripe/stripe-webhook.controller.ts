import {
	Controller,
	Post,
	Req,
	Headers,
	HttpCode,
	BadRequestException,
	Logger,
	Inject,
	forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

interface RawBodyRequest extends Request {
	rawBody?: Buffer;
}

/**
 * Stripe Webhook Controller — Subscription events only.
 *
 * Credit-related events (payment_intent.*, checkout.session.*) are handled
 * by the standalone mana-credits service.
 */
@ApiTags('webhooks')
@Controller('webhooks/stripe')
export class StripeWebhookController {
	private readonly logger = new Logger(StripeWebhookController.name);

	constructor(
		private stripeService: StripeService,
		@Inject(forwardRef(() => SubscriptionsService))
		private subscriptionsService: SubscriptionsService
	) {}

	@Post()
	@HttpCode(200)
	@ApiExcludeEndpoint()
	async handleWebhook(@Req() req: RawBodyRequest, @Headers('stripe-signature') signature: string) {
		const rawBody = req.rawBody;
		if (!rawBody) throw new BadRequestException('Missing raw body');
		if (!signature) throw new BadRequestException('Missing stripe-signature header');

		let event: Stripe.Event;
		try {
			event = this.stripeService.verifyWebhookSignature(rawBody, signature);
		} catch (err) {
			this.logger.warn('Webhook signature verification failed', {
				error: err instanceof Error ? err.message : 'Unknown error',
			});
			throw new BadRequestException('Invalid webhook signature');
		}

		this.logger.log('Webhook received', { type: event.type, id: event.id });

		switch (event.type) {
			// Subscriptions
			case 'customer.subscription.created':
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted':
				await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
				break;

			// Invoices
			case 'invoice.created':
			case 'invoice.updated':
			case 'invoice.paid':
			case 'invoice.payment_failed':
				await this.handleInvoiceUpdated(event.data.object as Stripe.Invoice);
				break;

			default:
				this.logger.debug(`Unhandled event type: ${event.type}`);
		}

		return { received: true };
	}

	private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
		this.logger.log('Processing subscription update', {
			subscriptionId: subscription.id,
			status: subscription.status,
		});

		try {
			await this.subscriptionsService.handleSubscriptionUpdated(subscription);
		} catch (error) {
			this.logger.error('Failed to process subscription update', {
				subscriptionId: subscription.id,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	private async handleInvoiceUpdated(invoice: Stripe.Invoice) {
		this.logger.log('Processing invoice update', {
			invoiceId: invoice.id,
			status: invoice.status,
		});

		try {
			await this.subscriptionsService.handleInvoiceUpdated(invoice);
		} catch (error) {
			this.logger.error('Failed to process invoice update', {
				invoiceId: invoice.id,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
