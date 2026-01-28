import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	const port = process.env.PORT || 3305;
	await app.listen(port);

	logger.log(`Telegram Chat Bot running on port ${port}`);
	logger.log(`Chat API: ${process.env.CHAT_API_URL || 'http://localhost:3002'}`);
}

bootstrap();
