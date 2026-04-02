import { getEngine } from './engine.js';

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface GenerateOptions {
	messages: ChatMessage[];
	temperature?: number;
	maxTokens?: number;
	onToken?: (token: string) => void;
}

export interface GenerateResult {
	content: string;
	latencyMs: number;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
	};
}

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
	const engine = getEngine();
	if (!engine) throw new Error('No model loaded. Call loadLocalLlm() first.');

	const { messages, temperature = 0.7, maxTokens = 1024, onToken } = options;
	const start = performance.now();

	const reply = await engine.chat.completions.create({
		messages,
		temperature,
		max_tokens: maxTokens,
		stream: !!onToken,
		stream_options: onToken ? { include_usage: true } : undefined,
	});

	let content = '';
	let promptTokens = 0;
	let completionTokens = 0;

	if (Symbol.asyncIterator in Object(reply)) {
		for await (const chunk of reply as AsyncIterable<any>) {
			const delta = chunk.choices?.[0]?.delta?.content;
			if (delta) {
				content += delta;
				onToken?.(delta);
			}
			if (chunk.usage) {
				promptTokens = chunk.usage.prompt_tokens ?? 0;
				completionTokens = chunk.usage.completion_tokens ?? 0;
			}
		}
	} else {
		const completion = reply as any;
		content = completion.choices?.[0]?.message?.content ?? '';
		promptTokens = completion.usage?.prompt_tokens ?? 0;
		completionTokens = completion.usage?.completion_tokens ?? 0;
	}

	const latencyMs = Math.round(performance.now() - start);

	return {
		content,
		latencyMs,
		usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens },
	};
}

export async function extractJson(text: string, instruction: string): Promise<unknown> {
	const result = await generate({
		messages: [
			{
				role: 'system',
				content:
					'You are a JSON extraction assistant. Respond ONLY with valid JSON, no explanation or markdown.',
			},
			{
				role: 'user',
				content: `${instruction}\n\nText:\n${text}`,
			},
		],
		temperature: 0.1,
		maxTokens: 2048,
	});

	const jsonMatch = result.content.match(/[[{][\s\S]*[}\]]/);
	if (!jsonMatch) throw new Error('No JSON found in response');
	return JSON.parse(jsonMatch[0]);
}

export async function classify(text: string, categories: string[]): Promise<string> {
	const result = await generate({
		messages: [
			{
				role: 'system',
				content: `You are a text classifier. Classify the text into exactly one of these categories: ${categories.join(', ')}. Respond with ONLY the category name, nothing else.`,
			},
			{
				role: 'user',
				content: text,
			},
		],
		temperature: 0.1,
		maxTokens: 50,
	});

	const response = result.content.trim().toLowerCase();
	const match = categories.find((c) => response.includes(c.toLowerCase()));
	return match ?? result.content.trim();
}
