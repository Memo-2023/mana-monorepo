import chalk from 'chalk';

/**
 * Unified LLM client supporting multiple providers
 */
export class LLMClient {
	constructor(config) {
		this.config = config;
		this.provider = config.provider || 'openrouter';
	}

	/**
	 * Complete a prompt using the configured provider
	 */
	async complete(prompt, options = {}) {
		const provider = options.provider || this.provider;

		try {
			if (provider === 'anthropic') {
				return await this.callAnthropic(prompt, options);
			} else if (provider === 'openrouter') {
				return await this.callOpenRouter(prompt, options);
			}
			throw new Error(`Unknown provider: ${provider}`);
		} catch (error) {
			console.error(chalk.yellow(`⚠ ${provider} failed: ${error.message}`));

			// Try fallbacks if available
			if (options.allowFallback !== false && this.config.models?.fallbacks) {
				return await this.tryFallbacks(prompt, options);
			}
			throw error;
		}
	}

	/**
	 * Call Anthropic API directly
	 */
	async callAnthropic(prompt, options = {}) {
		const apiKey = this.config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

		if (!apiKey) {
			throw new Error('ANTHROPIC_API_KEY not configured');
		}

		const model = options.model || this.config.model || 'claude-sonnet-4-20250514';

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: model,
				max_tokens: options.maxTokens || 2000,
				messages: [{ role: 'user', content: prompt }],
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Anthropic API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		return data.content[0].text;
	}

	/**
	 * Call OpenRouter API
	 */
	async callOpenRouter(prompt, options = {}) {
		const apiKey = this.config.openrouterApiKey || process.env.OPENROUTER_API_KEY;

		if (!apiKey) {
			throw new Error('OPENROUTER_API_KEY not configured');
		}

		const model = options.model || this.config.model || 'google/gemini-flash-1.5';

		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://github.com/agent-knowledge',
				'X-Title': 'Agent Knowledge System',
			},
			body: JSON.stringify({
				model: model,
				messages: [{ role: 'user', content: prompt }],
				max_tokens: options.maxTokens || 2000,
				temperature: options.temperature || 0.3,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
		}

		const data = await response.json();

		if (!data.choices || !data.choices[0]) {
			throw new Error('Invalid response from OpenRouter');
		}

		return data.choices[0].message.content;
	}

	/**
	 * Try fallback providers/models
	 */
	async tryFallbacks(prompt, options) {
		const fallbacks = this.config.models?.fallbacks || [];

		for (const fallback of fallbacks) {
			try {
				console.log(chalk.gray(`  Trying fallback: ${fallback.provider}/${fallback.model}`));

				return await this.complete(prompt, {
					...options,
					provider: fallback.provider,
					model: fallback.model,
					allowFallback: false, // Don't recurse
				});
			} catch (error) {
				console.error(chalk.gray(`  Fallback failed: ${error.message}`));
				continue;
			}
		}

		throw new Error('All providers and fallbacks failed');
	}

	/**
	 * Get available models for a provider
	 */
	static getAvailableModels(provider) {
		if (provider === 'openrouter') {
			return [
				{ id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', cost: '$0.075/1M' },
				{ id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', cost: '$0.14/1M' },
				{ id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', cost: '$0.25/1M' },
				{ id: 'mistralai/mistral-small', name: 'Mistral Small', cost: '$0.20/1M' },
				{ id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet', cost: '$3/1M' },
				{ id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', cost: '$0.15/1M' },
			];
		} else if (provider === 'anthropic') {
			return [
				{ id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', cost: '$0.25/1M' },
				{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet', cost: '$3/1M' },
				{ id: 'claude-opus-4-20250514', name: 'Claude Opus', cost: '$15/1M' },
			];
		}
		return [];
	}
}
