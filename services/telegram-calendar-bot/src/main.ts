import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('port') || 3303;

	// Graceful shutdown
	app.enableShutdownHooks();

	await app.listen(port);
	logger.log(`Telegram Calendar Bot running on port ${port}`);
	logger.log(`Calendar API: ${configService.get<string>('calendar.apiUrl')}`);
}

bootstrap();
