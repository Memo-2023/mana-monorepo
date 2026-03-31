/**
 * AI text generation with Gemini (primary) → Azure OpenAI (fallback).
 *
 * Mirrors the NestJS AiService without the DI framework.
 */

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash-001';
const GEMINI_DEFAULT_TEMPERATURE = 0.7;
const GEMINI_DEFAULT_MAX_TOKENS = 1024;

const AZURE_API_VERSION = '2024-02-01';
const AZURE_DEFAULT_TEMPERATURE = 0.7;
const AZURE_DEFAULT_MAX_TOKENS = 1024;

export interface GenerateOptions {
	temperature?: number;
	maxTokens?: number;
	systemInstruction?: string;
}

/**
 * Generate text using Gemini with Azure OpenAI as fallback.
 */
export async function generateText(prompt: string, options?: GenerateOptions): Promise<string> {
	const geminiKey = process.env.GEMINI_API_KEY;

	if (geminiKey) {
		const result = await callGemini(prompt, geminiKey, options);
		if (result !== null) return result;
		console.warn('[ai] Gemini failed, falling back to Azure OpenAI');
	} else {
		console.warn('[ai] No GEMINI_API_KEY, using Azure OpenAI directly');
	}

	const azureKey = process.env.AZURE_OPENAI_KEY;
	if (!azureKey) {
		throw new Error('No AI provider available: both GEMINI_API_KEY and AZURE_OPENAI_KEY are missing');
	}

	const result = await callAzure(prompt, azureKey, options);
	if (result !== null) return result;

	throw new Error('All AI providers failed');
}

async function callGemini(
	prompt: string,
	apiKey: string,
	options?: GenerateOptions
): Promise<string | null> {
	const temperature = options?.temperature ?? GEMINI_DEFAULT_TEMPERATURE;
	const maxOutputTokens = options?.maxTokens ?? GEMINI_DEFAULT_MAX_TOKENS;

	try {
		const url = `${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

		const body: Record<string, unknown> = {
			contents: [{ parts: [{ text: prompt }] }],
			generationConfig: { temperature, maxOutputTokens },
		};

		if (options?.systemInstruction) {
			body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
		}

		const start = Date.now();
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ai] Gemini API error (${response.status}): ${errorText}`);
			return null;
		}

		const data = (await response.json()) as {
			candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
		};
		const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
		console.debug(`[ai] Gemini responded in ${Date.now() - start}ms (${content.length} chars)`);
		return content || null;
	} catch (error) {
		console.error(`[ai] Gemini call failed: ${error instanceof Error ? error.message : error}`);
		return null;
	}
}

async function callAzure(
	prompt: string,
	apiKey: string,
	options?: GenerateOptions
): Promise<string | null> {
	const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
	const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4.1-mini-se';

	if (!endpoint) {
		console.error('[ai] AZURE_OPENAI_ENDPOINT not set');
		return null;
	}

	const temperature = options?.temperature ?? AZURE_DEFAULT_TEMPERATURE;
	const maxTokens = options?.maxTokens ?? AZURE_DEFAULT_MAX_TOKENS;

	try {
		const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${AZURE_API_VERSION}`;
		const start = Date.now();

		const messages: Array<{ role: string; content: string }> = [];
		if (options?.systemInstruction) {
			messages.push({ role: 'system', content: options.systemInstruction });
		}
		messages.push({ role: 'user', content: prompt });

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': apiKey,
			},
			body: JSON.stringify({ messages, max_tokens: maxTokens, temperature }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ai] Azure OpenAI error (${response.status}): ${errorText}`);
			return null;
		}

		const data = (await response.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const content = data.choices?.[0]?.message?.content?.trim() ?? '';
		console.debug(`[ai] Azure responded in ${Date.now() - start}ms (${content.length} chars)`);
		return content || null;
	} catch (error) {
		console.error(`[ai] Azure call failed: ${error instanceof Error ? error.message : error}`);
		return null;
	}
}
