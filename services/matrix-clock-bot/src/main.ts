import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const port = process.env.PORT || 3318;

	await app.listen(port);

	const logger = new Logger('Bootstrap');
	logger.log(`Matrix Clock Bot running on port ${port}`);
}

bootstrap();
