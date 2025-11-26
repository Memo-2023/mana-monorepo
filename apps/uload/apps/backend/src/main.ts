import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // CORS configuration
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix for API routes (except health and redirect)
  app.setGlobalPrefix('v1', {
    exclude: ['health', 'health/(.*)', ':code'],
  });

  const port = configService.get('PORT') || 3003;

  await app.listen(port);
  logger.log(`ULOAD Backend running on port ${port}`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
