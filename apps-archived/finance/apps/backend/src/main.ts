import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);

	// CORS configuration
	const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
		'http://localhost:5173',
		'http://localhost:5189',
		'http://localhost:8081',
	];

	app.enableCors({
		origin: corsOrigins,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: true,
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

	const port = configService.get<number>('PORT') || 3019;
	await app.listen(port);

	console.log(`Finance Backend running on http://localhost:${port}`);
	console.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
