import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

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

export interface DeckGenerationResult {
  success: boolean;
  cards: GeneratedCard[];
  metadata: {
    model: string;
    tokensUsed?: number;
    generationTime: number;
  };
  error?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ai: GoogleGenAI | null;
  private readonly model = 'gemini-2.0-flash';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_GENAI_API_KEY');

    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.logger.log('Google Gemini AI initialized successfully');
    } else {
      this.ai = null;
      this.logger.warn('Google Gemini API key not configured - AI features disabled');
    }
  }

  isAvailable(): boolean {
    return this.ai !== null;
  }

  async generateDeck(request: DeckGenerationRequest): Promise<DeckGenerationResult> {
    const startTime = Date.now();

    if (!this.ai) {
      return {
        success: false,
        cards: [],
        metadata: { model: this.model, generationTime: 0 },
        error: 'AI service not configured. Please set GOOGLE_GENAI_API_KEY.',
      };
    }

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
      const userPrompt = this.buildUserPrompt(prompt, deckTitle, deckDescription, cardCount, cardTypes);

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: this.buildResponseSchema(cardTypes),
        },
      });

      const generationTime = Date.now() - startTime;
      const responseText = response.text?.trim();

      if (!responseText) {
        return {
          success: false,
          cards: [],
          metadata: { model: this.model, generationTime },
          error: 'Empty response from AI',
        };
      }

      const parsed = JSON.parse(responseText);
      const cards: GeneratedCard[] = parsed.cards || [];

      this.logger.log(`Generated ${cards.length} cards in ${generationTime}ms`);

      return {
        success: true,
        cards,
        metadata: {
          model: this.model,
          tokensUsed: response.usageMetadata?.totalTokenCount,
          generationTime,
        },
      };
    } catch (error) {
      const generationTime = Date.now() - startTime;
      this.logger.error('AI deck generation failed:', error);

      return {
        success: false,
        cards: [],
        metadata: { model: this.model, generationTime },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private buildSystemPrompt(cardTypes: CardType[], difficulty: string, language: string): string {
    const cardTypeDescriptions = {
      text: 'Text cards contain informational content or explanations.',
      flashcard: 'Flashcards have a front (question/term) and back (answer/definition), optionally with a hint.',
      quiz: 'Quiz cards have a question, 4 options (A-D), correct answer index (0-3), and an explanation.',
      mixed: 'Mixed cards combine multiple content types.',
    };

    const enabledTypes = cardTypes.map(t => `- ${t}: ${cardTypeDescriptions[t]}`).join('\n');

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
7. Progress from easier to harder cards when possible`;
  }

  private buildUserPrompt(
    prompt: string,
    deckTitle: string,
    deckDescription?: string,
    cardCount: number = 10,
    cardTypes: CardType[] = ['flashcard', 'quiz'],
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
Ensure variety in the questions and good coverage of the subject matter.`;
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

  private buildResponseSchema(cardTypes: CardType[]): any {
    const cardSchemas: any[] = [];

    if (cardTypes.includes('flashcard')) {
      cardSchemas.push({
        type: Type.OBJECT,
        properties: {
          cardType: { type: Type.STRING, enum: ['flashcard'] },
          title: { type: Type.STRING },
          content: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              hint: { type: Type.STRING },
            },
            required: ['front', 'back'],
          },
        },
        required: ['cardType', 'content'],
      });
    }

    if (cardTypes.includes('quiz')) {
      cardSchemas.push({
        type: Type.OBJECT,
        properties: {
          cardType: { type: Type.STRING, enum: ['quiz'] },
          title: { type: Type.STRING },
          content: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctAnswer'],
          },
        },
        required: ['cardType', 'content'],
      });
    }

    if (cardTypes.includes('text')) {
      cardSchemas.push({
        type: Type.OBJECT,
        properties: {
          cardType: { type: Type.STRING, enum: ['text'] },
          title: { type: Type.STRING },
          content: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
            },
            required: ['text'],
          },
        },
        required: ['cardType', 'content'],
      });
    }

    return {
      type: Type.OBJECT,
      properties: {
        cards: {
          type: Type.ARRAY,
          items: cardSchemas.length === 1 ? cardSchemas[0] : { anyOf: cardSchemas },
        },
      },
      required: ['cards'],
    };
  }
}
