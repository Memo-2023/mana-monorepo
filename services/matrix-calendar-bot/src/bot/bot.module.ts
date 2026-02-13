import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MatrixService } from './matrix.service';
import {
	TranscriptionModule,
	SessionModule,
	CreditModule,
	CalendarApiService,
	I18nModule,
} from '@manacore/bot-services';

// Factory provider for CalendarApiService
const calendarApiServiceProvider = {
	provide: CalendarApiService,
	useFactory: (configService: ConfigService) => {
		const baseUrl = configService.get<string>('CALENDAR_BACKEND_URL', 'http://localhost:3014');
		return new CalendarApiService(baseUrl);
	},
	inject: [ConfigService],
};

@Module({
	imports: [
		ConfigModule,
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
		SessionModule.forRoot({ storageMode: 'redis' }),
		CreditModule.forRoot(),
		I18nModule.forRoot(),
	],
	providers: [MatrixService, calendarApiServiceProvider],
	exports: [MatrixService],
})
export class BotModule {}
