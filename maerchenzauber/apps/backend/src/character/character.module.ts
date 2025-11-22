import { Module } from '@nestjs/common';
import { CharacterController } from './character.controller';
import { PublicCharacterController } from './public-character.controller';
import { CharacterService } from './character.service';
import { TestController } from './test.controller';
import { CoreModule } from '../core/core.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [CoreModule, SupabaseModule],
  controllers: [CharacterController, PublicCharacterController, TestController],
  providers: [CharacterService],
  exports: [CharacterService],
})
export class CharacterModule {}
