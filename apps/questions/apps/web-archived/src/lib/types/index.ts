export interface Collection {
	id: string;
	userId: string;
	name: string;
	description?: string;
	color: string;
	icon: string;
	isDefault: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	questionCount?: number;
}

export interface Question {
	id: string;
	userId: string;
	collectionId?: string;
	title: string;
	description?: string;
	status: QuestionStatus;
	priority: QuestionPriority;
	tags: string[];
	researchDepth: ResearchDepth;
	createdAt: string;
	updatedAt: string;
}

export type QuestionStatus = 'open' | 'researching' | 'answered' | 'archived';
export type QuestionPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ResearchDepth = 'quick' | 'standard' | 'deep';

export interface ResearchResult {
	id: string;
	questionId: string;
	modelId: string;
	provider: string;
	researchDepth: ResearchDepth;
	summary: string;
	keyPoints: string[];
	followUpQuestions: string[];
	promptTokens?: number;
	completionTokens?: number;
	estimatedCost?: number;
	createdAt: string;
	durationMs?: number;
	sources?: Source[];
}

export interface Source {
	id: string;
	researchResultId: string;
	url: string;
	title: string;
	snippet?: string;
	domain?: string;
	extractedContent?: string;
	contentMarkdown?: string;
	wordCount?: number;
	readingTime?: number;
	relevanceScore?: number;
	position: number;
	engine?: string;
	author?: string;
	publishedDate?: string;
	siteName?: string;
	createdAt: string;
}

export interface Answer {
	id: string;
	questionId: string;
	researchResultId?: string;
	content: string;
	contentMarkdown?: string;
	summary?: string;
	modelId: string;
	provider: string;
	promptTokens?: number;
	completionTokens?: number;
	estimatedCost?: number;
	confidence?: number;
	sourceCount?: number;
	citations: Citation[];
	rating?: number;
	feedback?: string;
	isAccepted: boolean;
	version: number;
	createdAt: string;
	updatedAt: string;
	durationMs?: number;
}

export interface Citation {
	sourceId: string;
	text: string;
	position: number;
}

export interface CreateQuestionDto {
	title: string;
	description?: string;
	collectionId?: string;
	tags?: string[];
	priority?: QuestionPriority;
	researchDepth?: ResearchDepth;
}

export interface UpdateQuestionDto {
	title?: string;
	description?: string;
	collectionId?: string;
	tags?: string[];
	priority?: QuestionPriority;
	status?: QuestionStatus;
	researchDepth?: ResearchDepth;
}

export interface CreateCollectionDto {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	isDefault?: boolean;
}

export interface UpdateCollectionDto {
	name?: string;
	description?: string;
	color?: string;
	icon?: string;
	isDefault?: boolean;
	sortOrder?: number;
}

export interface StartResearchDto {
	questionId: string;
	depth?: ResearchDepth;
	categories?: string[];
	engines?: string[];
	language?: string;
	maxSources?: number;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
}
