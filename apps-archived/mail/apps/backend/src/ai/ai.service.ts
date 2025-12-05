import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { emails, type Email } from '../db/schema';

export interface SummaryResult {
	summary: string;
	keyPoints?: string[];
}

export interface SmartReplyResult {
	replies: {
		text: string;
		tone: 'positive' | 'neutral' | 'declining';
	}[];
}

export interface CategoryResult {
	category: 'work' | 'personal' | 'newsletter' | 'transactional' | 'promotional' | 'social';
	confidence: number;
	priority: 'high' | 'medium' | 'low';
}

@Injectable()
export class AIService {
	private readonly logger = new Logger(AIService.name);
	private readonly geminiClient: GoogleGenerativeAI | null = null;
	private readonly modelName = 'gemini-1.5-flash';

	constructor(
		private configService: ConfigService,
		@Inject(DATABASE_CONNECTION) private db: Database
	) {
		const apiKey = this.configService.get<string>('GOOGLE_GENAI_API_KEY');
		if (apiKey) {
			this.geminiClient = new GoogleGenerativeAI(apiKey);
			this.logger.log('Google Gemini client initialized for AI features');
		} else {
			this.logger.warn('GOOGLE_GENAI_API_KEY is not set - AI features unavailable');
		}
	}

	async summarizeEmail(emailId: string, userId: string): Promise<SummaryResult> {
		const email = await this.getEmail(emailId, userId);

		if (!this.geminiClient) {
			throw new Error('AI service not configured');
		}

		const content = email.bodyPlain || email.bodyHtml || email.snippet || '';
		if (!content) {
			return { summary: 'Email has no content to summarize.' };
		}

		const model = this.geminiClient.getGenerativeModel({ model: this.modelName });

		const prompt = `Summarize this email in 1-2 sentences. Focus on the main purpose and any action items.

Subject: ${email.subject || '(No Subject)'}
From: ${email.fromName || email.fromAddress}

Content:
${content.substring(0, 5000)}

Respond with a JSON object:
{
  "summary": "Brief summary here",
  "keyPoints": ["Key point 1", "Key point 2"]
}`;

		try {
			const result = await model.generateContent(prompt);
			const response = result.response.text();

			// Parse JSON response
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);

				// Update email with summary
				await this.db
					.update(emails)
					.set({
						aiSummary: parsed.summary,
						updatedAt: new Date(),
					})
					.where(eq(emails.id, emailId));

				return {
					summary: parsed.summary,
					keyPoints: parsed.keyPoints,
				};
			}

			return { summary: response.trim() };
		} catch (error) {
			this.logger.error('Failed to summarize email:', error);
			throw new Error('Failed to generate summary');
		}
	}

	async suggestReplies(emailId: string, userId: string): Promise<SmartReplyResult> {
		const email = await this.getEmail(emailId, userId);

		if (!this.geminiClient) {
			throw new Error('AI service not configured');
		}

		const content = email.bodyPlain || email.bodyHtml || email.snippet || '';
		if (!content) {
			return { replies: [] };
		}

		const model = this.geminiClient.getGenerativeModel({ model: this.modelName });

		const prompt = `Generate 3 short reply suggestions for this email. Make them varied in tone: one positive/accepting, one neutral/informative, and one politely declining.

Subject: ${email.subject || '(No Subject)'}
From: ${email.fromName || email.fromAddress}

Content:
${content.substring(0, 3000)}

Respond with a JSON object:
{
  "replies": [
    { "text": "Reply text here", "tone": "positive" },
    { "text": "Reply text here", "tone": "neutral" },
    { "text": "Reply text here", "tone": "declining" }
  ]
}

Keep replies brief (1-3 sentences each).`;

		try {
			const result = await model.generateContent(prompt);
			const response = result.response.text();

			// Parse JSON response
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);

				// Update email with suggested replies
				await this.db
					.update(emails)
					.set({
						aiSuggestedReplies: parsed.replies,
						updatedAt: new Date(),
					})
					.where(eq(emails.id, emailId));

				return {
					replies: parsed.replies,
				};
			}

			return { replies: [] };
		} catch (error) {
			this.logger.error('Failed to generate reply suggestions:', error);
			throw new Error('Failed to generate reply suggestions');
		}
	}

	async categorizeEmail(emailId: string, userId: string): Promise<CategoryResult> {
		const email = await this.getEmail(emailId, userId);

		if (!this.geminiClient) {
			throw new Error('AI service not configured');
		}

		const content = email.bodyPlain || email.bodyHtml || email.snippet || '';

		const model = this.geminiClient.getGenerativeModel({ model: this.modelName });

		const prompt = `Categorize this email and determine its priority.

Subject: ${email.subject || '(No Subject)'}
From: ${email.fromName || ''} <${email.fromAddress}>
Snippet: ${email.snippet || content.substring(0, 500)}

Categories:
- work: Work-related emails (meetings, projects, colleagues)
- personal: Personal communications (friends, family)
- newsletter: Newsletters, subscriptions, updates
- transactional: Receipts, confirmations, shipping, billing
- promotional: Marketing, sales, offers
- social: Social network notifications

Priority:
- high: Urgent, requires immediate attention
- medium: Important but not urgent
- low: Informational, can wait

Respond with a JSON object:
{
  "category": "work",
  "confidence": 0.95,
  "priority": "high"
}`;

		try {
			const result = await model.generateContent(prompt);
			const response = result.response.text();

			// Parse JSON response
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);

				// Update email with category
				await this.db
					.update(emails)
					.set({
						aiCategory: parsed.category,
						aiPriority: parsed.priority,
						updatedAt: new Date(),
					})
					.where(eq(emails.id, emailId));

				return {
					category: parsed.category,
					confidence: parsed.confidence,
					priority: parsed.priority,
				};
			}

			// Default fallback
			return {
				category: 'personal',
				confidence: 0.5,
				priority: 'medium',
			};
		} catch (error) {
			this.logger.error('Failed to categorize email:', error);
			throw new Error('Failed to categorize email');
		}
	}

	async autoCategorizeNewEmails(userId: string, emailIds: string[]): Promise<void> {
		if (!this.geminiClient) {
			this.logger.warn('AI service not configured, skipping auto-categorization');
			return;
		}

		for (const emailId of emailIds) {
			try {
				await this.categorizeEmail(emailId, userId);
			} catch (error) {
				this.logger.error(`Failed to auto-categorize email ${emailId}:`, error);
			}
		}
	}

	private async getEmail(emailId: string, userId: string): Promise<Email> {
		const [email] = await this.db
			.select()
			.from(emails)
			.where(and(eq(emails.id, emailId), eq(emails.userId, userId)));

		if (!email) {
			throw new NotFoundException('Email not found');
		}

		return email;
	}
}
