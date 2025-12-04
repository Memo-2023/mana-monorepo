import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { FigureModule } from './figure/figure.module';
import { GenerationModule } from './generation/generation.module';
import { HealthModule } from './health/health.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		DatabaseModule,
		FigureModule,
		GenerationModule,
		HealthModule,
	],
})
export class AppModule {}
