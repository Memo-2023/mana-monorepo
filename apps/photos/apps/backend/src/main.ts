import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: process.env.CORS_ORIGINS?.split(',') || [
			'http://localhost:5173',
			'http://localhost:5189',
			'http://localhost:8081',
		],
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
		})
	);

	app.setGlobalPrefix('api/v1');

	const port = process.env.PORT || 3019;
	await app.listen(port);
	console.log(`Photos Backend listening on port ${port}`);
}

bootstrap();
