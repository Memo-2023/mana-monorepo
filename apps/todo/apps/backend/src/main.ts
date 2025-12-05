import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	// Enable CORS for all platforms
	app.enableCors({
		origin: (origin, callback) => {
			// Allow requests with no origin (mobile apps, curl, etc.)
			if (!origin) {
				callback(null, true);
				return;
			}

			const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
				'http://localhost:5173',
				'http://localhost:5186',
				'http://localhost:8081',
				'http://localhost:19006',
			];

			// Allow all localhost ports in development
			if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
				callback(null, true);
				return;
			}

			if (allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				logger.warn(`Blocked request from origin: ${origin}`);
				callback(new Error('Not allowed by CORS'), false);
			}
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		})
	);

	// API prefix
	app.setGlobalPrefix('api/v1');

	const port = process.env.PORT || 3017;
	await app.listen(port);

	logger.log(`Todo API is running on: http://localhost:${port}`);
	logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
