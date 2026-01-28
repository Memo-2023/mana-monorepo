import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	const port = process.env.PORT || 3312;
	await app.listen(port);

	logger.log(`Matrix Stats Bot running on port ${port}`);
	logger.log(`Health check: http://localhost:${port}/health`);
}
bootstrap();
