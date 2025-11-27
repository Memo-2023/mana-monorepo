import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for web app
  app.enableCors({
    origin: [
      'http://localhost:5180', // voxel-lava web
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001', // Mana Core Auth
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set global prefix for API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3010;
  await app.listen(port);
  console.log(`Voxel-Lava backend running on http://localhost:${port}`);
}
bootstrap();
