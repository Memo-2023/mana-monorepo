import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { MetricsService } from './metrics/metrics.service';

// Normalize route paths to prevent high cardinality
function normalizeRoute(path: string): string {
	return path
		.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
		.replace(/\/\d+/g, '/:id');
}

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	// Get MetricsService for request tracking
	const metricsService = app.get(MetricsService);

	// Global Express middleware to track ALL HTTP requests
	// This runs before guards/interceptors, so it catches auth failures etc.
	app.use((req: Request, res: Response, next: NextFunction) => {
		// Skip metrics endpoint
		if (req.path === '/metrics') {
			return next();
		}

		const startTime = Date.now();
		const method = req.method;
		const route = normalizeRoute(req.path);

		res.once('finish', () => {
			const duration = (Date.now() - startTime) / 1000;
			metricsService.httpRequestsTotal.inc({
				method,
				route,
				status: res.statusCode.toString(),
			});
			metricsService.httpRequestDuration.observe(
				{ method, route, status: res.statusCode.toString() },
				duration
			);
		});

		next();
	});

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

	// API prefix (exclude metrics endpoint for Prometheus scraping)
	app.setGlobalPrefix('api/v1', {
		exclude: ['metrics', 'health'],
	});

	const port = process.env.PORT || 3017;
	await app.listen(port);

	logger.log(`Todo API is running on: http://localhost:${port}`);
	logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
