import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:4321', // Astro dev
      'http://localhost:3000', // Alternative dev
      /\.netlify\.app$/, // Legacy Netlify
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3010;

  // Increase timeout for long-running AI requests (2 minutes)
  const server = await app.listen(port);
  server.setTimeout(120000);

  console.log(`Mana Games backend running on http://localhost:${port}`);
}
bootstrap();
