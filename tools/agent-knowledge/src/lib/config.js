import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

/**
 * Load configuration from .knowledge/config.yaml and .env
 */
export async function loadConfig(cwd) {
	const config = {
		provider: 'openrouter',
		model: 'google/gemini-flash-1.5',
		models: {
			batch: { provider: 'openrouter', model: 'google/gemini-flash-1.5' },
			quality: { provider: 'openrouter', model: 'anthropic/claude-sonnet-4-20250514' },
			fallbacks: [],
		},
	};

	// Load from config.yaml
	const configPath = path.join(cwd, '.knowledge', 'config.yaml');
	if (await fs.pathExists(configPath)) {
		const yamlConfig = yaml.parse(await fs.readFile(configPath, 'utf-8'));
		Object.assign(config, yamlConfig);
	}

	// Load from .env
	const envPath = path.join(cwd, '.knowledge', '.env');
	if (await fs.pathExists(envPath)) {
		const envContent = await fs.readFile(envPath, 'utf-8');
		const envVars = parseEnv(envContent);

		if (envVars.OPENROUTER_API_KEY) {
			config.openrouterApiKey = envVars.OPENROUTER_API_KEY;
		}
		if (envVars.ANTHROPIC_API_KEY) {
			config.anthropicApiKey = envVars.ANTHROPIC_API_KEY;
		}
		if (envVars.LLM_PROVIDER) {
			config.provider = envVars.LLM_PROVIDER;
		}
		if (envVars.OPENROUTER_MODEL) {
			config.model = envVars.OPENROUTER_MODEL;
		}
		if (envVars.ANTHROPIC_MODEL) {
			config.model = envVars.ANTHROPIC_MODEL;
		}
	}

	// Also check process environment (takes precedence)
	if (process.env.OPENROUTER_API_KEY) {
		config.openrouterApiKey = process.env.OPENROUTER_API_KEY;
	}
	if (process.env.ANTHROPIC_API_KEY) {
		config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
	}
	if (process.env.LLM_PROVIDER) {
		config.provider = process.env.LLM_PROVIDER;
	}
	if (process.env.OPENROUTER_MODEL || process.env.ANTHROPIC_MODEL) {
		config.model = process.env.OPENROUTER_MODEL || process.env.ANTHROPIC_MODEL;
	}

	return config;
}

/**
 * Simple .env parser
 */
function parseEnv(content) {
	const vars = {};

	for (const line of content.split('\n')) {
		const trimmed = line.trim();

		// Skip comments and empty lines
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, eqIndex).trim();
		let value = trimmed.slice(eqIndex + 1).trim();

		// Remove quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		vars[key] = value;
	}

	return vars;
}

/**
 * Save configuration
 */
export async function saveConfig(cwd, config) {
	const configPath = path.join(cwd, '.knowledge', 'config.yaml');
	await fs.writeFile(configPath, yaml.stringify(config));
}
