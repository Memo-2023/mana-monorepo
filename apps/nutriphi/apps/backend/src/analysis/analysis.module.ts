import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { GeminiService } from './gemini.service';

@Module({
	controllers: [AnalysisController],
	providers: [AnalysisService, GeminiService],
	exports: [AnalysisService],
})
export class AnalysisModule {}
