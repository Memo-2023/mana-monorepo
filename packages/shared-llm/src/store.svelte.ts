/**
 * Svelte 5 reactive store for the LLM orchestrator.
 *
 * Lives at module-scope as a singleton because there is exactly one
 * orchestrator + settings per page session. Settings are persisted to
 * localStorage for now (Phase 1) — Phase 2 will move them into the
 * encrypted IndexedDB settings table once that exists.
 *
 * Usage in a Svelte 5 component:
 *
 *   import { llmOrchestrator, llmSettingsState, useTaskAvailability } from '@mana/shared-llm';
 *   import { extractDateTask } from '$lib/llm-tasks/extract-date';
 *
 *   const available = useTaskAvailability(extractDateTask);
 *   // ... reactively true/false based on settings + backend readiness
 *
 *   {#if available.current}
 *     <button onclick={() => orchestrator.run(extractDateTask, text)}>...</button>
 *   {/if}
 */

import { BrowserBackend } from './backends/browser';
import { CloudBackend } from './backends/cloud';
import { ManaServerBackend } from './backends/mana-server';
import { LlmOrchestrator } from './orchestrator';
import type { LlmTask } from './task';
import { DEFAULT_LLM_SETTINGS, type LlmSettings } from './types';

const STORAGE_KEY = 'mana.llm.settings.v1';

/** Load persisted settings, falling back to defaults on first run or
 *  any parse error. localStorage is fine for Phase 1 — small payload,
 *  not encrypted-sensitive (the user's tier preference is hardly
 *  secret), and trivial to migrate to IndexedDB later. */
function loadSettings(): LlmSettings {
	if (typeof localStorage === 'undefined') return { ...DEFAULT_LLM_SETTINGS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULT_LLM_SETTINGS };
		const parsed = JSON.parse(raw) as Partial<LlmSettings>;
		return { ...DEFAULT_LLM_SETTINGS, ...parsed };
	} catch {
		return { ...DEFAULT_LLM_SETTINGS };
	}
}

function persistSettings(settings: LlmSettings): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Quota exceeded or storage disabled — non-fatal, settings just
		// won't persist across sessions.
	}
}

// ─── Reactive state ──────────────────────────────────────────────

const initialSettings = loadSettings();
let _settings = $state<LlmSettings>(initialSettings);

// Backends are constructed once per page session. They're stateless
// (or hold their own internal state in the case of BrowserBackend
// pointing at @mana/local-llm's singleton), so a fresh instance per
// orchestrator is fine.
const backends = [new BrowserBackend(), new ManaServerBackend(), new CloudBackend()];

export const llmOrchestrator = new LlmOrchestrator({
	settings: initialSettings,
	backends,
});

/** Reactive accessor for the current settings. UI components read
 *  via `llmSettingsState.current` to get a $state-tracked snapshot. */
export const llmSettingsState = {
	get current(): LlmSettings {
		return _settings;
	},
};

/** Update settings (or part of them). Persists to localStorage and
 *  pushes the new value into the orchestrator. */
export function updateLlmSettings(patch: Partial<LlmSettings>): void {
	_settings = { ..._settings, ...patch };
	persistSettings(_settings);
	llmOrchestrator.updateSettings(_settings);
}

/**
 * Svelte 5 reactive hook: returns `{ current: boolean }` indicating
 * whether the given task can run with the user's current settings.
 * Reactive against `llmSettingsState` so the UI re-renders when the
 * user toggles a tier in the settings page.
 *
 * Use this to gate feature buttons — show them as enabled when the
 * task is runnable, disabled (with a tooltip) when not.
 */
export function useTaskAvailability<TIn, TOut>(
	task: LlmTask<TIn, TOut>
): { readonly current: boolean } {
	return {
		get current() {
			// Reading _settings here registers the reactive dependency
			void _settings;
			return llmOrchestrator.canRun(task);
		},
	};
}
