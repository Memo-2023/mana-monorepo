import type { CardStyle, FigureLanguage, FigureRarity, GeneratedProfile } from '@figgos/shared';
import { STAT_RANGES } from '@figgos/shared';
import { GoogleGenAI } from '@google/genai';
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
		language: FigureLanguage
	): Promise<GeneratedProfile> {
		const statRange = STAT_RANGES[rarity];
		const userPrompt = buildProfileUserPrompt(name, description, rarity, statRange, language);

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
		faceImageUrl?: string | null
	): Promise<Buffer> {
		const prompt = buildImagePrompt(
			name,
			subtitle,
			visualDescription,
			items,
			cardStyle,
			!!faceImageUrl
		);

		this.logger.log(`Generating image for "${name}" (${cardStyle})...`);

		// Build contents array — if face image provided, include it
		const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [];

		if (faceImageUrl) {
			// TODO: Download face image from S3, convert to base64, add as inline data
			// For now, face transfer is not yet supported in the backend
			this.logger.warn('Face transfer not yet implemented in backend');
		}

		contents.push(prompt);

		const response = await this.client.models.generateContent({
			model: IMAGE_MODEL,
			contents,
			config: {
				responseModalities: ['IMAGE', 'TEXT'],
			},
		});

		// Extract image from response
		const parts = response.candidates?.[0]?.content?.parts;
		if (!parts) {
			throw new Error('Gemini returned no content parts');
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
