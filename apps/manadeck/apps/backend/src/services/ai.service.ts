import { Injectable, Logger } from '@nestjs/common';
import { LlmClientService } from '@manacore/shared-llm';
import { AsyncResult, ok, err, ServiceError } from '@manacore/shared-errors';

export type CardType = 'text' | 'flashcard' | 'quiz' | 'mixed';

export interface TextContent {
	text: string;
}

export interface FlashcardContent {
	front: string;
	back: string;
	hint?: string;
}

export interface QuizContent {
	question: string;
	options: string[];
	correctAnswer: number;
	explanation?: string;
}

export interface GeneratedCard {
	cardType: CardType;
	title?: string;
	content: TextContent | FlashcardContent | QuizContent;
}

export interface DeckGenerationRequest {
	prompt: string;
	deckTitle: string;
	deckDescription?: string;
	cardCount?: number;
	cardTypes?: CardType[];
	difficulty?: 'beginner' | 'intermediate' | 'advanced';
	language?: string;
}

export interface DeckGenerationData {
	cards: GeneratedCard[];
	metadata: {
		model: string;
		tokensUsed?: number;
		generationTime: number;
	};
}

@Injectable()
export class AiService {
	private readonly logger = new Logger(AiService.name);

	constructor(private readonly llm: LlmClientService) {}

	isAvailable(): boolean {
		return true;
	}

	async generateDeck(request: DeckGenerationRequest): AsyncResult<DeckGenerationData> {
		const startTime = Date.now();

		const {
			prompt,
			deckTitle,
			deckDescription,
			cardCount = 10,
			cardTypes = ['flashcard', 'quiz'],
			difficulty = 'intermediate',
			language = 'en',
		} = request;

		try {
			const systemPrompt = this.buildSystemPrompt(cardTypes, difficulty, language);
			const userPrompt = this.buildUserPrompt(
				prompt,
				deckTitle,
				deckDescription,
				cardCount,
				cardTypes
			);

			const { data, usage } = await this.llm.json<{ cards: GeneratedCard[] }>(userPrompt, {
				systemPrompt,
				temperature: 0.7,
				validate: (raw) => {
					const obj = raw as { cards: GeneratedCard[] };
					if (!obj.cards || !Array.isArray(obj.cards)) {
						throw new Error('Response must contain a "cards" array');
					}
					return obj;
				},
			});

			const generationTime = Date.now() - startTime;
			const cards = data.cards;

			if (cards.length === 0) {
				return err(ServiceError.generationFailed('mana-llm', 'No cards generated'));
			}

			this.logger.log(`Generated ${cards.length} cards in ${generationTime}ms`);

			return ok({
				cards,
				metadata: {
					model: 'mana-llm',
					tokensUsed: usage.total_tokens || undefined,
					generationTime,
				},
			});
		} catch (error) {
			this.logger.error('AI deck generation failed:', error);

			return err(
				ServiceError.generationFailed(
					'mana-llm',
					error instanceof Error ? error.message : 'Unknown error occurred',
					error instanceof Error ? error : undefined
				)
			);
		}
	}

	private buildSystemPrompt(cardTypes: CardType[], difficulty: string, language: string): string {
		const cardTypeDescriptions = {
			text: 'Text cards contain informational content or explanations.',
			flashcard:
				'Flashcards have a front (question/term) and back (answer/definition), optionally with a hint.',
			quiz: 'Quiz cards have a question, 4 options (A-D), correct answer index (0-3), and an explanation.',
			mixed: 'Mixed cards combine multiple content types.',
		};

		const enabledTypes = cardTypes.map((t) => `- ${t}: ${cardTypeDescriptions[t]}`).join('\n');

		return `You are an expert educational content creator specializing in flashcards and study materials.

Your task is to generate high-quality learning cards for a deck based on the user's topic.

CARD TYPES YOU CAN CREATE:
${enabledTypes}

DIFFICULTY LEVEL: ${difficulty}
- beginner: Simple concepts, basic vocabulary, straightforward questions
- intermediate: More complex topics, requires some prior knowledge
- advanced: Deep understanding, nuanced questions, expert-level content

LANGUAGE: ${language === 'de' ? 'German' : language === 'en' ? 'English' : language}
Generate all content in this language.

QUALITY GUIDELINES:
1. Make content educational and accurate
2. Vary question styles to keep learning engaging
3. For flashcards: front should be concise, back should be complete but not verbose
4. For quiz: all 4 options should be plausible, avoid obviously wrong answers
5. Include helpful hints for difficult flashcards
6. Add explanations for quiz questions to reinforce learning
7. Progress from easier to harder cards when possible

RESPONSE FORMAT:
You MUST respond with a valid JSON object containing a "cards" array. Each card has:
${this.buildJsonSchemaDescription(cardTypes)}`;
	}

	private buildJsonSchemaDescription(cardTypes: CardType[]): string {
		const schemas: string[] = [];

		if (cardTypes.includes('flashcard')) {
			schemas.push(
				`- Flashcard: { "cardType": "flashcard", "title": "optional title", "content": { "front": "question/term", "back": "answer/definition", "hint": "optional hint" } }`
			);
		}
		if (cardTypes.includes('quiz')) {
			schemas.push(
				`- Quiz: { "cardType": "quiz", "title": "optional title", "content": { "question": "the question", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "why this is correct" } }`
			);
		}
		if (cardTypes.includes('text')) {
			schemas.push(
				`- Text: { "cardType": "text", "title": "optional title", "content": { "text": "informational content" } }`
			);
		}

		return schemas.join('\n');
	}

	private buildUserPrompt(
		prompt: string,
		deckTitle: string,
		deckDescription?: string,
		cardCount: number = 10,
		cardTypes: CardType[] = ['flashcard', 'quiz']
	): string {
		const typeDistribution = this.suggestTypeDistribution(cardCount, cardTypes);

		return `Create a deck of ${cardCount} learning cards about:

DECK TITLE: ${deckTitle}
${deckDescription ? `DESCRIPTION: ${deckDescription}` : ''}

USER'S REQUEST:
${prompt}

CARD DISTRIBUTION:
${typeDistribution}

Generate exactly ${cardCount} cards that cover the topic comprehensively.
Ensure variety in the questions and good coverage of the subject matter.

Respond ONLY with a JSON object: {"cards": [...]}`;
	}

	private suggestTypeDistribution(cardCount: number, cardTypes: CardType[]): string {
		if (cardTypes.length === 1) {
			return `- All ${cardCount} cards should be ${cardTypes[0]} type`;
		}

		const hasFlashcard = cardTypes.includes('flashcard');
		const hasQuiz = cardTypes.includes('quiz');
		const hasText = cardTypes.includes('text');

		if (hasFlashcard && hasQuiz && !hasText) {
			const flashcardCount = Math.ceil(cardCount * 0.6);
			const quizCount = cardCount - flashcardCount;
			return `- ${flashcardCount} flashcards for core concepts\n- ${quizCount} quiz cards to test understanding`;
		}

		if (hasFlashcard && hasQuiz && hasText) {
			const textCount = Math.ceil(cardCount * 0.2);
			const flashcardCount = Math.ceil((cardCount - textCount) * 0.6);
			const quizCount = cardCount - textCount - flashcardCount;
			return `- ${textCount} text cards for introductions/explanations\n- ${flashcardCount} flashcards for key terms\n- ${quizCount} quiz cards for testing`;
		}

		return `- Mix of ${cardTypes.join(', ')} cards as appropriate for the content`;
	}

	/**
	 * Generate cards from an image using vision model
	 */
	async generateFromImage(
		imageBase64: string,
		context?: string,
		cardCount: number = 5
	): AsyncResult<DeckGenerationData> {
		const startTime = Date.now();

		try {
			const prompt = `Analyze this image and create ${cardCount} educational flashcards based on its content.
${context ? `Context: ${context}` : ''}

For each concept, term, or important element you identify in the image, create a flashcard or quiz question.

Return ONLY a JSON object: {"cards": [...]} where each card has:
- cardType: "flashcard" or "quiz"
- title: short title
- content: { front, back, hint } for flashcards OR { question, options, correctAnswer, explanation } for quiz`;

			const { data, usage } = await this.llm.visionJson<{ cards: GeneratedCard[] }>(
				prompt,
				imageBase64,
				'image/jpeg',
				{
					validate: (raw) => {
						const obj = raw as { cards: GeneratedCard[] };
						if (!obj.cards || !Array.isArray(obj.cards)) {
							throw new Error('Response must contain a "cards" array');
						}
						return obj;
					},
				}
			);

			const generationTime = Date.now() - startTime;

			this.logger.log(`Generated ${data.cards.length} cards from image in ${generationTime}ms`);

			return ok({
				cards: data.cards,
				metadata: {
					model: 'mana-llm',
					tokensUsed: usage.total_tokens || undefined,
					generationTime,
				},
			});
		} catch (error) {
			this.logger.error('AI image generation failed:', error);
			return err(
				ServiceError.generationFailed(
					'mana-llm',
					error instanceof Error ? error.message : 'Unknown error'
				)
			);
		}
	}

	/**
	 * Enhance card content using AI
	 */
	async enhanceContent(
		content: string,
		cardType: string
	): AsyncResult<{ enhancedContent: string }> {
		try {
			const result = await this.llm.chat(
				`Improve and enhance this ${cardType} card content. Make it clearer, more educational, and engaging.

Original content:
${content}

Return the enhanced content in the same JSON format as the input, but improved.`
			);

			if (!result.content) {
				return ok({ enhancedContent: content });
			}

			return ok({ enhancedContent: result.content });
		} catch (error) {
			this.logger.error('AI content enhancement failed:', error);
			return ok({ enhancedContent: content });
		}
	}
}
