import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { BotModule } from './bot/bot.module';
import { HealthController } from './health.controller';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		TelegrafModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				token: configService.get<string>('telegram.token') || '',
			}),
			inject: [ConfigService],
		}),
		ScheduleModule.forRoot(),
		DatabaseModule,
		BotModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
