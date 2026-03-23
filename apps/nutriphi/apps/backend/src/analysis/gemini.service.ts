import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
	private readonly logger = new Logger(GeminiService.name);
	private manaLlmUrl: string | null = null;
	private readonly visionModel = 'ollama/llava:7b';
	private readonly textModel = 'ollama/gemma3:4b';

	constructor(private configService: ConfigService) {}

	onModuleInit() {
		this.manaLlmUrl = this.configService.get<string>('MANA_LLM_URL') || 'http://localhost:3025';
		this.logger.log(`NutriPhi AI using mana-llm at ${this.manaLlmUrl}`);
	}

	async analyzeImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<AIAnalysisResult> {
		if (!this.manaLlmUrl) {
			throw new Error('mana-llm not configured');
		}

		const response = await fetch(`${this.manaLlmUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: this.visionModel,
				messages: [
					{
						role: 'user',
						content: [
							{ type: 'text', text: ANALYSIS_PROMPT },
							{
								type: 'image_url',
								image_url: { url: `data:${mimeType};base64,${imageBase64}` },
							},
						],
					},
				],
				temperature: 0.3,
			}),
			signal: AbortSignal.timeout(120000),
		});

		if (!response.ok) {
			const errorText = await response.text();
			this.logger.error(`mana-llm vision error: ${response.status} - ${errorText}`);
			throw new Error('Failed to analyze image');
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || '';

		// Extract JSON from response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('Failed to parse AI response');
		}

		return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
	}

	async analyzeText(description: string): Promise<AIAnalysisResult> {
		if (!this.manaLlmUrl) {
			throw new Error('mana-llm not configured');
		}

		const prompt = TEXT_ANALYSIS_PROMPT.replace('{INPUT}', description);

		const response = await fetch(`${this.manaLlmUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: this.textModel,
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.3,
			}),
			signal: AbortSignal.timeout(60000),
		});

		if (!response.ok) {
			throw new Error(`mana-llm error: ${response.status}`);
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || '';

		// Extract JSON from response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('Failed to parse AI response');
		}

		return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
	}
}
