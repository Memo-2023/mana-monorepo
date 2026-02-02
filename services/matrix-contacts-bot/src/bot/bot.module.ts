import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ContactsModule } from '../contacts/contacts.module';
import {
	SessionModule,
	TranscriptionModule,
	CreditModule,
	I18nModule,
} from '@manacore/bot-services';

@Module({
	imports: [
		ContactsModule,
		SessionModule.forRoot(),
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
		CreditModule.forRoot(),
		I18nModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
