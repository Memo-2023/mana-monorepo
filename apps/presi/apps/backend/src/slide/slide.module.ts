import { Module } from '@nestjs/common';
import { SlideController } from './slide.controller';
import { SlideService } from './slide.service';
import { DeckModule } from '../deck/deck.module';

@Module({
  imports: [DeckModule],
  controllers: [SlideController],
  providers: [SlideService],
})
export class SlideModule {}
