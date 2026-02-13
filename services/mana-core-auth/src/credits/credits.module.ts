import { Module, forwardRef } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { StripeModule } from '../stripe/stripe.module';

@Module({
	imports: [forwardRef(() => StripeModule)],
	controllers: [CreditsController],
	providers: [CreditsService],
	exports: [CreditsService],
})
export class CreditsModule {}
