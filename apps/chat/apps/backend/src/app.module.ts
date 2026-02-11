import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { ManaCoreModule } from '@manacore/nestjs-integration';
import { DatabaseModule } from './db/database.module';
import { ChatModule } from './chat/chat.module';
import { ConversationModule } from './conversation/conversation.module';
import { TemplateModule } from './template/template.module';
import { SpaceModule } from './space/space.module';
import { DocumentModule } from './document/document.module';
import { ModelModule } from './model/model.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from '@manacore/shared-nestjs-health';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				appId: configService.get<string>('APP_ID', 'chat'),
				serviceKey: configService.get<string>('MANA_CORE_SERVICE_KEY', ''),
				debug: configService.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		MetricsModule.register({
			prefix: 'chat_',
			excludePaths: ['/health'],
		}),
		DatabaseModule,
		ChatModule,
		ConversationModule,
		TemplateModule,
		SpaceModule,
		DocumentModule,
		ModelModule,
		AdminModule,
		HealthModule.forRoot({ serviceName: 'chat-backend' }),
	],
})
export class AppModule {}
