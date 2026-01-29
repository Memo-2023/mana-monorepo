import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

	await app.listen(port);
	console.log(`API Gateway running on port ${port}`);
}

bootstrap();
