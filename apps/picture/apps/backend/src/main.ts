import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	// Enable CORS for mobile and web apps
	const allowedOrigins = [
		'http://localhost:3000',
		'http://localhost:5173',
		'http://localhost:5174',
		'http://localhost:5175',
		'http://localhost:8081',
		'exp://localhost:8081',
		'http://localhost:3001', // Mana Core Auth
	];

	app.enableCors({
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl)
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, origin || '*');
			} else {
				callback(null, false);
			}
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

	// Serve static files from uploads directory (for local development)
	const uploadsPath = process.env.LOCAL_STORAGE_PATH || join(process.cwd(), 'uploads');
	app.useStaticAssets(uploadsPath, {
		prefix: '/uploads/',
	});

	// Set global prefix for API routes
	app.setGlobalPrefix('api');

	const port = process.env.PORT || 3003;
	await app.listen(port);
	console.log(`Picture backend running on http://localhost:${port}`);
}
bootstrap();
