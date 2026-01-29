import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { SkillModule } from './skill/skill.module';
import { ActivityModule } from './activity/activity.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		MetricsModule.register({
			prefix: 'skilltree_',
			excludePaths: ['/health'],
		}),
		DatabaseModule,
		HealthModule,
		SkillModule,
		ActivityModule,
	],
})
export class AppModule {}
