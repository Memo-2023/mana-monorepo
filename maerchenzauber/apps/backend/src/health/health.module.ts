import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CoreModule } from '../core/core.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [ConfigModule, CoreModule, SupabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
