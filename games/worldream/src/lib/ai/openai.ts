import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { ContentData, NodeKind } from '$lib/types/content';
import { aiLogger } from '$lib/utils/logger';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY,
});

interface GenerateContentOptions {
	kind: NodeKind;
	prompt: string;
	context?: {
		world?: string;
		worldData?: any;
		existingCharacters?: string[];
		existingPlaces?: string[];
		existingObjects?: string[];
		selectedCharacters?: any[];
		selectedPlace?: any;
	};
}

export async function generateContent(options: GenerateContentOptions): Promise<{
	title: string;
	summary: string;
	content: Partial<ContentData>;
	tags: string[];
	generationContext: any;
}> {
	const { kind, prompt, context } = options;

	aiLogger.info(`Starting content generation for ${kind}`, {
		kind,
		promptLength: prompt.length,
		hasContext: !!context,
	});

	const systemPrompt = getSystemPrompt(kind, context);
	const timer = aiLogger.startTimer(`generateContent-${kind}`);

	// Build complete generation context for storage
	const generationContext = {
		userPrompt: prompt,
		systemPrompt: systemPrompt,
		worldContext: context?.world,
		worldDetails: context?.worldData
			? {
					title: context.worldData.title,
					summary: context.worldData.summary,
					appearance: context.worldData.content?.appearance,
				}
			: undefined,
		selectedCharacters: context?.selectedCharacters || undefined,
		selectedPlace: context?.selectedPlace || undefined,
		model: 'gpt-5-mini',
		timestamp: new Date().toISOString(),
	};

	try {
		const requestParams = {
			model: 'gpt-5-mini',
			messages: [
				{ role: 'system' as const, content: systemPrompt },
				{ role: 'user' as const, content: prompt },
			],
			// temperature: 1 ist default für GPT-4o-mini (andere Werte nicht unterstützt)
			response_format: { type: 'json_object' as const },
			max_completion_tokens: 10000, // Einheitliches Token-Limit für alle
		};

		aiLogger.apiRequest('OpenAI', 'chat.completions.create', requestParams);

		const completion = await openai.chat.completions.create(requestParams);

		const duration = timer();
		aiLogger.apiResponse('OpenAI', 'chat.completions.create', completion, duration);

		const rawContent = completion.choices[0].message.content || '{}';

		// Enhanced logging for story generation debugging
		if (kind === 'story') {
			console.log('🎬 Story Generation Debug:', {
				hasSelectedCharacters: !!context?.selectedCharacters?.length,
				selectedCharacters: context?.selectedCharacters?.map((c: any) => ({
					name: c.name,
					slug: c.slug,
				})),
				rawResponsePreview: rawContent.substring(0, 1000),
			});

			// Log the actual parsed result
			try {
				const parsedForDebug = JSON.parse(rawContent);
				if (parsedForDebug.content?.lore) {
					console.log('📝 Generated story lore:', parsedForDebug.content.lore.substring(0, 500));
				}
			} catch (e) {
				console.log('Could not parse for debug');
			}
		}

		aiLogger.debug('Raw AI response', {
			contentLength: rawContent.length,
			first500Chars: rawContent.substring(0, 500),
			tokensUsed: completion.usage?.completion_tokens,
			finishReason: completion.choices[0].finish_reason,
		});

		let result: any;

		// Check if response was cut off
		if (completion.choices[0].finish_reason === 'length') {
			aiLogger.warn('Response was truncated due to token limit', {
				tokensUsed: completion.usage?.completion_tokens,
				contentLength: rawContent.length,
			});
		}

		try {
			result = JSON.parse(rawContent);
		} catch (parseError) {
			aiLogger.error('Failed to parse AI response', {
				error: parseError,
				rawContent: rawContent.substring(0, 1000),
				finishReason: completion.choices[0].finish_reason,
			});

			// If content is just "{}" and we hit token limit, throw error
			if (rawContent.trim() === '{}' && completion.choices[0].finish_reason === 'length') {
				throw new Error(
					'AI-Generierung fehlgeschlagen: Token-Limit erreicht. Bitte versuchen Sie einen kürzeren Prompt.'
				);
			}

			// Fallback: Try to extract JSON
			const jsonMatch = rawContent.match(/{[\s\S]*}/);
			if (jsonMatch) {
				try {
					result = JSON.parse(jsonMatch[0]);
				} catch (e) {
					result = {};
				}
			} else {
				result = {};
			}
		}

		// Post-process for story content: Replace REF_X with actual @slugs if AI generated them incorrectly
		if (kind === 'story' && result.content?.lore) {
			let processedLore = result.content.lore;
			let replacementsMade = false;

			// Check if there are REF_X placeholders
			if (/REF_\d+/.test(processedLore)) {
				console.warn('⚠️ Found REF_X placeholders in generated story, attempting to fix...');

				// Build a mapping of all possible references
				const refMapping: Record<number, string> = {};
				let refIndex = 0;

				// Add characters first
				if (context?.selectedCharacters?.length) {
					context.selectedCharacters.forEach((char: any) => {
						refMapping[refIndex] = `@${char.slug}`;
						console.log(`Mapping REF_${refIndex} → @${char.slug} (${char.name})`);
						refIndex++;
					});
				}

				// Add place if selected
				if (context?.selectedPlace) {
					refMapping[refIndex] = `@${context.selectedPlace.slug}`;
					console.log(
						`Mapping REF_${refIndex} → @${context.selectedPlace.slug} (${context.selectedPlace.name})`
					);
					refIndex++;
				}

				// Replace all REF_X with mapped values
				for (const [index, replacement] of Object.entries(refMapping)) {
					const refPattern = new RegExp(`REF_${index}(?!\\d)`, 'g');
					const before = processedLore;
					processedLore = processedLore.replace(refPattern, replacement);
					if (before !== processedLore) {
						replacementsMade = true;
						console.log(`✅ Replaced REF_${index} with ${replacement}`);
					}
				}

				// Check for any remaining REF_X patterns
				const remainingRefs = processedLore.match(/REF_\d+/g);
				if (remainingRefs) {
					console.error('❌ Still found unmatched REF patterns:', remainingRefs);
					console.log('Available mappings were:', refMapping);
				}

				if (replacementsMade) {
					result.content.lore = processedLore;
					console.log('✨ Fixed story content with proper @references');
				}
			}
		}

		aiLogger.info(`Content generated successfully for ${kind}`, {
			title: result.title,
			tagsCount: result.tags?.length || 0,
			duration,
		});

		return {
			title: result.title || 'Unbenannt',
			summary: result.summary || '',
			content: result.content || {},
			tags: result.tags || [],
			generationContext,
		};
	} catch (error) {
		const duration = timer();
		aiLogger.apiError('OpenAI', 'chat.completions.create', error, duration);
		throw error;
	}
}

function getSystemPrompt(kind: NodeKind, context?: any): string {
	const basePrompt = `Du bist ein kreativer Weltenbauer und Geschichtenerzähler. 
Erstelle detaillierte, konsistente und fesselnde Inhalte für eine text-first Worldbuilding-Plattform.
Antworte IMMER im JSON-Format.`;

	const kindPrompts: Record<NodeKind, string> = {
		character: `
${basePrompt}
WICHTIG: Antworte NUR mit validem JSON!

Erstelle einen Charakter:
{
  "title": "Name",
  "summary": "Beschreibung in 1-2 Sätzen",
  "tags": ["tag1", "tag2"],
  "content": {
    "appearance": "Aussehen (50-100 Wörter)",
    "lore": "Hintergrund (50-100 Wörter)",
    "voice_style": "Sprechstil",
    "capabilities": "Fähigkeiten (Stichpunkte)",
    "constraints": "Schwächen (Stichpunkte)",
    "motivations": "Ziele (Stichpunkte)",
    "secrets": "1-2 Geheimnisse",
    "relationships_text": "Beziehungen",
    "inventory_text": "Wichtige Gegenstände",
    "state_text": "Aktueller Status"
  }
}`,

		world: `
${basePrompt}
WICHTIG: Antworte NUR mit validem JSON ohne zusätzlichen Text!

Erstelle eine Welt mit folgender JSON-Struktur:
{
  "title": "Name der Welt",
  "summary": "Kurze Beschreibung der Welt in 1-2 Sätzen",
  "tags": ["genre1", "genre2", "setting"],
  "content": {
    "appearance": "Beschreibung der Welt, Landschaften, Atmosphäre (100-200 Wörter)",
    "lore": "Geschichte und Entstehung der Welt (100-200 Wörter)",
    "canon_facts_text": "3-5 unveränderliche Wahrheiten als kurze Liste",
    "glossary_text": "5-7 wichtige Begriffe mit kurzen Erklärungen",
    "constraints": "Naturgesetze und Einschränkungen als Stichpunkte",
    "timeline_text": "3-5 wichtige historische Ereignisse",
    "prompt_guidelines": "Stil-Richtlinien für weitere Generierungen (1-2 Sätze)"
  }
}`,

		place: `
${basePrompt}
Erstelle einen Ort mit folgender JSON-Struktur:
{
  "title": "Name des Ortes",
  "summary": "Kurze Beschreibung",
  "tags": ["typ", "stimmung"],
  "content": {
    "appearance": "Detaillierte Beschreibung des Ortes",
    "lore": "Geschichte und Bedeutung",
    "capabilities": "Was ist hier möglich?",
    "constraints": "Gefahren und Einschränkungen",
    "state_text": "Aktueller Zustand",
    "secrets": "Verborgene Aspekte"
  }
}`,

		object: `
${basePrompt}
Erstelle ein Objekt/Gegenstand mit folgender JSON-Struktur:
{
  "title": "Name des Objekts",
  "summary": "Kurze Beschreibung",
  "tags": ["typ", "seltenheit"],
  "content": {
    "appearance": "Aussehen und Material",
    "lore": "Herkunft und Geschichte",
    "capabilities": "Eigenschaften und Fähigkeiten",
    "constraints": "Einschränkungen und Nachteile",
    "state_text": "Aktueller Zustand und Aufbewahrungsort"
  }
}`,

		story: `
${basePrompt}

Erstelle eine Story mit folgender JSON-Struktur:
{
  "title": "Kurzer, packender Titel",
  "summary": "Zusammenfassung in 1-2 Sätzen",
  "tags": ["genre", "stimmung", "max 3 tags"],
  "content": {
    "lore": "## Szenen-Titel\\n\\nStory-Text mit @charaktername direkt im Text...",
    "references": "cast: @charaktere\\nplaces: @orte\\nobjects: @gegenstände",
    "prompt_guidelines": "Erzählstil für spätere Generierungen"
  }
}

STORY-REGELN:
1. Verwende Markdown: ## für Überschriften, **fett**, *kursiv*
2. Schreibe mindestens 30% Dialoge: "Text", sagte @charaktername.
3. Maximal 500 Wörter, fokussiere auf EINE Szene
4. Schreibe IMMER @slug-name DIREKT im Text, niemals Platzhalter!`,
	};

	let fullPrompt = kindPrompts[kind];

	if (context) {
		// World context with details - aber NICHT für neue Welten!
		// Neue Welten sollen unabhängig von bestehenden Welten sein
		if (kind !== 'world') {
			if (context.worldData) {
				fullPrompt += `\n\n🌍 WELT-KONTEXT: "${context.worldData.title}"`;
				if (context.worldData.summary) {
					fullPrompt += `\nZusammenfassung: ${context.worldData.summary}`;
				}
				if (context.worldData.content?.appearance) {
					fullPrompt += `\nErscheinung: ${context.worldData.content.appearance}`;
				}
				fullPrompt += `\n\nWICHTIG: Alle generierten Inhalte MÜSSEN konsistent mit dieser Welt-Beschreibung sein!`;
			} else if (context.world) {
				fullPrompt += `\n\nDie Inhalte sollen zur Welt "${context.world}" passen.`;
			}
		}
		if (context.selectedCharacters?.length) {
			fullPrompt += `\n\n👥 CHARAKTERE IN DIESER STORY:`;
			context.selectedCharacters.forEach((char: any) => {
				fullPrompt += `\n\n${char.name} (@${char.slug})`;
				if (char.summary) fullPrompt += `\n• ${char.summary}`;
				if (char.voice_style) fullPrompt += `\n• Sprechstil: ${char.voice_style}`;
				if (char.motivations) fullPrompt += `\n• Motivation: ${char.motivations}`;
			});
			fullPrompt += `\n\n⚠️ KRITISCH: Verwende EXAKT diese @-Slugs im Text:`;
			context.selectedCharacters.forEach((c: any) => {
				fullPrompt += `\n• @${c.slug} für ${c.name}`;
			});
			fullPrompt += `\n\nSchreibe @${context.selectedCharacters[0].slug} statt "${context.selectedCharacters[0].name}"`;
			fullPrompt += `\nNiemals Platzhalter, immer @slug-name direkt!`;
		}

		if (context.selectedPlace) {
			const place = context.selectedPlace;
			fullPrompt += `\n\n📍 AUSGEWÄHLTER ORT für diese Story:`;
			fullPrompt += `\n━━━ ${place.name} (@${place.slug}) ━━━`;
			if (place.summary) fullPrompt += `\n📝 Zusammenfassung: ${place.summary}`;
			if (place.appearance) fullPrompt += `\n🎨 Erscheinung: ${place.appearance}`;
			if (place.capabilities) fullPrompt += `\n✨ Besonderheiten: ${place.capabilities}`;
			if (place.constraints) fullPrompt += `\n⚠️ Gefahren/Einschränkungen: ${place.constraints}`;
			if (place.secrets) fullPrompt += `\n🔒 Geheimnisse: ${place.secrets}`;
			fullPrompt += `\n\n⚠️ PFLICHT: Die Story MUSS an diesem Ort spielen! Nutze die Ortsbeschreibung für Atmosphäre und Setting.`;
		}

		if (context.existingCharacters?.length) {
			fullPrompt += `\n\nExistierende Charaktere: ${context.existingCharacters.join(', ')}`;
		}
		if (context.existingPlaces?.length) {
			fullPrompt += `\n\nExistierende Orte: ${context.existingPlaces.join(', ')}`;
		}
		if (context.existingObjects?.length) {
			fullPrompt += `\n\nExistierende Objekte: ${context.existingObjects.join(', ')}`;
		}
	}

	return fullPrompt;
}

export async function enhanceContent(
	existingContent: Partial<ContentData>,
	kind: NodeKind,
	instruction: string
): Promise<Partial<ContentData>> {
	aiLogger.info('Enhancing content', {
		kind,
		instructionLength: instruction.length,
	});

	const timer = aiLogger.startTimer('enhanceContent');

	const systemPrompt = `Du bist ein kreativer Assistent für Worldbuilding.
Verbessere oder erweitere den gegebenen Content basierend auf den Anweisungen.
Behalte den existierenden Stil und Ton bei.
Antworte NUR mit dem verbesserten Content-Objekt im JSON-Format.`;

	try {
		const params = {
			model: 'gpt-5-mini',
			messages: [
				{ role: 'system' as const, content: systemPrompt },
				{
					role: 'user' as const,
					content: `Existierender Content:\n${JSON.stringify(existingContent, null, 2)}\n\nAnweisung: ${instruction}`,
				},
			],
			// temperature: 1 ist default für GPT-4o-mini
			response_format: { type: 'json_object' as const },
		};

		aiLogger.apiRequest('OpenAI', 'enhanceContent', params);

		const completion = await openai.chat.completions.create(params);

		const duration = timer();
		aiLogger.apiResponse('OpenAI', 'enhanceContent', completion, duration);

		const result = JSON.parse(completion.choices[0].message.content || '{}');

		aiLogger.info('Content enhanced successfully', { duration });

		return result;
	} catch (error) {
		const duration = timer();
		aiLogger.apiError('OpenAI', 'enhanceContent', error, duration);
		throw error;
	}
}

export async function generateSuggestions(
	field: keyof ContentData,
	context: {
		kind: NodeKind;
		title?: string;
		existingContent?: Partial<ContentData>;
	}
): Promise<string[]> {
	const prompts: Record<string, string> = {
		appearance: 'Generiere 3 kurze Vorschläge für das Aussehen',
		lore: 'Generiere 3 Ideen für die Hintergrundgeschichte',
		capabilities: 'Generiere 3 Vorschläge für Fähigkeiten',
		motivations: 'Generiere 3 mögliche Motivationen',
		secrets: 'Generiere 3 interessante Geheimnisse',
	};

	const completion = await openai.chat.completions.create({
		model: 'gpt-5-mini',
		messages: [
			{
				role: 'system' as const,
				content:
					'Generiere kreative Vorschläge. Antworte mit einem JSON-Array von 3 kurzen Strings.',
			},
			{
				role: 'user' as const,
				content: `${prompts[field] || 'Generiere 3 Vorschläge'} für ${context.title || 'dieses Element'}`,
			},
		],
		// temperature: 1 ist default für GPT-4o-mini
		response_format: { type: 'json_object' as const },
		max_completion_tokens: 200,
	});

	const result = JSON.parse(completion.choices[0].message.content || '{"suggestions":[]}');
	return result.suggestions || [];
}

export async function translateToImagePrompt(
	germanDescription: string,
	kind: NodeKind,
	title: string,
	style: 'realistic' | 'fantasy' | 'anime' | 'concept-art' | 'illustration' = 'fantasy'
): Promise<string> {
	const timer = aiLogger.startTimer('translateToImagePrompt');

	const systemPrompt = `Du bist ein Experte für KI-Bildgenerierung. Übersetze deutsche Beschreibungen in optimierte englische Prompts für Bildgenerierungs-KIs wie Flux.

Regeln:
- Übersetze präzise ins Englische
- Optimiere für Bildgenerierung (visuelle Details, Komposition, Beleuchtung)
- Keine deutschen Wörter im Ergebnis
- Fokus auf visuell beschreibbare Elemente
- Nutze Fachbegriffe für Bildqualität (sharp focus, detailed, professional, etc.)
- Antworte nur mit dem englischen Prompt, kein JSON oder zusätzlicher Text`;

	const kindContext = {
		character: 'Focus on character portrait, facial features, clothing, pose, expression',
		place: 'Focus on environment, landscape, architecture, atmosphere, lighting',
		object: 'Focus on item details, materials, textures, product shot composition',
		world: 'Focus on epic scale, panoramic view, diverse landscapes, world building',
		story: 'Focus on dramatic scene, narrative moment, cinematic composition',
	};

	const styleContext = {
		realistic: 'photorealistic style',
		fantasy: 'fantasy art style with magical elements',
		anime: 'anime art style with vibrant colors',
		'concept-art': 'professional concept art style',
		illustration: 'detailed illustration style',
	};

	try {
		const params = {
			model: 'gpt-5-mini',
			messages: [
				{ role: 'system' as const, content: systemPrompt },
				{
					role: 'user' as const,
					content: `Title: ${title}\nKind: ${kind} (${kindContext[kind]})\nStyle: ${style} (${styleContext[style]})\n\nGerman description to translate:\n${germanDescription}`,
				},
			],
			max_completion_tokens: 300,
		};

		aiLogger.apiRequest('OpenAI', 'translateToImagePrompt', params);

		const completion = await openai.chat.completions.create(params);

		const duration = timer();
		aiLogger.apiResponse('OpenAI', 'translateToImagePrompt', completion, duration);

		const englishPrompt = completion.choices[0].message.content?.trim();

		if (!englishPrompt) {
			throw new Error('No translation received from API');
		}

		aiLogger.info('German description translated to English image prompt', {
			originalLength: germanDescription.length,
			translatedLength: englishPrompt.length,
			duration,
		});

		console.log('✅ Translation successful:', {
			original: germanDescription.substring(0, 50) + '...',
			translated: englishPrompt.substring(0, 50) + '...',
		});

		return englishPrompt;
	} catch (error) {
		const duration = timer();
		aiLogger.apiError('OpenAI', 'translateToImagePrompt', error, duration);

		console.error('❌ Translation error details:', {
			error: error instanceof Error ? error.message : error,
			model: 'gpt-5-mini',
			germanText: germanDescription.substring(0, 100) + '...',
		});

		// Fallback: return original text if translation fails
		aiLogger.warn('Translation failed, using original text', { error });
		return germanDescription;
	}
}
