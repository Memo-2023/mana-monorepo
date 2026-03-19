import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { SpaceModule } from './space/space.module';
import { DocumentModule } from './document/document.module';
import { AiModule } from './ai/ai.module';
import { TokenModule } from './token/token.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 100,
			},
		]),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'context-backend' }),
		SpaceModule,
		DocumentModule,
		AiModule,
		TokenModule,
	],
	providers: [
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class AppModule {}
