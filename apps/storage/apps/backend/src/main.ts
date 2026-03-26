import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('PORT') || 3016;
	const corsOrigins = configService.get<string>('CORS_ORIGINS') || '';

	// Enable CORS
	app.enableCors({
		origin: corsOrigins.split(',').filter(Boolean),
		credentials: true,
	});

	// Enable validation
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	// Swagger API docs
	const swaggerConfig = new DocumentBuilder()
		.setTitle('Storage API')
		.setDescription('Cloud storage service — files, folders, shares, tags, trash')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup('api/docs', app, document);

	await app.listen(port);
	console.log(`Storage backend running on http://localhost:${port}`);
	console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
