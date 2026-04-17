import { z } from 'zod';

export const searchOptionsSchema = z.object({
	limit: z.number().int().min(1).max(50).optional(),
	language: z.string().optional(),
	categories: z.array(z.enum(['general', 'news', 'science', 'it'])).optional(),
	timeRange: z.enum(['day', 'week', 'month', 'year']).optional(),
	safeSearch: z.number().int().min(0).max(2).optional(),
});

export const extractOptionsSchema = z.object({
	maxLength: z.number().int().positive().optional(),
	includeHtml: z.boolean().optional(),
	includeMarkdown: z.boolean().optional(),
	timeoutMs: z.number().int().positive().optional(),
});

export const agentOptionsSchema = z.object({
	model: z.string().optional(),
	temperature: z.number().min(0).max(2).optional(),
	maxTokens: z.number().int().positive().optional(),
	systemPrompt: z.string().optional(),
});

export type SearchOptions = z.infer<typeof searchOptionsSchema>;
export type ExtractOptions = z.infer<typeof extractOptionsSchema>;
export type AgentOptions = z.infer<typeof agentOptionsSchema>;
