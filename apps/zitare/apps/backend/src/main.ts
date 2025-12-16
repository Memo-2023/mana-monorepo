import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { createCorsConfig } from '@manacore/shared-nestjs-cors';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS with centralized configuration
	app.enableCors(
		createCorsConfig({
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

	// Set global prefix for API routes
	app.setGlobalPrefix('api/v1');

	const port = process.env.PORT || 3007;
	await app.listen(port);
	console.log(`Quote backend running on http://localhost:${port}`);
}
bootstrap();
