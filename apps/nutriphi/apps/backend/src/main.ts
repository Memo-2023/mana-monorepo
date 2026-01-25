import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS
	app.enableCors({
		origin: process.env.CORS_ORIGINS?.split(',') || [
			'http://localhost:5180',
			'http://localhost:4323',
			'http://localhost:3001',
		],
		credentials: true,
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	// Global prefix
	app.setGlobalPrefix('api/v1');

	const port = process.env.PORT || 3023;
	await app.listen(port);
	console.log(`NutriPhi Backend running on http://localhost:${port}`);
}

bootstrap();
