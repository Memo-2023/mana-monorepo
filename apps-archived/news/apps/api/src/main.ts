import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({ logger: true })
	);

	app.enableCors({
		origin: [
			'http://localhost:8081', // Expo web
			'http://localhost:19006', // Expo web alt
			'http://localhost:3000', // API itself (for testing)
			/^exp:\/\/.*/, // Expo Go
		],
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

	const port = process.env.API_PORT || 3000;
	await app.listen(port, '0.0.0.0');
	console.log(`API running on http://localhost:${port}`);
}

bootstrap();
