import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import type { NodeKind } from '$lib/types/content';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface ImageGenerationOptions {
	kind: NodeKind;
	title: string;
	description?: string;
	style?: 'realistic' | 'fantasy' | 'anime' | 'concept-art' | 'illustration';
	context?: {
		world?: string;
		appearance?: string;
		atmosphere?: string;
	};
}

export async function generateImage(options: ImageGenerationOptions): Promise<{
	imageUrl: string;
	prompt: string;
}> {
	const { kind, title, description, style = 'fantasy', context } = options;

	const prompt = buildImagePrompt(kind, title, description, style, context);

	// WICHTIG: Gemini API unterstützt derzeit keine direkte Bildgenerierung
	// Die "Nano Banana" Bildgenerierung ist nur über die Gemini Web-App verfügbar
	// Wir generieren stattdessen einen optimierten Prompt für externe Dienste

	const model = genAI.getGenerativeModel({
		model: 'gemini-1.5-flash', // Verwende das Standard-Modell für Prompt-Optimierung
	});

	try {
		// Generiere einen optimierten Bildprompt mit Gemini
		const result = await model.generateContent({
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: `Create an optimized image generation prompt for: ${prompt}. 
                 Make it detailed, descriptive, and suitable for image generation AI. 
                 Keep it under 500 characters. Return only the prompt, no explanation.`,
						},
					],
				},
			],
			generationConfig: {
				temperature: 0.8,
				maxOutputTokens: 200,
			},
		});

		const response = await result.response;
		const optimizedPrompt = response.text() || prompt;

		// Für Demo-Zwecke: Generiere eine Placeholder-URL mit dem Prompt
		// In Produktion: Hier würde man einen echten Bildgenerierungsdienst aufrufen
		const placeholderUrl = `https://via.placeholder.com/1024x1024/4F46E5/ffffff?text=${encodeURIComponent(title.substring(0, 20))}`;

		console.log('Optimized prompt for external image generation:', optimizedPrompt);

		return {
			imageUrl: placeholderUrl, // Placeholder - ersetze mit echtem Bildgenerierungsdienst
			prompt: optimizedPrompt,
		};
	} catch (error) {
		console.error('Fehler bei Prompt-Generierung:', error);
		throw new Error(
			`Prompt-Generierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
		);
	}
}

function buildImagePrompt(
	kind: NodeKind,
	title: string,
	description?: string,
	style: string = 'fantasy',
	context?: any
): string {
	const styleDescriptions = {
		realistic: 'photorealistic, highly detailed, professional photography',
		fantasy: 'fantasy art style, magical atmosphere, detailed illustration',
		anime: 'anime art style, vibrant colors, expressive',
		'concept-art': 'concept art, professional digital painting, atmospheric',
		illustration: 'detailed illustration, artistic, hand-drawn quality',
	};

	const kindPrompts: Record<NodeKind, string> = {
		character: `Character portrait of ${title}. ${description || ''} ${context?.appearance || ''}. ${styleDescriptions[style as keyof typeof styleDescriptions]}`,

		place: `Environment concept art of ${title}. ${description || ''} ${context?.atmosphere || ''}. Wide shot, establishing view. ${styleDescriptions[style as keyof typeof styleDescriptions]}`,

		object: `Item design of ${title}. ${description || ''} Centered composition, clear details. ${styleDescriptions[style as keyof typeof styleDescriptions]}`,

		world: `World map or panoramic view of ${title}. ${description || ''} Epic scale, diverse landscapes. ${styleDescriptions[style as keyof typeof styleDescriptions]}`,

		story: `Key scene illustration from "${title}". ${description || ''} Dramatic composition, narrative moment. ${styleDescriptions[style as keyof typeof styleDescriptions]}`,
	};

	let fullPrompt = kindPrompts[kind];

	if (context?.world) {
		fullPrompt += ` Set in the world of ${context.world}.`;
	}

	// Zusätzliche Qualitätshinweise
	fullPrompt += ' High quality, detailed, professional artwork. No text, no watermarks.';

	return fullPrompt;
}

export async function analyzeImage(imageUrl: string): Promise<{
	description: string;
	tags: string[];
	colors: string[];
}> {
	const model = genAI.getGenerativeModel({
		model: 'gemini-2.5-flash',
	});

	try {
		const result = await model.generateContent({
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: 'Analyze this image and provide a description, relevant tags, and dominant colors in JSON format.',
						},
						{
							inlineData: {
								mimeType: 'image/jpeg',
								data: imageUrl, // Base64 oder URL
							},
						},
					],
				},
			],
			generationConfig: {
				temperature: 0.3,
				maxOutputTokens: 1024,
				responseMimeType: 'application/json',
			},
		});

		const response = await result.response;
		const analysis = JSON.parse(response.text());

		return {
			description: analysis.description || '',
			tags: analysis.tags || [],
			colors: analysis.colors || [],
		};
	} catch (error) {
		console.error('Fehler bei Bildanalyse:', error);
		throw new Error('Bildanalyse fehlgeschlagen');
	}
}
