import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { ZitareService } from './zitare.service';

@Module({
	providers: [QuotesService, ZitareService],
	exports: [QuotesService, ZitareService],
})
export class QuotesModule {}
