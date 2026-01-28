import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { ChatModule } from '../chat/chat.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [ChatModule, UserModule],
	providers: [BotUpdate],
})
export class BotModule {}
