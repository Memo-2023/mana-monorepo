import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { TodoModule } from '../todo/todo.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
	imports: [TodoModule, TranscriptionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
