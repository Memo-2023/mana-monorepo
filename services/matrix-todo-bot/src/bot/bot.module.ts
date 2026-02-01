import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { TodoModule } from '../todo/todo.module';
import { TranscriptionModule, SessionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [
		TodoModule,
		TranscriptionModule.forRoot(),
		SessionModule.forRoot(),
		CreditModule.forRoot(),
	],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
