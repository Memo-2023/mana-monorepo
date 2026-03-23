import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('port', 3030);

	// Global prefix
	app.setGlobalPrefix('api/v1');

	// CORS
	app.enableCors({
		origin: ['http://localhost:5173', 'http://localhost:5174'],
		credentials: true,
	});

	// Global pipes
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	await app.listen(port);
	logger.log(`Landing Builder Service running on port ${port}`);
	logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
