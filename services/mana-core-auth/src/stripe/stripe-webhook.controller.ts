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
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { CreditsService } from '../credits/credits.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

interface RawBodyRequest extends Request {
	rawBody?: Buffer;
}

@ApiTags('webhooks')
@Controller('webhooks/stripe')
export class StripeWebhookController {
	private readonly logger = new Logger(StripeWebhookController.name);

	constructor(
		private stripeService: StripeService,
		@Inject(forwardRef(() => CreditsService))
		private creditsService: CreditsService,
		@Inject(forwardRef(() => SubscriptionsService))
		private subscriptionsService: SubscriptionsService
	) {}

	@Post()
	@HttpCode(200)
	@ApiExcludeEndpoint() // Hide from Swagger - internal webhook
	@ApiOperation({ summary: 'Handle Stripe webhooks' })
	@ApiResponse({ status: 200, description: 'Webhook processed' })
	@ApiResponse({ status: 400, description: 'Invalid webhook signature' })
	async handleWebhook(@Req() req: RawBodyRequest, @Headers('stripe-signature') signature: string) {
		const rawBody = req.rawBody;

		if (!rawBody) {
			this.logger.warn('Webhook received without raw body');
			throw new BadRequestException('Missing raw body');
		}

		if (!signature) {
			this.logger.warn('Webhook received without signature');
			throw new BadRequestException('Missing stripe-signature header');
		}

		// Verify signature and parse event
		let event: Stripe.Event;
		try {
			event = this.stripeService.verifyWebhookSignature(rawBody, signature);
		} catch (err) {
			this.logger.warn('Webhook signature verification failed', {
				error: err instanceof Error ? err.message : 'Unknown error',
			});
			throw new BadRequestException('Invalid webhook signature');
		}

		this.logger.log('Webhook received', {
			type: event.type,
			id: event.id,
		});

		// Handle relevant events
		switch (event.type) {
			// Credit purchases
			case 'payment_intent.succeeded':
				await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
				break;

			case 'payment_intent.payment_failed':
				await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
				break;

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

	private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
		this.logger.log('Processing payment success', {
			paymentIntentId: paymentIntent.id,
			amount: paymentIntent.amount,
			customer: paymentIntent.customer,
		});

		try {
			const result = await this.creditsService.completePurchase(paymentIntent.id);

			if (result.alreadyProcessed) {
				this.logger.log('Purchase already processed (idempotent)', {
					paymentIntentId: paymentIntent.id,
				});
			} else {
				this.logger.log('Purchase completed successfully', {
					paymentIntentId: paymentIntent.id,
					creditsAdded: result.creditsAdded,
				});
			}
		} catch (error) {
			this.logger.error('Failed to complete purchase', {
				paymentIntentId: paymentIntent.id,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			// Rethrow to return 500 to Stripe for retry
			throw error;
		}
	}

	private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
		const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

		this.logger.log('Processing payment failure', {
			paymentIntentId: paymentIntent.id,
			failureMessage,
		});

		try {
			await this.creditsService.failPurchase(paymentIntent.id, failureMessage);
		} catch (error) {
			this.logger.error('Failed to mark purchase as failed', {
				paymentIntentId: paymentIntent.id,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
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
