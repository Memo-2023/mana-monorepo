import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegrafModule } from 'nestjs-telegraf';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { BotModule } from './bot/bot.module';
import { ContactsModule } from './contacts/contacts.module';
import { UserModule } from './user/user.module';
import { HealthController } from './health.controller';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		ScheduleModule.forRoot(),
		TelegrafModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				token: configService.get<string>('telegram.token') || '',
			}),
			inject: [ConfigService],
		}),
		DatabaseModule,
		BotModule,
		ContactsModule,
		UserModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
