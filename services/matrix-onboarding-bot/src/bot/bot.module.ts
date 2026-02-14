import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { SessionModule, I18nModule } from '@manacore/bot-services';

@Module({
	imports: [
		OnboardingModule,
		SessionModule.forRoot({ storageMode: 'redis' }),
		I18nModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
