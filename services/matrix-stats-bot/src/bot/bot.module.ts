import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { UsersModule } from '../users/users.module';
import { TranscriptionModule } from '@manacore/bot-services';

@Module({
	imports: [
		AnalyticsModule,
		UsersModule,
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
