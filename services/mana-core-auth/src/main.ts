import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);

	// Security middleware
	app.use(helmet());
	app.use(cookieParser());

	// CORS configuration
	const corsOrigins = configService.get<string[]>('cors.origin') || [];
	app.enableCors({
		origin: corsOrigins,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		})
	);

	// Global prefix
	app.setGlobalPrefix('api/v1');

	const port = configService.get<number>('port') || 3001;
	await app.listen(port);

	console.log(`🚀 Mana Core Auth running on: http://localhost:${port}`);
	console.log(`📚 Environment: ${configService.get<string>('nodeEnv')}`);
}

bootstrap();
