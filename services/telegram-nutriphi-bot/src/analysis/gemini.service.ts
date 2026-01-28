import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

export interface AnalysisFood {
	name: string;
	quantity: string;
	calories: number;
	confidence: number;
}

export interface AnalysisResult {
	foods: AnalysisFood[];
	totalNutrition: {
		calories: number;
		protein: number;
		carbohydrates: number;
		fat: number;
		fiber: number;
		sugar: number;
	};
	description: string;
	confidence: number;
	warnings?: string[];
}

const PHOTO_ANALYSIS_PROMPT = `Du bist ein Ernährungsexperte. Analysiere das Bild dieser Mahlzeit und liefere eine detaillierte Nährwertanalyse.

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
    "sugar": 10
  },
  "description": "Kurze Beschreibung der Mahlzeit auf Deutsch",
  "confidence": 0.8,
  "warnings": ["Optional: Warnungen falls etwas unklar ist"]
}

Wichtig:
- Alle Nährwerte als Zahlen (keine Strings)
- Kalorien in kcal
- Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker in Gramm
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
}

Wichtig:
- Alle Nährwerte als Zahlen (keine Strings)
- Kalorien in kcal
- Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker in Gramm
- Confidence-Werte zwischen 0 und 1
- Beschreibung auf Deutsch
- Schätze realistische Portionsgrößen`;

@Injectable()
export class GeminiService implements OnModuleInit {
	private readonly logger = new Logger(GeminiService.name);
	private model: GenerativeModel | null = null;

	constructor(private configService: ConfigService) {}

	onModuleInit() {
		const apiKey = this.configService.get<string>('gemini.apiKey');
		if (apiKey) {
			const genAI = new GoogleGenerativeAI(apiKey);
			this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
			this.logger.log('Gemini service initialized');
		} else {
			this.logger.warn('Gemini API key not configured');
		}
	}

	isAvailable(): boolean {
		return this.model !== null;
	}

	async analyzeImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<AnalysisResult> {
		if (!this.model) {
			throw new Error('Gemini API nicht konfiguriert');
		}

		this.logger.log('Analyzing image...');

		const result = await this.model.generateContent([
			PHOTO_ANALYSIS_PROMPT,
			{
				inlineData: {
					mimeType,
					data: imageBase64,
				},
			},
		]);

		const response = result.response;
		const text = response.text();

		return this.parseResponse(text);
	}

	async analyzeText(description: string): Promise<AnalysisResult> {
		if (!this.model) {
			throw new Error('Gemini API nicht konfiguriert');
		}

		this.logger.log(`Analyzing text: ${description.substring(0, 50)}...`);

		const prompt = TEXT_ANALYSIS_PROMPT.replace('{INPUT}', description);
		const result = await this.model.generateContent(prompt);

		const response = result.response;
		const text = response.text();

		return this.parseResponse(text);
	}

	private parseResponse(text: string): AnalysisResult {
		// Extract JSON from response (handle markdown code blocks)
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			this.logger.error('Failed to parse response:', text);
			throw new Error('Konnte Antwort nicht parsen');
		}

		try {
			return JSON.parse(jsonMatch[0]) as AnalysisResult;
		} catch (error) {
			this.logger.error('JSON parse error:', error);
			throw new Error('Ungültiges JSON in Antwort');
		}
	}
}
