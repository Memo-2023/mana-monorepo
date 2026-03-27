import { Module, forwardRef } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { GuildCreditController } from './guild.controller';
import { CreditsService } from './credits.service';
import { GuildPoolService } from './guild-pool.service';
import { StripeModule } from '../stripe/stripe.module';

@Module({
	imports: [forwardRef(() => StripeModule)],
	controllers: [CreditsController, GuildCreditController],
	providers: [CreditsService, GuildPoolService],
	exports: [CreditsService, GuildPoolService],
})
export class CreditsModule {}
