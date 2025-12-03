import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { AccountModule } from './account/account.module';
import { OAuthModule } from './oauth/oauth.module';
import { FolderModule } from './folder/folder.module';
import { EmailModule } from './email/email.module';
import { ComposeModule } from './compose/compose.module';
import { AttachmentModule } from './attachment/attachment.module';
import { LabelModule } from './label/label.module';
import { SyncModule } from './sync/sync.module';
import { AIModule } from './ai/ai.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ScheduleModule.forRoot(),
		DatabaseModule,
		HealthModule,
		AccountModule,
		OAuthModule,
		FolderModule,
		EmailModule,
		ComposeModule,
		AttachmentModule,
		LabelModule,
		SyncModule,
		AIModule,
	],
})
export class AppModule {}
