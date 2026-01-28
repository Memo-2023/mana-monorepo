import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('port', 3011);

	// Global prefix
	app.setGlobalPrefix('api/v1');

	// CORS
	app.enableCors({
		origin: configService.get<string[]>('cors.origins', [
			'http://localhost:3000',
			'http://localhost:5173',
			'http://localhost:8081',
		]),
		credentials: true,
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		}),
	);

	await app.listen(port);
	logger.log(`Questions Backend running on port ${port}`);
	logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
