import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from '@manacore/shared-llm';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { PlantModule } from './plant/plant.module';
import { PhotoModule } from './photo/photo.module';
import { AnalysisModule } from './analysis/analysis.module';
import { WateringModule } from './watering/watering.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
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
		HealthModule.forRoot({ serviceName: 'planta-backend' }),
		MetricsModule.register({
			prefix: 'planta_',
			excludePaths: ['/health'],
		}),
		PlantModule,
		PhotoModule,
		AnalysisModule,
		WateringModule,
	],
})
export class AppModule {}
