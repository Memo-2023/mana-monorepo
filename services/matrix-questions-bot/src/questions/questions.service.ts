import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Question {
	id: string;
	title: string;
	description?: string;
	status: 'open' | 'researching' | 'answered' | 'archived';
	priority: 'low' | 'normal' | 'high' | 'urgent';
	tags: string[];
	category?: string;
	researchDepth: 'quick' | 'standard' | 'deep';
	collectionId?: string;
	createdAt: string;
	updatedAt: string;
	answeredAt?: string;
}

export interface Collection {
	id: string;
	name: string;
	description?: string;
	color: string;
	icon: string;
	isDefault: boolean;
	questionCount?: number;
	createdAt: string;
}

export interface ResearchResult {
	id: string;
	questionId: string;
	researchDepth: string;
	summary?: string;
	keyPoints?: string[];
	followUpQuestions?: string[];
	createdAt: string;
	durationMs?: number;
}

export interface Source {
	id: string;
	url: string;
	title: string;
	snippet?: string;
	domain: string;
	relevanceScore?: number;
	position: number;
	engine: string;
}

export interface Answer {
	id: string;
	questionId: string;
	content: string;
	contentMarkdown?: string;
	summary?: string;
	modelId: string;
	provider: string;
	confidence?: number;
	sourceCount?: number;
	rating?: number;
	isAccepted: boolean;
	createdAt: string;
}

@Injectable()
export class QuestionsService {
	private readonly logger = new Logger(QuestionsService.name);
	private backendUrl: string;
	private apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl = this.configService.get<string>('questions.backendUrl') || 'http://localhost:3011';
		this.apiPrefix = this.configService.get<string>('questions.apiPrefix') || '/api/v1';
	}

	private async request<T>(
		token: string,
		endpoint: string,
		options: RequestInit = {}
	): Promise<{ data?: T; error?: string }> {
		try {
			const url = `${this.backendUrl}${this.apiPrefix}${endpoint}`;
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error(`Request failed: ${endpoint}`, error);
			return { error: 'Verbindung zum Backend fehlgeschlagen' };
		}
	}

	// Question operations
	async getQuestions(
		token: string,
		options: { status?: string; search?: string; collectionId?: string } = {}
	): Promise<{ data?: Question[]; error?: string }> {
		const params = new URLSearchParams();
		if (options.status) params.set('status', options.status);
		if (options.search) params.set('search', options.search);
		if (options.collectionId) params.set('collectionId', options.collectionId);
		const query = params.toString() ? `?${params.toString()}` : '';
		return this.request<Question[]>(token, `/questions${query}`);
	}

	async getQuestion(token: string, questionId: string): Promise<{ data?: Question; error?: string }> {
		return this.request<Question>(token, `/questions/${questionId}`);
	}

	async createQuestion(
		token: string,
		title: string,
		options: { description?: string; priority?: string; tags?: string[]; collectionId?: string } = {}
	): Promise<{ data?: Question; error?: string }> {
		return this.request<Question>(token, '/questions', {
			method: 'POST',
			body: JSON.stringify({ title, ...options }),
		});
	}

	async updateQuestionStatus(
		token: string,
		questionId: string,
		status: string
	): Promise<{ data?: Question; error?: string }> {
		return this.request<Question>(token, `/questions/${questionId}/status`, {
			method: 'PUT',
			body: JSON.stringify({ status }),
		});
	}

	async deleteQuestion(token: string, questionId: string): Promise<{ error?: string }> {
		return this.request(token, `/questions/${questionId}`, { method: 'DELETE' });
	}

	// Research operations
	async startResearch(
		token: string,
		questionId: string,
		depth: 'quick' | 'standard' | 'deep' = 'quick'
	): Promise<{ data?: ResearchResult; error?: string }> {
		return this.request<ResearchResult>(token, '/research/start', {
			method: 'POST',
			body: JSON.stringify({ questionId, depth }),
		});
	}

	async getResearchResults(token: string, questionId: string): Promise<{ data?: ResearchResult[]; error?: string }> {
		return this.request<ResearchResult[]>(token, `/research/question/${questionId}`);
	}

	async getResearchResult(token: string, researchId: string): Promise<{ data?: ResearchResult; error?: string }> {
		return this.request<ResearchResult>(token, `/research/${researchId}`);
	}

	// Source operations
	async getSources(token: string, questionId: string): Promise<{ data?: Source[]; error?: string }> {
		return this.request<Source[]>(token, `/sources/question/${questionId}`);
	}

	// Answer operations
	async getAnswers(token: string, questionId: string): Promise<{ data?: Answer[]; error?: string }> {
		return this.request<Answer[]>(token, `/answers/question/${questionId}`);
	}

	async getAcceptedAnswer(token: string, questionId: string): Promise<{ data?: Answer; error?: string }> {
		return this.request<Answer>(token, `/answers/question/${questionId}/accepted`);
	}

	async rateAnswer(token: string, answerId: string, rating: number): Promise<{ data?: Answer; error?: string }> {
		return this.request<Answer>(token, `/answers/${answerId}/rate`, {
			method: 'POST',
			body: JSON.stringify({ rating }),
		});
	}

	async acceptAnswer(token: string, answerId: string): Promise<{ data?: Answer; error?: string }> {
		return this.request<Answer>(token, `/answers/${answerId}/accept`, { method: 'POST' });
	}

	// Collection operations
	async getCollections(token: string): Promise<{ data?: Collection[]; error?: string }> {
		return this.request<Collection[]>(token, '/collections');
	}

	async createCollection(
		token: string,
		name: string,
		options: { description?: string; color?: string } = {}
	): Promise<{ data?: Collection; error?: string }> {
		return this.request<Collection>(token, '/collections', {
			method: 'POST',
			body: JSON.stringify({ name, ...options }),
		});
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.backendUrl}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}
}
