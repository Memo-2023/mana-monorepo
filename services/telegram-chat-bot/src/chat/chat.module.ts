import { Module } from '@nestjs/common';
import { ChatClient } from './chat.client';

@Module({
	providers: [ChatClient],
	exports: [ChatClient],
})
export class ChatModule {}
