import { Module } from '@nestjs/common';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { DatabaseModule } from '../db/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [AnswerController],
	providers: [AnswerService],
	exports: [AnswerService],
})
export class AnswerModule {}
