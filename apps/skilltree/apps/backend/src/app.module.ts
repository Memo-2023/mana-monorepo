import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics';
import { SkillModule } from './skill/skill.module';
import { ActivityModule } from './activity/activity.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		MetricsModule,
		DatabaseModule,
		HealthModule,
		SkillModule,
		ActivityModule,
	],
})
export class AppModule {}
