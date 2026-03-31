import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MemoroController } from './memoro.controller';
import { MemoroServiceController } from './memoro-service.controller';
import { SpaceSyncController } from './space-sync.controller';
import { QuestionMemoController } from './question-memo.controller';
import { CombineMemosController } from './combine-memos.controller';
import { MemoroService } from './memoro.service';
import { SyncSpaceMembersService } from './sync-space-members.service';
import { SpacesModule } from '../spaces/spaces.module';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { AiModule } from '../ai/ai.module';

@Module({
	imports: [ConfigModule, SpacesModule, AuthModule, CreditsModule, AiModule],
	controllers: [
		MemoroController,
		MemoroServiceController,
		SpaceSyncController,
		QuestionMemoController,
		CombineMemosController,
	],
	providers: [MemoroService, SyncSpaceMembersService],
	exports: [MemoroService, SyncSpaceMembersService],
})
export class MemoroModule {}
