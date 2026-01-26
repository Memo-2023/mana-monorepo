import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { ChatModule } from './chat/chat.module';
import { ConversationModule } from './conversation/conversation.module';
import { TemplateModule } from './template/template.module';
import { SpaceModule } from './space/space.module';
import { DocumentModule } from './document/document.module';
import { ModelModule } from './model/model.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		MetricsModule,
		DatabaseModule,
		ChatModule,
		ConversationModule,
		TemplateModule,
		SpaceModule,
		DocumentModule,
		ModelModule,
		HealthModule,
	],
})
export class AppModule {}
