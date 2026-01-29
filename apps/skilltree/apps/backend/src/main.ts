import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	// Enable CORS
	app.enableCors({
		origin: (origin, callback) => {
			if (!origin) {
				callback(null, true);
				return;
			}

			const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
				'http://localhost:5173',
				'http://localhost:5195',
				'http://localhost:8081',
			];

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
	app.setGlobalPrefix('api/v1', {
		exclude: ['metrics', 'health'],
	});

	const port = process.env.PORT || 3024;
	await app.listen(port);

	logger.log(`SkillTree API is running on: http://localhost:${port}`);
	logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
