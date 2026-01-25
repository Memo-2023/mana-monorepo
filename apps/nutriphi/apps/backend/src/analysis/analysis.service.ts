import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import type { AIAnalysisResult } from '../types/nutrition.types';

@Injectable()
export class AnalysisService {
	constructor(private geminiService: GeminiService) {}

	async analyzePhoto(imageBase64: string, mimeType?: string): Promise<AIAnalysisResult> {
		return this.geminiService.analyzeImage(imageBase64, mimeType);
	}

	async analyzeText(description: string): Promise<AIAnalysisResult> {
		return this.geminiService.analyzeText(description);
	}
}
