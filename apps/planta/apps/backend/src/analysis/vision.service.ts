import { Injectable, Logger } from '@nestjs/common';
import { LlmClientService } from '@manacore/shared-llm';
import type { AnalysisResult } from '@planta/shared';

const PLANT_ANALYSIS_PROMPT = `Du bist ein erfahrener Botaniker und Pflanzenexperte. Analysiere dieses Pflanzenfoto und erstelle einen detaillierten Steckbrief.

Antworte NUR mit validem JSON (keine Markdown-Codeblocks, kein anderer Text) in diesem Format:

{
  "identification": {
    "scientificName": "Botanischer Name (Gattung und Art)",
    "commonNames": ["Deutscher Name", "Alternative Namen"],
    "confidence": 85
  },
  "health": {
    "status": "healthy",
    "issues": [],
    "details": "Beschreibung des Gesundheitszustands"
  },
  "care": {
    "light": "bright",
    "wateringFrequencyDays": 7,
    "humidity": "medium",
    "temperature": "18-24°C",
    "soilType": "Gut durchlässige Blumenerde",
    "tips": ["Pflegetipp 1", "Pflegetipp 2", "Pflegetipp 3"]
  }
}

Regeln:
- scientificName: Botanischer Name (z.B. "Monstera deliciosa")
- commonNames: Array mit deutschen Namen
- confidence: Zahl von 0-100 (wie sicher bist du bei der Identifikation)
- health.status: "healthy" | "minor_issues" | "needs_care" | "critical"
- health.issues: Array mit erkannten Problemen (leer wenn gesund)
- care.light: "low" | "medium" | "bright" | "direct"
- care.wateringFrequencyDays: Anzahl Tage zwischen Gießvorgängen
- care.humidity: "low" | "medium" | "high"
- care.tips: 3-5 praktische Pflegetipps auf Deutsch

Falls du die Pflanze nicht identifizieren kannst, setze confidence auf 0 und scientificName auf "Unbekannt".`;

@Injectable()
export class VisionService {
	private readonly logger = new Logger(VisionService.name);

	constructor(private readonly llm: LlmClientService) {}

	async analyzePlantImage(imageBuffer: Buffer, mimeType: string): Promise<AnalysisResult | null> {
		try {
			const base64 = imageBuffer.toString('base64');

			const { data } = await this.llm.visionJson<AnalysisResult>(
				PLANT_ANALYSIS_PROMPT,
				base64,
				mimeType,
				{
					temperature: 0.3,
					validate: (raw) => {
						const result = raw as AnalysisResult;
						this.validateAnalysisResult(result);
						return result;
					},
				}
			);

			this.logger.log(
				`Plant identified: ${data.identification.scientificName} (${data.identification.confidence}% confidence)`
			);

			return data;
		} catch (error) {
			this.logger.error(`Vision analysis failed: ${error}`);
			return null;
		}
	}

	private validateAnalysisResult(result: AnalysisResult): void {
		if (!result.identification) {
			result.identification = {
				scientificName: 'Unbekannt',
				commonNames: [],
				confidence: 0,
			};
		}

		if (typeof result.identification.confidence !== 'number') {
			result.identification.confidence = 0;
		}
		result.identification.confidence = Math.max(0, Math.min(100, result.identification.confidence));

		if (!result.health) {
			result.health = {
				status: 'healthy',
				issues: [],
				details: '',
			};
		}

		const validHealthStatuses = ['healthy', 'minor_issues', 'needs_care', 'critical'];
		if (!validHealthStatuses.includes(result.health.status)) {
			result.health.status = 'healthy';
		}

		if (!result.care) {
			result.care = {
				light: 'medium',
				wateringFrequencyDays: 7,
				humidity: 'medium',
				temperature: '18-24°C',
				soilType: 'Blumenerde',
				tips: [],
			};
		}

		const validLightLevels = ['low', 'medium', 'bright', 'direct'];
		if (!validLightLevels.includes(result.care.light)) {
			result.care.light = 'medium';
		}

		const validHumidityLevels = ['low', 'medium', 'high'];
		if (!validHumidityLevels.includes(result.care.humidity)) {
			result.care.humidity = 'medium';
		}

		if (
			typeof result.care.wateringFrequencyDays !== 'number' ||
			result.care.wateringFrequencyDays < 1
		) {
			result.care.wateringFrequencyDays = 7;
		}
	}
}
