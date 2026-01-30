import { Module } from '@nestjs/common';
import { PresiService } from './presi.service';

@Module({
	providers: [PresiService],
	exports: [PresiService],
})
export class PresiModule {}
