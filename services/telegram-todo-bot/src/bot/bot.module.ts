import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { TodoClientModule } from '../todo-client/todo-client.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [TodoClientModule, UserModule],
	providers: [BotUpdate],
})
export class BotModule {}
