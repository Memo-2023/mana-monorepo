import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { UsersModule } from '../users/users.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { TranscriptionModule, SessionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [
		AnalyticsModule,
		UsersModule,
		InfrastructureModule,
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
		SessionModule.forRoot({ storageMode: 'redis' }),
		CreditModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
