import type { CardStyle, FigureLanguage, FigureRarity, GeneratedProfile } from '@figgos/shared';
import { STAT_RANGES } from '@figgos/shared';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	PROFILE_JSON_SCHEMA,
	PROFILE_SYSTEM_PROMPT,
	buildImagePrompt,
	buildProfileUserPrompt,
} from './prompts';

const TEXT_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

@Injectable()
export class GeminiService {
	private readonly logger = new Logger(GeminiService.name);
	private readonly client: GoogleGenAI;

	private readonly safetySettings = [
		{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
		{ category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
		{
			category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
			threshold: HarmBlockThreshold.BLOCK_NONE,
		},
		{
			category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
			threshold: HarmBlockThreshold.BLOCK_NONE,
		},
	];

	constructor(private config: ConfigService) {
		const apiKey = this.config.get<string>('GEMINI_API_KEY');
		if (!apiKey) {
			this.logger.warn('GEMINI_API_KEY not set — generation will fail');
		}
		this.client = new GoogleGenAI({ apiKey: apiKey || '' });
	}

	async generateProfile(
		name: string,
		description: string,
		rarity: FigureRarity,
		language: FigureLanguage,
		hasFace: boolean = false
	): Promise<GeneratedProfile> {
		const statRange = STAT_RANGES[rarity];
		const userPrompt = buildProfileUserPrompt(name, description, rarity, statRange, language, hasFace);

		this.logger.log(`Generating profile for "${name}" (${rarity})...`);

		const response = await this.client.models.generateContent({
			model: TEXT_MODEL,
			contents: userPrompt,
			config: {
				systemInstruction: PROFILE_SYSTEM_PROMPT,
				responseMimeType: 'application/json',
				responseSchema: PROFILE_JSON_SCHEMA,
				temperature: 1.0,
				thinkingConfig: { thinkingBudget: 0 },
				safetySettings: this.safetySettings,
			},
		});

		const text = response.text;
		if (!text) {
			throw new Error('Gemini returned empty text response');
		}

		const parsed = JSON.parse(text);

		// Validate required fields
		if (!parsed.subtitle || !parsed.backstory || !parsed.visualDescription) {
			throw new Error('Profile missing required text fields');
		}
		if (!Array.isArray(parsed.items) || parsed.items.length !== 3) {
			throw new Error(`Expected 3 items, got ${parsed.items?.length}`);
		}
		if (!parsed.stats || typeof parsed.stats.attack !== 'number') {
			throw new Error('Profile has invalid stats');
		}
		if (!parsed.specialAttack?.name || !parsed.specialAttack?.description) {
			throw new Error('Profile missing specialAttack');
		}

		// Clamp stats to valid range
		const clamp = (v: number) => Math.max(statRange.min, Math.min(statRange.max, v));
		parsed.stats.attack = clamp(parsed.stats.attack);
		parsed.stats.defense = clamp(parsed.stats.defense);
		parsed.stats.special = clamp(parsed.stats.special);

		const profile = parsed as GeneratedProfile;
		this.logger.log(`Profile generated: "${profile.subtitle}"`);
		return profile;
	}

	async generateImage(
		name: string,
		subtitle: string,
		visualDescription: string,
		items: string[],
		cardStyle: CardStyle,
		faceImage?: string | null
	): Promise<Buffer> {
		const hasFace = !!faceImage;
		const prompt = buildImagePrompt(name, subtitle, visualDescription, items, cardStyle, hasFace);

		this.logger.log(
			`Generating image for "${name}" (${cardStyle})${hasFace ? ' with face reference' : ''}...`
		);

		// Build contents array — if face image provided, include it as inline data
		const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [];

		if (faceImage) {
			// Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
			const base64Data = faceImage.includes(',') ? faceImage.split(',')[1] : faceImage;
			contents.push({
				inlineData: {
					mimeType: 'image/jpeg',
					data: base64Data,
				},
			});
			this.logger.log('Face reference image attached to generation request');
		}

		contents.push(prompt);

		const response = await this.client.models.generateContent({
			model: IMAGE_MODEL,
			contents,
			config: {
				responseModalities: ['IMAGE', 'TEXT'],
				safetySettings: this.safetySettings,
			},
		});

		// Extract image from response
		const parts = response.candidates?.[0]?.content?.parts;
		if (!parts) {
			throw new Error(
				'The AI could not generate this figure — try a different description or photo'
			);
		}

		for (const part of parts) {
			if (part.inlineData?.data) {
				const buffer = Buffer.from(part.inlineData.data, 'base64');
				this.logger.log(`Image generated: ${(buffer.length / 1024).toFixed(0)} KB`);
				return buffer;
			}
		}

		throw new Error('Gemini returned no image data');
	}
}
