import { Module } from '@nestjs/common';
import { NutriPhiService } from './nutriphi.service';

@Module({
	providers: [NutriPhiService],
	exports: [NutriPhiService],
})
export class NutriPhiModule {}
