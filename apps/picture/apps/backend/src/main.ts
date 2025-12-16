import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { createCorsConfigWithCallback } from '@manacore/shared-nestjs-cors';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	// Enable CORS with centralized configuration (callback mode for mobile app support)
	app.enableCors(
		createCorsConfigWithCallback({
			corsOriginsEnv: process.env.CORS_ORIGINS,
		})
	);

	// Enable validation
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	// Serve static files from uploads directory (for local development)
	const uploadsPath = process.env.LOCAL_STORAGE_PATH || join(process.cwd(), 'uploads');
	app.useStaticAssets(uploadsPath, {
		prefix: '/uploads/',
	});

	// Set global prefix for API routes
	app.setGlobalPrefix('api/v1');

	const port = process.env.PORT || 3006;
	await app.listen(port);
	console.log(`Picture backend running on http://localhost:${port}`);
}
bootstrap();
