import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const port = process.env.PORT || 3325;
	await app.listen(port);
	console.log(`Matrix Presi Bot running on port ${port}`);
}
bootstrap();
