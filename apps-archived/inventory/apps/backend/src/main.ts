import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('PORT') || 3020;
	const corsOrigins =
		configService.get<string>('CORS_ORIGINS') ||
		'http://localhost:5173,http://localhost:5188,http://localhost:8081';

	app.enableCors({
		origin: corsOrigins.split(',').map((o) => o.trim()),
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		})
	);

	await app.listen(port);
	console.log(`[Inventory Backend] Running on http://localhost:${port}`);
}

bootstrap();
