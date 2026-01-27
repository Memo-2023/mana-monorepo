import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { ProjectModule } from '../project/project.module';
import { MediaModule } from '../media/media.module';
import { GenerationModule } from '../generation/generation.module';

@Module({
	imports: [ProjectModule, MediaModule, GenerationModule],
	providers: [BotUpdate],
})
export class BotModule {}
