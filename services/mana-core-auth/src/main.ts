import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
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

	// Security middleware - configure helmet to allow CORS and inline scripts for login page
	app.use(
		helmet({
			crossOriginResourcePolicy: { policy: 'cross-origin' },
			crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for login page
					styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
					imgSrc: ["'self'", 'data:', 'https:'],
					connectSrc: ["'self'"],
					fontSrc: ["'self'"],
					objectSrc: ["'none'"],
					frameAncestors: ["'none'"],
				},
			},
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
	// OIDC Provider requires routes without prefix: /.well-known/*, /api/auth/oauth2/*, /api/oidc/*
	app.setGlobalPrefix('api/v1', {
		exclude: [
			{ path: 'metrics', method: RequestMethod.ALL },
			{ path: 'health', method: RequestMethod.ALL },
			// OIDC login page
			{ path: 'login', method: RequestMethod.ALL },
			// Better Auth routes (verification emails, password reset, sign-in)
			{ path: 'api/auth/verify-email', method: RequestMethod.ALL },
			{ path: 'api/auth/reset-password/(.*)', method: RequestMethod.ALL },
			{ path: 'api/auth/sign-in/(.*)', method: RequestMethod.ALL },
			// Better Auth OIDC/OAuth2 routes (native paths from discovery document)
			{ path: 'api/auth/jwks', method: RequestMethod.ALL },
			{ path: 'api/auth/oauth2/(.*)', method: RequestMethod.ALL },
			{ path: 'api/auth/oauth2/authorize', method: RequestMethod.ALL },
			{ path: 'api/auth/oauth2/token', method: RequestMethod.ALL },
			{ path: 'api/auth/oauth2/userinfo', method: RequestMethod.ALL },
			{ path: 'api/auth/oauth2/:path*', method: RequestMethod.ALL },
			// OIDC discovery
			{ path: '.well-known/(.*)', method: RequestMethod.ALL },
			{ path: '.well-known/openid-configuration', method: RequestMethod.ALL },
			// Alternative OIDC routes
			{ path: 'api/oidc/(.*)', method: RequestMethod.ALL },
			{ path: 'api/oidc/:path*', method: RequestMethod.ALL },
		],
	});

	const port = configService.get<number>('port') || 3001;
	await app.listen(port);

	console.log(`🚀 Mana Core Auth running on: http://localhost:${port}`);
	console.log(`📚 Environment: ${configService.get<string>('nodeEnv')}`);
}

bootstrap();
