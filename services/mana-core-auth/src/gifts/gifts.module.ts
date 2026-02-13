import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller';
import { GiftCodeService } from './services/gift-code.service';

@Module({
	controllers: [GiftsController],
	providers: [GiftCodeService],
	exports: [GiftCodeService],
})
export class GiftsModule {}
