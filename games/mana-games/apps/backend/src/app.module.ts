import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameGeneratorModule } from './game-generator/game-generator.module';
import { GameSubmissionModule } from './game-submission/game-submission.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    GameGeneratorModule,
    GameSubmissionModule,
  ],
})
export class AppModule {}
