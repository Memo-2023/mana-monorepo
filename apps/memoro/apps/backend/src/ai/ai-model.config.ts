/**
 * Zentrale AI-Modell-Konfiguration
 *
 * Alle Modelle, Endpoints und Presets an einer Stelle.
 * Modellwechsel = nur diese Datei ändern.
 */

export interface GeminiConfig {
	model: string;
	endpoint: string;
	temperature: number;
	maxOutputTokens: number;
}

export interface AzureOpenAIConfig {
	endpoint: string;
	deployment: string;
	apiVersion: string;
	temperature: number;
	maxTokens: number;
}

export interface GenerateOptions {
	temperature?: number;
	maxTokens?: number;
}

// ── Primary: Google Gemini ──
// Note: gemini-2.0-flash wird Juni 2026 deprecated → gemini-2.0-flash-001 ist stabil
export const GEMINI_DEFAULT: GeminiConfig = {
	model: 'gemini-2.0-flash-001',
	endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
	temperature: 0.7,
	maxOutputTokens: 8192,
};

// ── Fallback: Azure OpenAI ──
export const AZURE_DEFAULT: AzureOpenAIConfig = {
	endpoint: 'https://memoroseopenai.openai.azure.com',
	deployment: 'gpt-4.1-mini-se',
	apiVersion: '2025-01-01-preview',
	temperature: 0.7,
	maxTokens: 8192,
};

// ── Task-spezifische Presets ──
export const AI_PRESETS = {
	headline: { temperature: 0.7, maxTokens: 300 },
	memory: { temperature: 0.7, maxTokens: 8192 },
	translation: { temperature: 0.3, maxTokens: 8192 },
	selection: { temperature: 0.3, maxTokens: 2048 },
} as const;

export type AiPreset = keyof typeof AI_PRESETS;
