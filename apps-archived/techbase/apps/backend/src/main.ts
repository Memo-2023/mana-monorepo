import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for web app
	const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) || [
		'http://localhost:4321',
		'http://localhost:5173',
		'http://localhost:3000',
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

	// Set global prefix for API routes
	app.setGlobalPrefix('api');

	const port = process.env.PORT || 3020;
	await app.listen(port);
	console.log(`TechBase backend running on http://localhost:${port}`);
}
bootstrap();
