import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseProvider } from './supabase.provider';
import { SupabaseStorageProvider } from './supabase-storage.provider';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ConfigModule, CommonModule],
  providers: [SupabaseProvider, SupabaseStorageProvider],
  exports: [SupabaseProvider, SupabaseStorageProvider],
})
export class SupabaseModule {}
