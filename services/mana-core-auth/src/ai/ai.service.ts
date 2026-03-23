import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FeedbackAnalysis {
	title: string;
	category: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
}

@Injectable()
export class AiService {
	private readonly logger = new Logger(AiService.name);
	private readonly manaLlmUrl: string | null = null;

	constructor(private configService: ConfigService) {
		const url = this.configService.get<string>('MANA_LLM_URL');
		if (url) {
			this.manaLlmUrl = url;
			this.logger.log(`AI service using mana-llm at ${url}`);
		} else {
			this.logger.warn('MANA_LLM_URL not configured - AI features disabled');
		}
	}

	async analyzeFeedback(feedbackText: string): Promise<FeedbackAnalysis> {
		// Fallback if AI not available
		if (!this.manaLlmUrl) {
			return this.fallbackAnalysis(feedbackText);
		}

		try {
			const prompt = `Analysiere dieses User-Feedback und generiere:
1. Einen kurzen, prägnanten deutschen Titel (max 60 Zeichen) der den Kern des Feedbacks zusammenfasst
2. Eine passende Kategorie aus: bug, feature, improvement, question, other

Feedback: "${feedbackText}"

Antworte NUR mit validem JSON in diesem Format (keine Markdown-Codeblocks, kein anderer Text):
{"title": "...", "category": "..."}`;

			const result = await fetch(`${this.manaLlmUrl}/v1/chat/completions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'ollama/gemma3:4b',
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.3,
				}),
				signal: AbortSignal.timeout(30000),
			});

			if (!result.ok) {
				throw new Error(`mana-llm error: ${result.status}`);
			}

			const data = await result.json();
			const response = (data.choices?.[0]?.message?.content || '').trim();

			// Parse JSON response - handle potential markdown code blocks
			let jsonStr = response;
			if (response.includes('```')) {
				const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
				if (match) {
					jsonStr = match[1].trim();
				}
			}

			const parsed = JSON.parse(jsonStr) as FeedbackAnalysis;

			// Validate category
			const validCategories = ['bug', 'feature', 'improvement', 'question', 'other'];
			if (!validCategories.includes(parsed.category)) {
				parsed.category = 'other';
			}

			// Ensure title is not too long
			if (parsed.title.length > 60) {
				parsed.title = parsed.title.substring(0, 57) + '...';
			}

			this.logger.debug(`AI analyzed feedback: ${JSON.stringify(parsed)}`);
			return parsed;
		} catch (error) {
			this.logger.error(`AI analysis failed: ${error}`);
			return this.fallbackAnalysis(feedbackText);
		}
	}

	private fallbackAnalysis(feedbackText: string): FeedbackAnalysis {
		// Simple fallback: use first 60 chars as title, default category
		const title = feedbackText.length > 60 ? feedbackText.substring(0, 57) + '...' : feedbackText;

		// Simple keyword-based category detection
		const lowerText = feedbackText.toLowerCase();
		let category: FeedbackAnalysis['category'] = 'feature';

		if (
			lowerText.includes('bug') ||
			lowerText.includes('fehler') ||
			lowerText.includes('kaputt') ||
			lowerText.includes('funktioniert nicht')
		) {
			category = 'bug';
		} else if (
			lowerText.includes('?') ||
			lowerText.includes('frage') ||
			lowerText.includes('wie')
		) {
			category = 'question';
		} else if (
			lowerText.includes('besser') ||
			lowerText.includes('verbessern') ||
			lowerText.includes('optimieren')
		) {
			category = 'improvement';
		}

		return { title, category };
	}
}
