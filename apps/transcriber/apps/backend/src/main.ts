import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173', // SvelteKit dev
      'http://localhost:4321', // Astro dev
      'http://localhost:3000', // Alternative dev
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3006;
  await app.listen(port);

  console.log(`[Transcriber Backend] Running on http://localhost:${port}`);
}

bootstrap();
