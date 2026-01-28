import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const logger = new Logger('Bootstrap');

	const port = process.env.PORT || 3304;

	await app.listen(port);

	logger.log(`Telegram Contacts Bot running on port ${port}`);
	logger.log(`Contacts API: ${process.env.CONTACTS_API_URL || 'http://localhost:3015'}`);
}

bootstrap();
