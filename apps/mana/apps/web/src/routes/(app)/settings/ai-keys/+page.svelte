<!--
  AI Keys Settings — user-facing CRUD for BYOK provider keys.

  Keys are encrypted at rest via the user's master key. Without an
  unlocked vault, this page will show an error and prompt login.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, Trash, Key, PencilSimple, Check, X } from '@mana/shared-icons';
	import { BUILTIN_BYOK_PROVIDERS, formatCost, type ByokProviderId } from '@mana/shared-llm';
	import { byokVault } from '$lib/byok';
	import { isVaultUnlocked } from '$lib/data/crypto/key-provider';
	import type { ByokKeyPlain } from '$lib/byok/types';

	let keys = $state<Omit<ByokKeyPlain, 'apiKey'>[]>([]);
	let loading = $state(true);
	let vaultLocked = $state(false);

	let showAdd = $state(false);
	let addProvider = $state<ByokProviderId>('openai');
	let addLabel = $state('');
	let addApiKey = $state('');
	let addModel = $state('');
	let addIsDefault = $state(true);
	let addError = $state<string | null>(null);
	let saving = $state(false);

	let editingId = $state<string | null>(null);
	let editLabel = $state('');
	let editModel = $state('');

	async function reload() {
		if (!isVaultUnlocked()) {
			vaultLocked = true;
			keys = [];
			loading = false;
			return;
		}
		vaultLocked = false;
		keys = await byokVault.listMeta();
		loading = false;
	}

	onMount(reload);

	async function handleAdd() {
		addError = null;
		if (!addLabel.trim() || !addApiKey.trim()) {
			addError = 'Label und API-Key sind Pflicht';
			return;
		}
		saving = true;
		try {
			await byokVault.create({
				provider: addProvider,
				label: addLabel.trim(),
				apiKey: addApiKey.trim(),
				model: addModel.trim() || undefined,
				isDefault: addIsDefault,
			});
			showAdd = false;
			addLabel = '';
			addApiKey = '';
			addModel = '';
			await reload();
		} catch (err) {
			addError = err instanceof Error ? err.message : String(err);
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Schluessel wirklich loeschen?')) return;
		await byokVault.delete(id);
		await reload();
	}

	async function handleSetDefault(id: string) {
		await byokVault.update(id, { isDefault: true });
		await reload();
	}

	function startEdit(k: Omit<ByokKeyPlain, 'apiKey'>) {
		editingId = k.id;
		editLabel = k.label;
		editModel = k.model ?? '';
	}

	async function saveEdit() {
		if (!editingId) return;
		await byokVault.update(editingId, {
			label: editLabel.trim(),
			model: editModel.trim() || undefined,
		});
		editingId = null;
		await reload();
	}

	function providerDisplay(id: ByokProviderId): string {
		return BUILTIN_BYOK_PROVIDERS.find((p) => p.id === id)?.displayName ?? id;
	}

	function providerModels(id: ByokProviderId): readonly string[] {
		return BUILTIN_BYOK_PROVIDERS.find((p) => p.id === id)?.availableModels ?? [];
	}

	function providerDefaultModel(id: ByokProviderId): string {
		return BUILTIN_BYOK_PROVIDERS.find((p) => p.id === id)?.defaultModel ?? '';
	}

	$effect(() => {
		if (showAdd && !addModel) {
			addModel = providerDefaultModel(addProvider);
		}
	});
</script>

<svelte:head>
	<title>KI-Keys - Mana</title>
</svelte:head>

<div class="keys-page">
	<header class="page-header">
		<h1>KI-Keys</h1>
		<p class="subtitle">
			Hinterlege deine eigenen API-Keys fuer OpenAI, Anthropic, Gemini oder Mistral. Keys bleiben
			verschluesselt auf diesem Geraet und werden nie synchronisiert.
		</p>
	</header>

	{#if vaultLocked}
		<div class="notice">Vault ist gesperrt — bitte zuerst anmelden um Keys zu verwalten.</div>
	{:else if loading}
		<div class="notice">Laedt...</div>
	{:else}
		<div class="actions">
			<button class="btn-primary" onclick={() => (showAdd = !showAdd)}>
				<Plus size={14} weight="bold" /> Key hinzufuegen
			</button>
		</div>

		{#if showAdd}
			<div class="add-form">
				<h3>Neuen Key hinzufuegen</h3>

				<label class="field">
					<span class="label">Provider</span>
					<select
						bind:value={addProvider}
						onchange={() => (addModel = providerDefaultModel(addProvider))}
					>
						{#each BUILTIN_BYOK_PROVIDERS as p}
							<option value={p.id}>{p.displayName}</option>
						{/each}
					</select>
				</label>

				<label class="field">
					<span class="label">Label</span>
					<input
						type="text"
						bind:value={addLabel}
						placeholder="z.B. Work Anthropic, Privat OpenAI"
						maxlength="40"
					/>
				</label>

				<label class="field">
					<span class="label">API-Key</span>
					<input
						type="password"
						bind:value={addApiKey}
						placeholder={addProvider === 'openai'
							? 'sk-...'
							: addProvider === 'anthropic'
								? 'sk-ant-...'
								: 'API-Key'}
						autocomplete="off"
					/>
				</label>

				<label class="field">
					<span class="label">Modell (optional)</span>
					<select bind:value={addModel}>
						<option value="">Provider-Default ({providerDefaultModel(addProvider)})</option>
						{#each providerModels(addProvider) as m}
							<option value={m}>{m}</option>
						{/each}
					</select>
				</label>

				<label class="field-inline">
					<input type="checkbox" bind:checked={addIsDefault} />
					<span>Als Standard fuer {providerDisplay(addProvider)}</span>
				</label>

				{#if addError}
					<div class="error">{addError}</div>
				{/if}

				<div class="form-actions">
					<button class="btn-cancel" onclick={() => (showAdd = false)}>Abbrechen</button>
					<button class="btn-primary" onclick={handleAdd} disabled={saving}>
						{saving ? 'Speichern...' : 'Speichern'}
					</button>
				</div>
			</div>
		{/if}

		<div class="keys-list">
			{#each keys as k (k.id)}
				<div class="key-card" class:default-key={k.isDefault}>
					{#if editingId === k.id}
						<div class="edit-row">
							<input type="text" bind:value={editLabel} maxlength="40" />
							<select bind:value={editModel}>
								<option value="">Provider-Default</option>
								{#each providerModels(k.provider) as m}
									<option value={m}>{m}</option>
								{/each}
							</select>
							<button class="btn-icon" onclick={saveEdit} title="Speichern">
								<Check size={14} weight="bold" />
							</button>
							<button class="btn-icon" onclick={() => (editingId = null)} title="Abbrechen">
								<X size={14} />
							</button>
						</div>
					{:else}
						<div class="key-main">
							<div class="key-icon"><Key size={16} weight="fill" /></div>
							<div class="key-info">
								<div class="key-title">
									<span class="key-label">{k.label}</span>
									{#if k.isDefault}
										<span class="default-badge">Standard</span>
									{/if}
								</div>
								<div class="key-meta">
									{providerDisplay(k.provider)}
									· {k.model || `Default (${providerDefaultModel(k.provider)})`}
								</div>
								<div class="key-usage">
									{k.usageCount} Aufrufe · {k.totalTokens.toLocaleString('de-DE')} Token · {formatCost(
										k.totalCostUsd
									)}
								</div>
							</div>
							<div class="key-actions">
								{#if !k.isDefault}
									<button
										class="btn-ghost"
										onclick={() => handleSetDefault(k.id)}
										title="Als Standard setzen"
									>
										Standard
									</button>
								{/if}
								<button class="btn-icon" onclick={() => startEdit(k)} title="Bearbeiten">
									<PencilSimple size={14} />
								</button>
								<button class="btn-icon danger" onclick={() => handleDelete(k.id)} title="Loeschen">
									<Trash size={14} />
								</button>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="empty">
					<Key size={32} weight="thin" />
					<p>Noch keine API-Keys hinterlegt.</p>
					<p class="hint">
						Klicke auf "Key hinzufuegen" um mit OpenAI, Anthropic, Gemini oder Mistral zu chatten.
					</p>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.keys-page {
		max-width: 720px;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}
	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.375rem;
		color: hsl(var(--color-foreground));
	}
	.subtitle {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0;
	}

	.actions {
		margin-bottom: 1rem;
	}
	.notice {
		padding: 1.5rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-muted) / 0.2);
		border-radius: 0.75rem;
	}
	.error {
		padding: 0.5rem 0.75rem;
		background: hsl(var(--color-error) / 0.1);
		border: 1px solid hsl(var(--color-error) / 0.3);
		color: hsl(var(--color-error));
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		margin: 0.5rem 0;
	}

	.add-form {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		padding: 1.25rem;
		margin-bottom: 1rem;
	}
	.add-form h3 {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0 0 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}
	.field .label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.field input,
	.field select {
		padding: 0.4375rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		outline: none;
	}
	.field input:focus,
	.field select:focus {
		border-color: hsl(var(--color-primary));
	}

	.field-inline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		margin-bottom: 0.75rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.btn-primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-cancel {
		padding: 0.4375rem 0.75rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.btn-ghost {
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		border-radius: 0.375rem;
		font-size: 0.6875rem;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
	}
	.btn-ghost:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		color: hsl(var(--color-primary));
	}

	.btn-icon {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.btn-icon:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.btn-icon.danger:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.1);
	}

	.keys-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.key-card {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		padding: 0.875rem 1rem;
	}
	.key-card.default-key {
		border-color: hsl(var(--color-primary) / 0.3);
	}

	.key-main {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.key-icon {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.key-info {
		flex: 1;
		min-width: 0;
	}
	.key-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.125rem;
	}
	.key-label {
		font-weight: 500;
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
	}
	.default-badge {
		font-size: 0.625rem;
		font-weight: 600;
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.key-meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.key-usage {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}

	.key-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.edit-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.edit-row input {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}
	.edit-row select {
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}

	.empty {
		text-align: center;
		padding: 2rem 1rem;
		color: hsl(var(--color-muted-foreground));
	}
	.empty p {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
	}
	.empty .hint {
		font-size: 0.75rem;
		opacity: 0.8;
	}
</style>
