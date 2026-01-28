import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('port', 3021);

	// Global prefix
	app.setGlobalPrefix('api/v1');

	// CORS - intern, aber für Development nützlich
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
	logger.log(`Mana Search Service running on port ${port}`);
	logger.log(`Health check: http://localhost:${port}/health`);
	logger.log(`Metrics: http://localhost:${port}/metrics`);
}

bootstrap();
