import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { QuestionsModule } from '../questions/questions.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [QuestionsModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
