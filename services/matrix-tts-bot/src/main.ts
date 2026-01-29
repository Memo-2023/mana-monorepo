import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const port = process.env.PORT || 3023;

	await app.listen(port);

	const logger = new Logger('Bootstrap');
	logger.log(`Matrix TTS Bot running on port ${port}`);
	logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
