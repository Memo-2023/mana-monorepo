import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
