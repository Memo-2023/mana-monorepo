import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthProxyModule } from './auth-proxy/auth-proxy.module';
import { SpacesModule } from './spaces/spaces.module';
import { MemoroModule } from './memoro/memoro.module';
import { MeetingsModule } from './meetings/meetings.module';
import { HealthModule } from './health/health.module';
import { CreditsModule } from './credits/credits.module';
import { SettingsModule } from './settings/settings.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { AiModule } from './ai/ai.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			ignoreEnvFile: process.env.NODE_ENV === 'production',
		}),
		AuthModule,
		AuthProxyModule,
		SpacesModule,
		MemoroModule,
		MeetingsModule,
		HealthModule,
		CreditsModule,
		SettingsModule,
		CleanupModule,
		AiModule,
	],
})
export class AppModule {}
