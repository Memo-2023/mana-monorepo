import { Module } from '@nestjs/common';
import { CreatorsController } from './creators.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CreatorsController],
})
export class CreatorsModule {}
