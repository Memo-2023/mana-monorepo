import { Module } from '@nestjs/common';
import { TodoClientService } from './todo-client.service';

@Module({
	providers: [TodoClientService],
	exports: [TodoClientService],
})
export class TodoClientModule {}
