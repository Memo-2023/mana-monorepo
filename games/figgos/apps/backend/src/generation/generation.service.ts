import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateFigureDto } from './dto/generate-figure.dto';
import { FigureService } from '../figure/figure.service';

interface CharacterInfo {
	character: {
		description: string;
		imagePrompt: string;
		lore: string;
	};
	items: Array<{
		name: string;
		description: string;
		imagePrompt: string;
		lore: string;
	}>;
	styleDescription?: string;
}

@Injectable()
export class GenerationService {
	private openai: OpenAI;

	constructor(
		private configService: ConfigService,
		private figureService: FigureService
	) {
		const apiKey = this.configService.get<string>('OPENAI_API_KEY');
		if (apiKey) {
			this.openai = new OpenAI({ apiKey });
		}
	}

	async generateFigure(dto: GenerateFigureDto, userId: string) {
		if (!this.openai) {
			throw new BadRequestException('OpenAI API key not configured');
		}

		// Step 1: Generate character info using GPT-4
		const characterInfo = await this.generateCharacterInfo(dto);

		// Step 2: Generate image using DALL-E
		const { imageUrl, enhancedPrompt } = await this.generateImage(dto.name, characterInfo);

		// Step 3: Store figure in database
		const figure = await this.figureService.create(
			{
				name: dto.name,
				subject: dto.name,
				imageUrl,
				enhancedPrompt,
				rarity: dto.rarity || 'common',
				characterInfo,
				isPublic: dto.isPublic ?? true,
			},
			userId
		);

		return {
			...figure,
			generatedDescriptions: characterInfo,
		};
	}

	private async generateCharacterInfo(dto: GenerateFigureDto): Promise<CharacterInfo> {
		const artifactNames = dto.artifacts?.map((a) => a.name).filter(Boolean) || [];
		const artifactDescriptions = dto.artifacts?.map((a) => a.description).filter(Boolean) || [];

		const prompt = `You are creating a collectible fantasy figure character. Generate detailed information for the following:

Character Name: ${dto.name}
${dto.characterDescription ? `Character Description: ${dto.characterDescription}` : ''}
${artifactNames.length > 0 ? `Artifacts/Items: ${artifactNames.join(', ')}` : ''}
${artifactDescriptions.length > 0 ? `Item Descriptions: ${artifactDescriptions.join('; ')}` : ''}
Rarity: ${dto.rarity || 'common'}

Please respond in the following JSON format:
{
  "character": {
    "description": "A detailed description of the character's appearance and personality (2-3 sentences)",
    "imagePrompt": "A detailed prompt for generating the character's image (focus on visual elements)",
    "lore": "Background story and lore for the character (2-3 sentences)"
  },
  "items": [
    {
      "name": "Item name",
      "description": "What the item is and does",
      "imagePrompt": "Visual description for the item",
      "lore": "History or significance of the item"
    }
  ],
  "styleDescription": "Overall art style recommendation"
}

Generate 3 items total, using the provided artifact names/descriptions as inspiration if available.
Make the character and items more elaborate for higher rarities (legendary > epic > rare > common).`;

		const completion = await this.openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content:
						'You are a creative fantasy character designer. Always respond with valid JSON only, no additional text.',
				},
				{ role: 'user', content: prompt },
			],
			temperature: 0.8,
		});

		const content = completion.choices[0]?.message?.content;
		if (!content) {
			throw new BadRequestException('Failed to generate character info');
		}

		try {
			// Parse JSON, handling potential markdown code blocks
			const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
			return JSON.parse(jsonStr);
		} catch {
			throw new BadRequestException('Failed to parse character info response');
		}
	}

	private async generateImage(
		name: string,
		characterInfo: CharacterInfo
	): Promise<{ imageUrl: string; enhancedPrompt: string }> {
		const imagePrompt = `Create a collectible figure/toy design in a stylized 3D render style:

Character: ${name}
${characterInfo.character.imagePrompt}

Style: High-quality collectible figure design, similar to Funko Pop or designer toys,
soft lighting, clean background, professional product photography style.
${characterInfo.styleDescription || ''}

The figure should be displayed on a simple pedestal or stand, emphasizing the collectible nature.`;

		const response = await this.openai.images.generate({
			model: 'dall-e-3',
			prompt: imagePrompt,
			n: 1,
			size: '1024x1024',
			quality: 'standard',
		});

		const imageUrl = response.data[0]?.url;
		if (!imageUrl) {
			throw new BadRequestException('Failed to generate image');
		}

		// TODO: Upload image to S3/MinIO storage instead of using OpenAI URL directly
		// For now, return the temporary OpenAI URL (expires after ~1 hour)

		return {
			imageUrl,
			enhancedPrompt: response.data[0]?.revised_prompt || imagePrompt,
		};
	}
}
