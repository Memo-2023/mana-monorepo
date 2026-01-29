import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('port', 3023);

	// Global prefix
	app.setGlobalPrefix('api/v1');

	// CORS
	app.enableCors({
		origin: configService.get<string[]>('cors.origins', ['http://localhost:*']),
		credentials: true,
	});

	// Global pipes
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		}),
	);

	// Global filters
	app.useGlobalFilters(new HttpExceptionFilter());

	await app.listen(port);
	logger.log(`Mana Crawler Service running on port ${port}`);
	logger.log(`Health check: http://localhost:${port}/health`);
	logger.log(`Metrics: http://localhost:${port}/metrics`);
	logger.log(`Queue Dashboard: http://localhost:${port}/queue/dashboard`);
}

bootstrap();
