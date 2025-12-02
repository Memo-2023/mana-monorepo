import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

	await app.listen(port);
	console.log(`Storage backend running on http://localhost:${port}`);
}

bootstrap();
