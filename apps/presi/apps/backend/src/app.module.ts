import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { DeckModule } from './deck/deck.module';
import { SlideModule } from './slide/slide.module';
import { ThemeModule } from './theme/theme.module';
import { ShareModule } from './share/share.module';
import { HealthModule } from './health/health.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		DatabaseModule,
		DeckModule,
		SlideModule,
		ThemeModule,
		ShareModule,
		HealthModule,
	],
})
export class AppModule {}
