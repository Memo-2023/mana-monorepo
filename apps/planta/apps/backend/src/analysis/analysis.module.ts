import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { VisionService } from './vision.service';
import { PhotoModule } from '../photo/photo.module';
import { PlantModule } from '../plant/plant.module';

@Module({
	imports: [PhotoModule, PlantModule],
	controllers: [AnalysisController],
	providers: [AnalysisService, VisionService],
	exports: [AnalysisService],
})
export class AnalysisModule {}
