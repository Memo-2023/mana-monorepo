import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { TodoModule } from '../todo/todo.module';
import { TranscriptionModule } from '@manacore/bot-services';

@Module({
	imports: [TodoModule, TranscriptionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
