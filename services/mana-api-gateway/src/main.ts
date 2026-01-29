import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('port') || 3030;
	const corsOrigins = configService.get<string[]>('cors.origins') || [];

	// Enable CORS
	app.enableCors({
		origin: corsOrigins,
		credentials: true,
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	// Global exception filter
	app.useGlobalFilters(new HttpExceptionFilter());

	// Swagger/OpenAPI documentation
	const config = new DocumentBuilder()
		.setTitle('ManaCore API Gateway')
		.setDescription(
			'API Gateway for ManaCore services (Search, STT, TTS). ' +
				'Use X-API-Key header for public endpoints (/v1/*) and Bearer JWT for management endpoints (/api-keys/*).'
		)
		.setVersion('1.0')
		.addApiKey(
			{
				type: 'apiKey',
				name: 'X-API-Key',
				in: 'header',
				description: 'API Key for accessing public endpoints',
			},
			'api-key'
		)
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description: 'JWT token from mana-core-auth for management endpoints',
			},
			'jwt'
		)
		.addTag('Search', 'Web search and content extraction')
		.addTag('STT', 'Speech-to-Text transcription')
		.addTag('TTS', 'Text-to-Speech synthesis')
		.addTag('API Keys', 'API key management (requires JWT authentication)')
		.addTag('System', 'Health checks and metrics')
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	await app.listen(port);
	console.log(`API Gateway running on port ${port}`);
	console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
