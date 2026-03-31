import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { HeadlineService } from './headline/headline.service';
import { MemoryService } from './memory/memory.service';
import { QuestionService } from './memory/question.service';
import { UserPromptService } from './shared/user-prompt.service';

@Module({
	providers: [AiService, HeadlineService, MemoryService, QuestionService, UserPromptService],
	exports: [AiService, HeadlineService, MemoryService, QuestionService, UserPromptService],
})
export class AiModule {}
