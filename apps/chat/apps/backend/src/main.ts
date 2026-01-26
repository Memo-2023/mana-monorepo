import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
	const app = await NestFactory.create(AppModule);

	// Get MetricsService for request tracking
	const metricsService = app.get(MetricsService);

	// Global Express middleware to track ALL HTTP requests
	app.use((req: Request, res: Response, next: NextFunction) => {
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

	// Enable CORS for mobile and web apps
	const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) || [
		'http://localhost:3000',
		'http://localhost:5173',
		'http://localhost:5174',
		'http://localhost:5178',
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

	const port = process.env.PORT || 3002;
	await app.listen(port);
	console.log(`Chat backend running on http://localhost:${port}`);
}
bootstrap();
