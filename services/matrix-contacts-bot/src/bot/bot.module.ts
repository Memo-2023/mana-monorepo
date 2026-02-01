import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ContactsModule } from '../contacts/contacts.module';
import { SessionModule, TranscriptionModule } from '@manacore/bot-services';

@Module({
	imports: [
		ContactsModule,
		SessionModule.forRoot(),
		TranscriptionModule.register({
			sttUrl: process.env.STT_URL || 'http://localhost:3020',
		}),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
