import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for web app
	const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) || [
		'http://localhost:3000',
		'http://localhost:5173',
		'http://localhost:5191',
		'http://localhost:3001',
	];

	app.enableCors({
		origin: corsOrigins,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

	// Set global prefix for API routes
	app.setGlobalPrefix('api/v1');

	const port = process.env.PORT || 3022;
	await app.listen(port);
	console.log(`Planta backend running on http://localhost:${port}`);
}
bootstrap();
