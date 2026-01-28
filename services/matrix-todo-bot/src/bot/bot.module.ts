import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { TodoModule } from '../todo/todo.module';

@Module({
	imports: [TodoModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
