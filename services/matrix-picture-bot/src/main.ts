import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');

	const app = await NestFactory.create(AppModule);

	const port = process.env.PORT || 3319;
	await app.listen(port);

	logger.log(`Matrix Picture Bot running on port ${port}`);
	logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
