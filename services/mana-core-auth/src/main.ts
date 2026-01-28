import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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

	const configService = app.get(ConfigService);

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

	// Security middleware - configure helmet to allow CORS
	app.use(
		helmet({
			crossOriginResourcePolicy: { policy: 'cross-origin' },
			crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
		})
	);
	app.use(cookieParser());

	// CORS configuration
	const corsOrigins = configService.get<string[]>('cors.origin') || [];
	console.log('📋 CORS Origins configured:', corsOrigins);
	app.enableCors({
		origin: corsOrigins,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-App-Id'],
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

	// Global prefix (exclude metrics, health, Better Auth native routes, and OIDC routes)
	// Better Auth generates verification URLs with /api/auth/* prefix
	// OIDC Provider requires routes without prefix: /.well-known/*, /api/oidc/*
	app.setGlobalPrefix('api/v1', {
		exclude: ['metrics', 'health', 'api/auth/(.*)', '.well-known/(.*)', 'api/oidc/(.*)'],
	});

	const port = configService.get<number>('port') || 3001;
	await app.listen(port);

	console.log(`🚀 Mana Core Auth running on: http://localhost:${port}`);
	console.log(`📚 Environment: ${configService.get<string>('nodeEnv')}`);
}

bootstrap();
