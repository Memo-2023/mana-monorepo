/**
 * BYOK initialization — wires the ByokBackend into the shared orchestrator
 * once the app is running and the vault is available.
 *
 * Called from (app)/+layout.svelte after manaStore.initialize() so the
 * user's master key is available for decrypting API keys on demand.
 */

import {
	llmOrchestrator,
	ByokBackend,
	BUILTIN_BYOK_PROVIDERS,
	estimateCost,
	type ByokKeyResolver,
	type ByokUsageCallback,
	type ResolvedByokKey,
	type ByokProviderId,
} from '@mana/shared-llm';
import { byokVault } from './vault';

let initialized = false;
let _currentKeyIdByProvider = new Map<ByokProviderId, string>();

/** Resolver callback: looks up the user's key for a given task. */
const resolver: ByokKeyResolver = async ({ taskName }) => {
	// For the probe call, just check if ANY key exists
	if (taskName === '__probe__') {
		const keys = await byokVault.listMeta();
		if (keys.length === 0) return null;
		const first = keys[0];
		const full = await byokVault.getForProvider(first.provider);
		if (!full) return null;
		_currentKeyIdByProvider.set(full.provider, full.id);
		return { provider: full.provider, apiKey: full.apiKey, model: full.model ?? '' };
	}

	// TODO: honor per-task provider overrides (e.g. "byok:anthropic")
	// For now, use the user's default provider from settings, or the
	// provider with the most-recently-used key.
	const allMeta = await byokVault.listMeta();
	if (allMeta.length === 0) return null;

	// Pick the provider with the most recent lastUsedAt, or the first one
	const sorted = [...allMeta].sort((a, b) =>
		(b.lastUsedAt ?? b.createdAt).localeCompare(a.lastUsedAt ?? a.createdAt)
	);
	const chosenProvider = sorted[0].provider;
	const key = await byokVault.getForProvider(chosenProvider);
	if (!key) return null;

	_currentKeyIdByProvider.set(key.provider, key.id);

	// Use the key's configured model, or fall back to the provider default
	const provider = BUILTIN_BYOK_PROVIDERS.find((p) => p.id === key.provider);
	const model = key.model || provider?.defaultModel || '';

	return { provider: key.provider, apiKey: key.apiKey, model };
};

/** Usage tracker: increments counters on the key that was used. */
const onUsage: ByokUsageCallback = ({ provider, model, promptTokens, completionTokens }) => {
	const keyId = _currentKeyIdByProvider.get(provider);
	if (!keyId) return;
	const totalTokens = promptTokens + completionTokens;
	const costUsd = estimateCost(model, promptTokens, completionTokens);
	void byokVault.recordUsage(keyId, totalTokens, costUsd);
};

export function initByok(): void {
	if (initialized) return;
	const backend = new ByokBackend({
		resolver,
		providers: BUILTIN_BYOK_PROVIDERS,
		onUsage,
	});
	llmOrchestrator.registerBackend(backend);
	initialized = true;
}
