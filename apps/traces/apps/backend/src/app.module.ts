import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from '@manacore/shared-llm';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { ManaCoreModule } from '@manacore/nestjs-integration';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { DatabaseModule } from './db/database.module';
import { LocationModule } from './location/location.module';
import { CityModule } from './city/city.module';
import { PlaceModule } from './place/place.module';
import { PoiModule } from './poi/poi.module';
import { GuideModule } from './guide/guide.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				appId: configService.get<string>('APP_ID', 'traces'),
				serviceKey: configService.get<string>('MANA_CORE_SERVICE_KEY', ''),
				debug: configService.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		LlmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				manaLlmUrl: config.get('MANA_LLM_URL'),
				debug: config.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		MetricsModule.register({
			prefix: 'traces_',
			excludePaths: ['/health'],
		}),
		DatabaseModule,
		LocationModule,
		CityModule,
		PlaceModule,
		PoiModule,
		GuideModule,
		HealthModule.forRoot({ serviceName: 'traces-backend' }),
	],
})
export class AppModule {}
