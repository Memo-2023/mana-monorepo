import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix('api/v1');

	// Increase body size limit for large file uploads
	app.use(json({ limit: '100mb' }));
	app.use(urlencoded({ extended: true, limit: '100mb' }));

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	app.enableCors({
		origin: process.env.CORS_ORIGINS?.split(',') || '*',
		credentials: true,
	});

	const port = process.env.PORT || 3015;
	await app.listen(port);

	logger.log(`Mana Media service running on port ${port}`);
	logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
