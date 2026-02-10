import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { DatabaseModule } from './db/database.module';
import { FiguresModule } from './figures/figures.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		MetricsModule.register({
			prefix: 'figgos_',
			excludePaths: ['/health'],
		}),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'figgos-backend' }),
		FiguresModule,
	],
})
export class AppModule {}
