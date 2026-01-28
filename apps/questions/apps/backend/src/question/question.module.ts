import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { DatabaseModule } from '../db/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [QuestionController],
	providers: [QuestionService],
	exports: [QuestionService],
})
export class QuestionModule {}
