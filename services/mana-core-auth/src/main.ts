import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createCorsConfig } from '@manacore/shared-nestjs-cors';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);

	// Comprehensive security headers with OWASP best practices
	app.use(
		helmet({
			// HSTS: Force HTTPS connections
			strictTransportSecurity: {
				maxAge: 31536000, // 1 year
				includeSubDomains: true,
				preload: true,
			},

			// Content Security Policy: XSS protection
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for NestJS
					scriptSrc: ["'self'"],
					imgSrc: ["'self'", 'data:', 'https:'],
					connectSrc: ["'self'"],
					fontSrc: ["'self'", 'data:'],
					objectSrc: ["'none'"],
					mediaSrc: ["'self'"],
					frameSrc: ["'none'"],
				},
			},

			// Clickjacking protection
			frameguard: { action: 'deny' },

			// MIME-type sniffing protection
			noSniff: true,

			// XSS filter
			xssFilter: true,

			// Referrer policy
			referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

			// CORS headers
			crossOriginResourcePolicy: { policy: 'cross-origin' },
			crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },

			// Hide powered-by header
			hidePoweredBy: true,
		})
	);

	// HTTPS enforcement in production
	if (process.env.NODE_ENV === 'production') {
		app.use((req: any, res: any, next: any) => {
			const protocol = req.header('x-forwarded-proto') || req.protocol;
			if (protocol !== 'https') {
				return res.redirect(301, `https://${req.header('host')}${req.url}`);
			}
			next();
		});
	}

	app.use(cookieParser());

	// CORS configuration with cross-app communication
	// Auth service needs to be accessible by ALL ManaCore apps
	const corsOriginsEnv = configService.get<string>('cors.origin');
	console.log('📋 CORS Origins from env:', corsOriginsEnv);
	app.enableCors(
		createCorsConfig({
			corsOriginsEnv,
			includeAllManaApps: true, // 🎯 Enable all ManaCore apps to authenticate
			additionalOrigins: [], // Keep X-App-Id support for custom headers
		})
	);

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

	// Global prefix
	app.setGlobalPrefix('api/v1');

	const port = configService.get<number>('port') || 3001;
	await app.listen(port);

	console.log(`🚀 Mana Core Auth running on: http://localhost:${port}`);
	console.log(`📚 Environment: ${configService.get<string>('nodeEnv')}`);
}

bootstrap();
