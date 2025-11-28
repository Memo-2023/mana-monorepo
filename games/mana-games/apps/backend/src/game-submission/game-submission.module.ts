import { Module } from '@nestjs/common';
import { GameSubmissionController } from './game-submission.controller';
import { GameSubmissionService } from './game-submission.service';

@Module({
  controllers: [GameSubmissionController],
  providers: [GameSubmissionService],
})
export class GameSubmissionModule {}
