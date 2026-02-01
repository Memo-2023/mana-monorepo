import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import { BotModule } from './bot/bot.module';
import { StorageModule } from './storage/storage.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BotModule,
		StorageModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-storage-bot')],
})
export class AppModule {}
