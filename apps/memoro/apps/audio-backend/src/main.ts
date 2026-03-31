import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const logger = new Logger('Bootstrap');

	// Add security headers with Helmet
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					styleSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
					scriptSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
					imgSrc: ["'self'", 'data:', 'https:'], // For Swagger UI
				},
			},
			crossOriginEmbedderPolicy: false, // Disable for Swagger UI compatibility
		})
	);

	// Add request size logging middleware
	app.use((req, res, next) => {
		const contentLength = req.headers['content-length'];
		if (contentLength && parseInt(contentLength) > 100000) {
			// Log requests > 100KB
			logger.log(`Large request detected: ${contentLength} bytes to ${req.url}`);
		}
		next();
	});

	// Configure body parser limits for large JSON payloads
	app.use(
		json({
			limit: '50mb',
			verify: (req, res, buf, encoding) => {
				if (buf.length > 50 * 1024 * 1024) {
					logger.error(`JSON payload too large: ${buf.length} bytes`);
					throw new Error('Payload too large');
				}
			},
		})
	);
	app.use(urlencoded({ extended: true, limit: '50mb' }));

	// Enable CORS
	app.enableCors({
		origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
		methods: ['GET', 'POST'],
		credentials: true,
	});

	// Enable global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // Strip properties that don't have decorators
			forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
			transform: true, // Automatically transform payloads to DTO instances
			transformOptions: {
				enableImplicitConversion: true, // Allow automatic type conversion
			},
		})
	);

	// Swagger API Documentation
	const config = new DocumentBuilder()
		.setTitle('Audio Transcription API')
		.setDescription(
			'Professional API for audio and video transcription with Azure Speech Services. Supports real-time and batch processing, speaker diarization, and multi-language detection.'
		)
		.setVersion('1.0')
		.addBearerAuth({
			type: 'http',
			scheme: 'bearer',
			bearerFormat: 'JWT',
			description: 'Enter your Bearer token',
		})
		.addTag('Audio Transcription', 'Endpoints for audio and video transcription')
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api-docs', app, document, {
		customSiteTitle: 'Audio Transcription API - Documentation',
		customCss: '.swagger-ui .topbar { display: none }',
	});

	const port = process.env.PORT || 1337;
	await app.listen(port, '0.0.0.0');

	console.log(`🎵 Audio Transcription Microservice running on port ${port}`);
}

bootstrap();
