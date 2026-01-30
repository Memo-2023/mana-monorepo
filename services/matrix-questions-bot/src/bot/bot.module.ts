import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { QuestionsModule } from '../questions/questions.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [QuestionsModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
