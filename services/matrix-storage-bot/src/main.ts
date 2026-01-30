import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const port = process.env.PORT || 3323;
	await app.listen(port);
	console.log(`Matrix Storage Bot running on port ${port}`);
}
bootstrap();
