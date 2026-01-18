import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
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
		HealthModule,
		PlantModule,
		PhotoModule,
		AnalysisModule,
		WateringModule,
	],
})
export class AppModule {}
