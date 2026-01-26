import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new Logger('Bootstrap');
	const app = await NestFactory.create(AppModule);

	const configService = app.get(ConfigService);
	const port = configService.get<number>('port') || 3301;

	await app.listen(port);
	logger.log(`Telegram Ollama Bot running on port ${port}`);
	logger.log(`Ollama URL: ${configService.get<string>('ollama.url')}`);
	logger.log(`Default model: ${configService.get<string>('ollama.model')}`);
}

bootstrap();
