import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from '@manacore/shared-llm';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { MealModule } from './meal/meal.module';
import { GoalsModule } from './goals/goals.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AnalysisModule } from './analysis/analysis.module';
import { StatsModule } from './stats/stats.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env', '.env.development'],
		}),
		LlmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				manaLlmUrl: config.get('MANA_LLM_URL') || 'https://gpu-llm.mana.how',
				defaultVisionModel: config.get('VISION_MODEL') || 'ollama/gemma3:12b',
				debug: config.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'nutriphi-backend' }),
		MetricsModule.register({
			prefix: 'nutriphi_',
			excludePaths: ['/health'],
		}),
		MealModule,
		GoalsModule,
		FavoritesModule,
		AnalysisModule,
		StatsModule,
		RecommendationsModule,
	],
})
export class AppModule {}
