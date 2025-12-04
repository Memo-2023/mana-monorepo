import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { MoodsModule } from './moods/moods.module';
import { SequencesModule } from './sequences/sequences.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		DatabaseModule,
		HealthModule,
		MoodsModule,
		SequencesModule,
	],
})
export class AppModule {}
