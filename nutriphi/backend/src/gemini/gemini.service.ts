import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface NutritionAnalysis {
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  confidence: number;
  ingredients?: string[];
  healthTips?: string[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeFoodImage(imageBase64: string): Promise<NutritionAnalysis> {
    this.logger.log('Analyzing food image with Gemini Vision');

    const prompt = `Analyze this food image and provide detailed nutritional information.

    Return a JSON object with the following structure:
    {
      "foodName": "Name of the food/meal",
      "calories": number (kcal),
      "protein": number (grams),
      "carbohydrates": number (grams),
      "fat": number (grams),
      "fiber": number (grams),
      "sugar": number (grams),
      "sodium": number (mg),
      "servingSize": "estimated serving size",
      "confidence": number (0-1, how confident you are in the analysis),
      "ingredients": ["list", "of", "visible", "ingredients"],
      "healthTips": ["optional health tips about this food"]
    }

    Be as accurate as possible with the nutritional estimates based on what you can see.
    Only return valid JSON, no additional text.`;

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ]);

      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const analysis: NutritionAnalysis = JSON.parse(jsonMatch[0]);
      this.logger.log(`Successfully analyzed: ${analysis.foodName}`);

      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze food image', error);
      throw error;
    }
  }

  async analyzeFoodText(description: string): Promise<NutritionAnalysis> {
    this.logger.log('Analyzing food description with Gemini');

    const prompt = `Based on this food description, provide detailed nutritional information: "${description}"

    Return a JSON object with the following structure:
    {
      "foodName": "Name of the food/meal",
      "calories": number (kcal),
      "protein": number (grams),
      "carbohydrates": number (grams),
      "fat": number (grams),
      "fiber": number (grams),
      "sugar": number (grams),
      "sodium": number (mg),
      "servingSize": "estimated serving size",
      "confidence": number (0-1, how confident you are),
      "ingredients": ["list", "of", "likely", "ingredients"],
      "healthTips": ["optional health tips about this food"]
    }

    Only return valid JSON, no additional text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const analysis: NutritionAnalysis = JSON.parse(jsonMatch[0]);
      this.logger.log(`Successfully analyzed: ${analysis.foodName}`);

      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze food description', error);
      throw error;
    }
  }
}
