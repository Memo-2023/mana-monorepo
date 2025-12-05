import { Module } from '@nestjs/common';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { FigureModule } from '../figure/figure.module';

@Module({
	imports: [FigureModule],
	controllers: [GenerationController],
	providers: [GenerationService],
	exports: [GenerationService],
})
export class GenerationModule {}
