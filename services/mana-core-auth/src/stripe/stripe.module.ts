import { Module, forwardRef } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
	imports: [forwardRef(() => SubscriptionsModule)],
	controllers: [StripeWebhookController],
	providers: [StripeService],
	exports: [StripeService],
})
export class StripeModule {}
