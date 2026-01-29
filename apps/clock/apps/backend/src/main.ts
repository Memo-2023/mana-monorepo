import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for mobile and web apps
	const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) || [
		'http://localhost:3000',
		'http://localhost:5173',
		'http://localhost:5186',
		'http://localhost:8081',
		'exp://localhost:8081',
		'http://localhost:3001',
	];

	app.enableCors({
		origin: corsOrigins,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: true,
	});

	// Enable validation
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	// Set global prefix for API routes (exclude metrics endpoint)
	app.setGlobalPrefix('api/v1', {
		exclude: ['metrics', 'health'],
	});

	const port = process.env.PORT || 3017;
	await app.listen(port);
	console.log(`Clock backend running on http://localhost:${port}`);
}
bootstrap();
