import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import configuration from './config/configuration';
import { BotModule } from './bot/bot.module';
import { OllamaModule } from './ollama/ollama.module';
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
		BotModule,
		OllamaModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
