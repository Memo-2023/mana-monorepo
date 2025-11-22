import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('Starting ManaDeck Backend...');

  // Debug: Log environment variables before validation
  logger.log('=== Environment Variables Debug ===');
  logger.log(`APP_ID: ${process.env.APP_ID ? process.env.APP_ID.substring(0, 20) + '...' : 'NOT SET'}`);
  logger.log(`SUPABASE_URL: ${process.env.SUPABASE_URL || 'NOT SET'}`);
  logger.log(`MANA_SERVICE_URL: ${process.env.MANA_SERVICE_URL || 'NOT SET'}`);
  logger.log('===================================');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('v1', {
    exclude: ['health', 'health/ready', 'health/live'],
  });

  const port = configService.get<number>('PORT') || 8080;

  await app.listen(port);

  logger.log(`Environment: ${configService.get('NODE_ENV')}`);
  logger.log(`Mana Service URL: ${configService.get('MANA_SERVICE_URL')}`);
  logger.log(`App ID: ${configService.get('APP_ID')}`);
  logger.log(`Application running on port ${port}`);
  logger.log(`Health check available at http://localhost:${port}/health`);
}
bootstrap();
