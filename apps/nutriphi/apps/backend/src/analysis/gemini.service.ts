import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { AIAnalysisResult } from '../types/nutrition.types';

const ANALYSIS_PROMPT = `Du bist ein Ernährungsexperte. Analysiere das Bild dieser Mahlzeit und liefere eine detaillierte Nährwertanalyse.

Aufgaben:
1. Identifiziere alle sichtbaren Lebensmittel
2. Schätze die Portionsgröße (in Gramm) basierend auf visuellen Hinweisen
3. Berechne die Nährwerte für jedes Lebensmittel
4. Summiere die Gesamtnährwerte

Antworte NUR mit einem validen JSON-Objekt im folgenden Format:
{
  "foods": [
    {
      "name": "Lebensmittelname",
      "quantity": "geschätzte Menge (z.B. '150g', '1 Tasse')",
      "calories": 123,
      "confidence": 0.85
    }
  ],
  "totalNutrition": {
    "calories": 500,
    "protein": 25,
    "carbohydrates": 60,
    "fat": 15,
    "fiber": 5,
    "sugar": 10,
    "vitaminA": 100,
    "vitaminC": 30,
    "vitaminD": 2,
    "calcium": 150,
    "iron": 3,
    "magnesium": 50
  },
  "description": "Kurze Beschreibung der Mahlzeit auf Deutsch",
  "confidence": 0.8,
  "warnings": ["Optional: Warnungen falls etwas unklar ist"],
  "suggestions": ["Optional: Verbesserungsvorschläge"]
}

Wichtig:
- Alle Nährwerte als Zahlen (keine Strings)
- Kalorien in kcal
- Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker in Gramm
- Vitamine und Mineralstoffe in den üblichen Einheiten (mg oder µg)
- Confidence-Werte zwischen 0 und 1
- Beschreibung auf Deutsch`;

const TEXT_ANALYSIS_PROMPT = `Du bist ein Ernährungsexperte. Analysiere die folgende Mahlzeitbeschreibung und liefere eine Nährwertschätzung.

Mahlzeit: {INPUT}

Antworte NUR mit einem validen JSON-Objekt im folgenden Format:
{
  "foods": [
    {
      "name": "Lebensmittelname",
      "quantity": "geschätzte Menge",
      "calories": 123,
      "confidence": 0.85
    }
  ],
  "totalNutrition": {
    "calories": 500,
    "protein": 25,
    "carbohydrates": 60,
    "fat": 15,
    "fiber": 5,
    "sugar": 10
  },
  "description": "Aufbereitete Beschreibung der Mahlzeit",
  "confidence": 0.75
}`;

@Injectable()
export class GeminiService implements OnModuleInit {
	private model: GenerativeModel | null = null;

	constructor(private configService: ConfigService) {}

	onModuleInit() {
		const apiKey = this.configService.get<string>('GEMINI_API_KEY');
		if (apiKey) {
			const genAI = new GoogleGenerativeAI(apiKey);
			// Use Gemini 2.5 Flash - fast and cost-effective
			this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
		}
	}

	async analyzeImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<AIAnalysisResult> {
		if (!this.model) {
			throw new Error('Gemini API not configured');
		}

		const result = await this.model.generateContent([
			ANALYSIS_PROMPT,
			{
				inlineData: {
					mimeType,
					data: imageBase64,
				},
			},
		]);

		const response = result.response;
		const text = response.text();

		// Extract JSON from response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('Failed to parse AI response');
		}

		return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
	}

	async analyzeText(description: string): Promise<AIAnalysisResult> {
		if (!this.model) {
			throw new Error('Gemini API not configured');
		}

		const prompt = TEXT_ANALYSIS_PROMPT.replace('{INPUT}', description);
		const result = await this.model.generateContent(prompt);

		const response = result.response;
		const text = response.text();

		// Extract JSON from response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('Failed to parse AI response');
		}

		return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
	}
}
