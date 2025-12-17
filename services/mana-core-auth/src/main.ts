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

	// Security middleware - configure helmet to allow CORS
	app.use(
		helmet({
			crossOriginResourcePolicy: { policy: 'cross-origin' },
			crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
		})
	);
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
