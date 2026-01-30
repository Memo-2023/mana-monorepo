import type { Settings } from '$lib/types';
import { browser } from '$app/environment';

const STORAGE_KEY = 'llm-playground-settings';

const defaultSettings: Settings = {
	model: 'ollama/llama3.2:3b',
	temperature: 0.7,
	maxTokens: 2048,
	topP: 1.0,
	systemPrompt: 'You are a helpful AI assistant.',
};

function loadSettings(): Settings {
	if (!browser) return defaultSettings;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return { ...defaultSettings, ...JSON.parse(stored) };
		}
	} catch {
		// Ignore parse errors
	}
	return defaultSettings;
}

function saveSettings(settings: Settings): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function createSettingsStore() {
	let settings = $state<Settings>(loadSettings());

	return {
		get model() {
			return settings.model;
		},
		set model(value: string) {
			settings.model = value;
			saveSettings(settings);
		},

		get temperature() {
			return settings.temperature;
		},
		set temperature(value: number) {
			settings.temperature = value;
			saveSettings(settings);
		},

		get maxTokens() {
			return settings.maxTokens;
		},
		set maxTokens(value: number) {
			settings.maxTokens = value;
			saveSettings(settings);
		},

		get topP() {
			return settings.topP;
		},
		set topP(value: number) {
			settings.topP = value;
			saveSettings(settings);
		},

		get systemPrompt() {
			return settings.systemPrompt;
		},
		set systemPrompt(value: string) {
			settings.systemPrompt = value;
			saveSettings(settings);
		},

		reset() {
			settings = { ...defaultSettings };
			saveSettings(settings);
		},
	};
}

export const settingsStore = createSettingsStore();
