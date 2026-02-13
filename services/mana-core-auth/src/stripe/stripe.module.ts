import { Module, forwardRef } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { CreditsModule } from '../credits/credits.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
	imports: [forwardRef(() => CreditsModule), forwardRef(() => SubscriptionsModule)],
	controllers: [StripeWebhookController],
	providers: [StripeService],
	exports: [StripeService],
})
export class StripeModule {}
