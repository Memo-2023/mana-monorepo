import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for mobile and web apps
	app.enableCors({
		origin: [
			'http://localhost:3000',
			'http://localhost:5173',
			'http://localhost:5174', // Chat web app (dev server port)
			'http://localhost:5178', // Chat web app (alternative)
			'http://localhost:8081',
			'exp://localhost:8081',
			'http://localhost:3001', // Mana Core Auth
		],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		credentials: true,
	});

	// Global exception filter will be added later via module
	// app.useGlobalFilters(new AppExceptionFilter());

	// Enable validation
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	// Set global prefix for API routes
	app.setGlobalPrefix('api');

	const port = process.env.PORT || 3002;
	await app.listen(port);
	console.log(`Chat backend running on http://localhost:${port}`);
}
bootstrap();
