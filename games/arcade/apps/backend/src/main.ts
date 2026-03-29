import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// CORS configuration
	app.enableCors({
		origin: [
			'http://localhost:5210', // SvelteKit dev
			'http://localhost:4321', // Legacy Astro dev
			'http://localhost:3000', // Alternative dev
		],
		methods: ['GET', 'POST', 'OPTIONS'],
		credentials: false,
	});

	app.setGlobalPrefix('api');

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);

	const port = process.env.PORT || 3010;

	// Increase timeout for long-running AI requests (2 minutes)
	const server = await app.listen(port);
	server.setTimeout(120000);

	console.log(`Arcade backend running on http://localhost:${port}`);
}
bootstrap();
