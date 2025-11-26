import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { StoryCreationService } from './services/story-creation.service';
import { CoreModule } from '../core/core.module';
import { IllustrationService } from './illustration.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [CoreModule, SettingsModule],
  controllers: [StoryController],
  providers: [StoryService, IllustrationService, StoryCreationService],
})
export class StoryModule {}
