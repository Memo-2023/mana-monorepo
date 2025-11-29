import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDb } from '@manacore/news-database';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_CONNECTION,
			useFactory: (configService: ConfigService) => {
				const databaseUrl =
					configService.get<string>('DATABASE_URL') ||
					'postgresql://news:news_dev_password@localhost:5434/news_hub';

				console.log('Connecting to database:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

				return createDb(databaseUrl);
			},
			inject: [ConfigService],
		},
	],
	exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
