/**
 * AI text generation with mana-llm (primary) → Gemini → Azure OpenAI (fallbacks).
 *
 * Fallback chain:
 *   1. mana-llm (self-hosted, OpenAI-compatible API on port 3025)
 *   2. Gemini (Google Cloud)
 *   3. Azure OpenAI (Microsoft Cloud)
 */

// Self-hosted mana-llm service. Use the `mana/<class>` alias system —
// see packages/shared-ai/src/llm-aliases.ts and
// services/mana-llm/aliases.yaml for the SSOT and the resolution chain.
// (memoro-server doesn't pull @mana/shared-ai as a workspace dep yet,
// so the alias string is inlined here. If memoro adds more LLM call
// sites, fold this into a workspace import.)
const MANA_LLM_URL = process.env.MANA_LLM_URL || '';
const MANA_LLM_MODEL = process.env.MANA_LLM_MODEL || 'mana/fast-text';

// Gemini (cloud fallback)
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash-001';

// Azure OpenAI (cloud fallback)
const AZURE_API_VERSION = '2024-02-01';

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;

export interface GenerateOptions {
	temperature?: number;
	maxTokens?: number;
	systemInstruction?: string;
}

/**
 * Generate text using mana-llm → Gemini → Azure OpenAI fallback chain.
 */
export async function generateText(prompt: string, options?: GenerateOptions): Promise<string> {
	// Attempt 1: Self-hosted mana-llm
	if (MANA_LLM_URL) {
		const result = await callManaLLM(prompt, options);
		if (result !== null) return result;
		console.warn('[ai] mana-llm failed, falling back to Gemini');
	}

	// Attempt 2: Gemini
	const geminiKey = process.env.GEMINI_API_KEY;
	if (geminiKey) {
		const result = await callGemini(prompt, geminiKey, options);
		if (result !== null) return result;
		console.warn('[ai] Gemini failed, falling back to Azure OpenAI');
	}

	// Attempt 3: Azure OpenAI
	const azureKey = process.env.AZURE_OPENAI_KEY;
	if (azureKey) {
		const result = await callAzure(prompt, azureKey, options);
		if (result !== null) return result;
	}

	throw new Error('All AI providers failed (mana-llm, Gemini, Azure OpenAI)');
}

/**
 * Call self-hosted mana-llm service (OpenAI-compatible API).
 */
async function callManaLLM(prompt: string, options?: GenerateOptions): Promise<string | null> {
	const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
	const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;

	try {
		const url = `${MANA_LLM_URL}/v1/chat/completions`;
		const start = Date.now();

		const messages: Array<{ role: string; content: string }> = [];
		if (options?.systemInstruction) {
			messages.push({ role: 'system', content: options.systemInstruction });
		}
		messages.push({ role: 'user', content: prompt });

		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: MANA_LLM_MODEL,
				messages,
				temperature,
				max_tokens: maxTokens,
				stream: false,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ai] mana-llm error (${response.status}): ${errorText}`);
			return null;
		}

		const data = (await response.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const content = data.choices?.[0]?.message?.content?.trim() ?? '';
		console.debug(`[ai] mana-llm responded in ${Date.now() - start}ms (${content.length} chars)`);
		return content || null;
	} catch (error) {
		console.error(`[ai] mana-llm call failed: ${error instanceof Error ? error.message : error}`);
		return null;
	}
}

async function callGemini(
	prompt: string,
	apiKey: string,
	options?: GenerateOptions
): Promise<string | null> {
	const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
	const maxOutputTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;

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

	const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
	const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;

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
