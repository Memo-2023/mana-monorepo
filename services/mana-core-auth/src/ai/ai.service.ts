import { Injectable, Logger } from '@nestjs/common';
import { LlmClientService } from '@manacore/shared-llm';

export interface FeedbackAnalysis {
	title: string;
	category: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
}

const VALID_CATEGORIES = ['bug', 'feature', 'improvement', 'question', 'other'] as const;

@Injectable()
export class AiService {
	private readonly logger = new Logger(AiService.name);

	constructor(private readonly llm: LlmClientService) {}

	async analyzeFeedback(feedbackText: string): Promise<FeedbackAnalysis> {
		try {
			const prompt = `Analysiere dieses User-Feedback und generiere:
1. Einen kurzen, prägnanten deutschen Titel (max 60 Zeichen) der den Kern des Feedbacks zusammenfasst
2. Eine passende Kategorie aus: bug, feature, improvement, question, other

Feedback: "${feedbackText}"

Antworte NUR mit validem JSON in diesem Format (keine Markdown-Codeblocks, kein anderer Text):
{"title": "...", "category": "..."}`;

			const { data } = await this.llm.json<FeedbackAnalysis>(prompt, {
				temperature: 0.3,
				timeout: 30_000,
				validate: (raw) => {
					const obj = raw as FeedbackAnalysis;
					if (!obj.title || !obj.category) throw new Error('missing fields');
					if (!VALID_CATEGORIES.includes(obj.category as any)) {
						obj.category = 'other';
					}
					if (obj.title.length > 60) {
						obj.title = obj.title.substring(0, 57) + '...';
					}
					return obj;
				},
			});

			this.logger.debug(`AI analyzed feedback: ${JSON.stringify(data)}`);
			return data;
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
