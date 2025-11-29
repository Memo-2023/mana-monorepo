import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/app.config';
import { AppExceptionFilter } from '@manacore/shared-errors/nestjs';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	logger.log('Starting Storyteller Backend Service...');
	logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
	logger.log(
		`Mana Service URL: ${
			process.env.MANA_SERVICE_URL ||
			'https://mana-core-middleware-111768794939.europe-west3.run.app'
		}`
	);
	logger.log(`App ID: ${process.env.APP_ID || '8d2f5ddb-e251-4b3b-8802-84022a7ac77f'}`);

	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const config = configService.get<AppConfig>('app');

	const corsOrigins = config?.corsOrigins || ['http://localhost:3000'];
	logger.log(`CORS enabled for origins: ${corsOrigins.join(', ')}`);

	app.enableCors({
		origin: corsOrigins,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization', 'x-app-id'],
	});

	// Global pipes and filters
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		})
	);

	// Global exception filter for standardized error responses
	app.useGlobalFilters(new AppExceptionFilter());

	// Use PORT env variable (required by Cloud Run) or fallback to config
	const port = process.env.PORT || config?.port || 3000;
	await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Cloud Run
	logger.log(`Application is running on: http://0.0.0.0:${port}`);
	logger.log('Storyteller Backend Service started successfully!');
}

bootstrap();
