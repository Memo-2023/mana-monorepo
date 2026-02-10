import { Module } from '@nestjs/common';
import { FiguresController } from './figures.controller';
import { FiguresService } from './figures.service';

@Module({
	controllers: [FiguresController],
	providers: [FiguresService],
	exports: [FiguresService],
})
export class FiguresModule {}
