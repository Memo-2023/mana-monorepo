import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

import { GeminiAnalysisResult, GeminiError, PromptContext } from '../../types/API';

interface GeminiConfig {
	apiKey: string;
	model: string;
	temperature: number;
	maxOutputTokens: number;
}

interface RetryConfig {
	maxRetries: number;
	baseDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
}

export class GeminiService {
	private static instance: GeminiService;
	private genAI: GoogleGenerativeAI | null = null;
	private model: any = null;

	private config: GeminiConfig = {
		apiKey:
			Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY ||
			process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
			'AIzaSyD6yzHykVCB-g7HmGeNfl2t96UqAW8qwrY',
		model: 'gemini-1.5-pro-latest',
		temperature: 0.1, // Low temperature for consistent analysis
		maxOutputTokens: 2048,
	};

	private requestTimeout = 60000; // 60 seconds timeout

	private retryConfig: RetryConfig = {
		maxRetries: 3,
		baseDelay: 1000, // 1 second
		maxDelay: 10000, // 10 seconds
		backoffMultiplier: 2,
	};

	private constructor() {
		this.initialize();
	}

	public static getInstance(): GeminiService {
		if (!GeminiService.instance) {
			GeminiService.instance = new GeminiService();
		}
		return GeminiService.instance;
	}

	private initialize() {
		console.log('Initializing GeminiService...');
		console.log('API Key available:', !!this.config.apiKey);
		console.log('API Key length:', this.config.apiKey.length);

		if (!this.config.apiKey) {
			console.warn('Gemini API key not found. Set EXPO_PUBLIC_GEMINI_API_KEY in your environment.');
			return;
		}

		try {
			this.genAI = new GoogleGenerativeAI(this.config.apiKey);
			this.model = this.genAI.getGenerativeModel({
				model: this.config.model,
				generationConfig: {
					temperature: this.config.temperature,
					maxOutputTokens: this.config.maxOutputTokens,
				},
			});
			console.log('GeminiService initialized successfully');
		} catch (error) {
			console.error('Failed to initialize GeminiService:', error);
		}
	}

	/**
	 * Converts local image file to base64 for Gemini API
	 */
	private async imageToBase64(imagePath: string): Promise<string> {
		try {
			console.log('Converting image to base64:', imagePath);

			// Check if file exists
			const fileInfo = await FileSystem.getInfoAsync(imagePath);
			if (!fileInfo.exists) {
				throw new Error(`Image file not found: ${imagePath}`);
			}

			// Check file size (limit to 20MB to prevent timeouts)
			const maxSize = 20 * 1024 * 1024; // 20MB
			if (fileInfo.size && fileInfo.size > maxSize) {
				throw new Error(`Image file too large: ${fileInfo.size} bytes (max: ${maxSize})`);
			}

			console.log('Image file info:', { size: fileInfo.size, uri: fileInfo.uri });

			const base64 = await FileSystem.readAsStringAsync(imagePath, {
				encoding: FileSystem.EncodingType.Base64,
			});

			console.log('Base64 conversion completed, length:', base64.length);
			return base64;
		} catch (error) {
			console.error('Failed to convert image to base64:', error);
			throw new Error(`Failed to convert image to base64: ${error}`);
		}
	}

	/**
	 * Generates the optimized prompt based on context
	 */
	private generatePrompt(context?: PromptContext): string {
		const basePrompt = `Du bist ein professioneller Ernährungsexperte. Analysiere dieses Essen-Foto präzise und detailliert.

AUFGABE:
1. Erkenne alle sichtbaren Lebensmittel und schätze realistische Portionsgrößen
2. Berechne Nährwerte basierend auf Standard-Portionen
3. Bewerte die Gesundheit der gesamten Mahlzeit
4. Berücksichtige versteckte Zutaten (Öle, Saucen, Gewürze)

${this.getContextualPrompt(context)}

ANTWORT-FORMAT (nur JSON, keine zusätzlichen Texte):
{
  "meal_analysis": {
    "total_calories": <Gesamtkalorien>,
    "total_protein": <Protein in g>,
    "total_carbs": <Kohlenhydrate in g>,
    "total_fat": <Fett in g>,
    "total_fiber": <Ballaststoffe in g>,
    "total_sugar": <Zucker in g>,
    "health_score": <1.0-10.0>,
    "health_category": "healthy|moderate|unhealthy",
    "confidence": <0.0-1.0>,
    "meal_type_suggestion": "breakfast|lunch|dinner|snack"
  },
  "food_items": [
    {
      "name": "Beispiel Lebensmittel",
      "category": "protein|vegetable|grain|fruit|dairy|fat|processed|beverage",
      "portion_size": "120g",
      "calories": 180,
      "protein": 27.0,
      "carbs": 0.0,
      "fat": 7.5,
      "fiber": 0.0,
      "sugar": 0.0,
      "confidence": 0.9,
      "is_organic": false,
      "is_processed": false,
      "allergens": []
    }
  ],
  "analysis_notes": {
    "health_reasoning": "Ausgewogene Mahlzeit mit hochwertigem Protein und Gemüse",
    "improvement_suggestions": [
      "Mehr Vollkornprodukte hinzufügen",
      "Portion der Kohlenhydrate erhöhen"
    ],
    "cooking_method": "grilled|fried|boiled|raw|baked|steamed",
    "estimated_freshness": "fresh|processed|mixed",
    "hidden_ingredients": ["Olivenöl (1 TL)", "Gewürze"],
    "portion_accuracy": "high|medium|low"
  }
}

BEWERTUNGSKRITERIEN health_score:
10: Optimal (viel Gemüse, mageres Protein, Vollkorn, minimal verarbeitet)
8-9: Sehr gesund (ausgewogen, natürliche Zutaten)
6-7: Gesund (gute Balance, moderate Verarbeitung)
4-5: Mittelmäßig (gemischt, einige verarbeitete Komponenten)
2-3: Ungesund (viel verarbeitet, hoher Zucker/Fett)
1: Sehr ungesund (Fast Food, stark verarbeitet)

KATEGORIEN:
- protein: Fleisch, Fisch, Eier, Hülsenfrüchte, Nüsse
- vegetable: Alle Gemüsesorten
- grain: Reis, Nudeln, Brot, Getreide
- fruit: Alle Früchte
- dairy: Milchprodukte
- fat: Öle, Butter, Avocado
- processed: Verarbeitete Lebensmittel
- beverage: Getränke

WICHTIG:
- Realistische Portionsgrößen (Deutsche Standards)
- Kalorien auf 5er-Schritte runden
- Bei Unsicherheit: confidence reduzieren
- Versteckte Fette/Öle nicht vergessen
- Mehrere gleiche Items separat listen`;

		return basePrompt;
	}

	/**
	 * Adds contextual information to the prompt
	 */
	private getContextualPrompt(context?: PromptContext): string {
		if (!context) return '';

		const contextPrompts = {
			breakfast: 'KONTEXT: Frühstück - berücksichtige typische deutsche Frühstücksportionen',
			lunch: 'KONTEXT: Mittagessen - Standard-Portionsgrößen für Hauptmahlzeit',
			dinner: 'KONTEXT: Abendessen - oft größere Portionen, mehr Kohlenhydrate',
			snack: 'KONTEXT: Snack - kleinere Portionen, oft verarbeitete Lebensmittel',
			restaurant: 'KONTEXT: Restaurant - größere Portionen, mehr versteckte Fette wahrscheinlich',
			homemade: 'KONTEXT: Hausgemacht - tendenziell gesünder, weniger versteckte Zusätze',
			fastfood: 'KONTEXT: Fast Food - höhere Kaloriendichte, mehr verarbeitete Zutaten',
		};

		const contextStrings: string[] = [];

		if (context.mealType) {
			contextStrings.push(contextPrompts[context.mealType] || '');
		}

		if (context.location) {
			contextStrings.push(contextPrompts[context.location] || '');
		}

		if (context.additional) {
			contextStrings.push(`ZUSÄTZLICHER KONTEXT: ${context.additional}`);
		}

		return contextStrings.filter(Boolean).join('\n');
	}

	/**
	 * Implements exponential backoff retry logic
	 */
	private async retry<T>(operation: () => Promise<T>, attempt: number = 0): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			if (attempt >= this.retryConfig.maxRetries) {
				throw error;
			}

			const delay = Math.min(
				this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
				this.retryConfig.maxDelay
			);

			console.log(
				`Gemini API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
			);

			await new Promise((resolve) => setTimeout(resolve, delay));
			return this.retry(operation, attempt + 1);
		}
	}

	/**
	 * Validates and parses the Gemini API response
	 */
	private validateResponse(response: string): GeminiAnalysisResult {
		try {
			console.log('Raw Gemini response:', response.substring(0, 500) + '...');

			// Clean the response - remove any markdown formatting
			const cleanResponse = response
				.replace(/```json\n?/g, '')
				.replace(/```\n?/g, '')
				.trim();

			console.log('Cleaned response:', cleanResponse.substring(0, 500) + '...');

			const parsed = JSON.parse(cleanResponse);
			console.log('Parsed JSON structure:', {
				hasMealAnalysis: !!parsed.meal_analysis,
				hasFoodItems: !!parsed.food_items,
				hasAnalysisNotes: !!parsed.analysis_notes,
				mealAnalysisFields: parsed.meal_analysis ? Object.keys(parsed.meal_analysis) : [],
			});

			// Validate required fields
			if (!parsed.meal_analysis || !parsed.food_items || !parsed.analysis_notes) {
				throw new Error('Missing required fields in API response');
			}

			// Validate meal_analysis structure with fallbacks
			const mealAnalysis = parsed.meal_analysis;

			// Set defaults for missing fields
			if (mealAnalysis.health_score === undefined || mealAnalysis.health_score === null) {
				console.warn('health_score missing, setting default value');
				mealAnalysis.health_score = 5.0; // Default neutral score
			}

			if (mealAnalysis.health_category === undefined || mealAnalysis.health_category === null) {
				console.warn('health_category missing, setting default value');
				mealAnalysis.health_category = 'moderate';
			}

			if (mealAnalysis.confidence === undefined || mealAnalysis.confidence === null) {
				console.warn('confidence missing, setting default value');
				mealAnalysis.confidence = 0.7; // Default medium confidence
			}

			// Ensure required numerical fields exist
			const requiredNumericalFields = [
				'total_calories',
				'total_protein',
				'total_carbs',
				'total_fat',
			];
			for (const field of requiredNumericalFields) {
				if (mealAnalysis[field] === undefined || mealAnalysis[field] === null) {
					console.warn(`${field} missing, setting to 0`);
					mealAnalysis[field] = 0;
				}
			}

			// Validate health_score range
			if (mealAnalysis.health_score < 1 || mealAnalysis.health_score > 10) {
				console.warn('Health score out of range, clamping to 1-10');
				mealAnalysis.health_score = Math.max(1, Math.min(10, mealAnalysis.health_score));
			}

			// Validate confidence range
			if (mealAnalysis.confidence < 0 || mealAnalysis.confidence > 1) {
				console.warn('Confidence out of range, clamping to 0-1');
				mealAnalysis.confidence = Math.max(0, Math.min(1, mealAnalysis.confidence));
			}

			// Ensure food_items is an array
			if (!Array.isArray(parsed.food_items)) {
				console.warn('food_items is not an array, creating empty array');
				parsed.food_items = [];
			}

			console.log('Response validation successful');
			return parsed as GeminiAnalysisResult;
		} catch (error) {
			console.error('Full response that failed to parse:', response);
			throw new Error(`Failed to parse Gemini response: ${error}`);
		}
	}

	/**
	 * Main method to analyze food image
	 */
	public async analyzeFoodImage(
		imagePath: string,
		context?: PromptContext
	): Promise<GeminiAnalysisResult> {
		if (!this.model) {
			console.error('GeminiService not properly initialized');
			console.log('Attempting re-initialization...');
			this.initialize();

			if (!this.model) {
				throw new GeminiError(
					'GeminiService not initialized. Check API key: EXPO_PUBLIC_GEMINI_API_KEY',
					'INITIALIZATION_ERROR',
					'PERMANENT'
				);
			}
		}

		const startTime = Date.now();

		try {
			console.log('Starting Gemini food analysis...');
			console.log('Analysis parameters:', {
				imagePath,
				context,
				timeout: this.requestTimeout,
				maxRetries: this.retryConfig.maxRetries,
			});

			// Convert image to base64
			console.log('Step 1: Converting image to base64...');
			const base64Image = await this.imageToBase64(imagePath);
			console.log('Step 1 completed: Base64 conversion successful');

			// Generate prompt
			console.log('Step 2: Generating prompt...');
			const prompt = this.generatePrompt(context);
			console.log('Step 2 completed: Prompt generation successful, length:', prompt.length);

			// Call Gemini API with retry logic
			console.log('Step 3: Making Gemini API request...');
			const result = await this.retry(async () => {
				console.log('Making Gemini API request with timeout:', this.requestTimeout);
				const requestStartTime = Date.now();

				// Create timeout promise
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => {
						reject(new Error(`Request timeout after ${this.requestTimeout}ms`));
					}, this.requestTimeout);
				});

				// Race between API call and timeout
				const response = await Promise.race([
					this.model.generateContent([
						prompt,
						{
							inlineData: {
								data: base64Image,
								mimeType: 'image/jpeg',
							},
						},
					]),
					timeoutPromise,
				]);

				const requestDuration = Date.now() - requestStartTime;
				console.log('Gemini API request completed in:', requestDuration, 'ms');

				if (!response || !response.response) {
					throw new Error('Invalid response structure from Gemini API');
				}

				const text = response.response.text();
				if (!text) {
					throw new Error('Empty response from Gemini API');
				}

				console.log('Gemini API response received, length:', text.length);
				return text;
			});
			console.log('Step 3 completed: API request successful');

			// Validate and parse response
			console.log('Step 4: Validating and parsing response...');
			const analysisResult = this.validateResponse(result);
			console.log('Step 4 completed: Response validation successful');

			const processingTime = Date.now() - startTime;
			console.log(`Gemini analysis completed successfully in ${processingTime}ms`);

			return {
				...analysisResult,
				_metadata: {
					processingTime,
					apiProvider: 'gemini',
					model: this.config.model,
					timestamp: new Date().toISOString(),
				},
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			console.error('Gemini analysis failed:', error);

			throw new GeminiError(
				`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				this.categorizeError(error),
				this.isRetryableError(error) ? 'TEMPORARY' : 'PERMANENT',
				{
					processingTime,
					originalError: error instanceof Error ? error.message : String(error),
				}
			);
		}
	}

	/**
	 * Categorizes errors for better handling
	 */
	private categorizeError(error: any): string {
		if (!error) return 'UNKNOWN_ERROR';

		const message = error.message || error.toString();

		if (message.includes('API key')) return 'API_KEY_ERROR';
		if (message.includes('quota') || message.includes('limit')) return 'QUOTA_ERROR';
		if (message.includes('timeout') || message.includes('aborted') || message.includes('TIMEOUT'))
			return 'TIMEOUT_ERROR';
		if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR';
		if (message.includes('base64') || message.includes('image') || message.includes('too large'))
			return 'IMAGE_ERROR';
		if (message.includes('parse') || message.includes('JSON')) return 'PARSING_ERROR';
		if (message.includes('Invalid response structure')) return 'RESPONSE_ERROR';

		return 'API_ERROR';
	}

	/**
	 * Determines if an error is retryable
	 */
	private isRetryableError(error: any): boolean {
		if (!error) return false;

		const message = error.message || error.toString();

		// Don't retry these errors
		if (message.includes('API key')) return false;
		if (message.includes('quota exceeded')) return false;
		if (message.includes('base64')) return false;
		if (message.includes('file not found')) return false;
		if (message.includes('too large')) return false;
		if (message.includes('Invalid response structure')) return false;

		// Retry these errors (but with caution for timeouts)
		if (message.includes('network')) return true;
		if (message.includes('timeout') || message.includes('aborted')) {
			console.log('Timeout detected - will retry with exponential backoff');
			return true;
		}
		if (message.includes('500')) return true;
		if (message.includes('502')) return true;
		if (message.includes('503')) return true;

		return false; // Default to non-retryable for unknown errors to prevent infinite loops
	}

	/**
	 * Gets service status and configuration
	 */
	public getStatus() {
		return {
			initialized: !!this.model,
			hasApiKey: !!this.config.apiKey,
			model: this.config.model,
			retryConfig: this.retryConfig,
		};
	}

	/**
	 * Updates retry configuration
	 */
	public updateRetryConfig(newConfig: Partial<RetryConfig>) {
		this.retryConfig = { ...this.retryConfig, ...newConfig };
	}

	/**
	 * Updates request timeout
	 */
	public updateTimeout(timeout: number) {
		this.requestTimeout = timeout;
		console.log('Updated request timeout to:', timeout);
	}
}
