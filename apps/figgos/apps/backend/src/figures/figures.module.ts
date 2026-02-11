import { Module } from '@nestjs/common';
import { FiguresController } from './figures.controller';
import { FiguresService } from './figures.service';
import { GenerationModule } from '../generation/generation.module';

@Module({
	imports: [GenerationModule],
	controllers: [FiguresController],
	providers: [FiguresService],
	exports: [FiguresService],
})
export class FiguresModule {}
