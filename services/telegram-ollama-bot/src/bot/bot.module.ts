import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
	imports: [OllamaModule],
	providers: [BotUpdate],
})
export class BotModule {}
