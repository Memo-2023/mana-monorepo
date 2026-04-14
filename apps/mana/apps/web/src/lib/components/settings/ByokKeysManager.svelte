<!--
  ByokKeysManager — Inline BYOK keys CRUD for embedding in AiSettings.
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

<div class="byok-manager">
	{#if vaultLocked}
		<div class="notice">Vault ist gesperrt — bitte zuerst anmelden um Keys zu verwalten.</div>
	{:else if loading}
		<div class="notice subtle">Laedt...</div>
	{:else}
		{#if keys.length > 0}
			<div class="keys-list">
				{#each keys as k (k.id)}
					<div class="key-row" class:default-key={k.isDefault}>
						{#if editingId === k.id}
							<input
								type="text"
								bind:value={editLabel}
								maxlength="40"
								class="edit-input"
								placeholder="Label"
							/>
							<select bind:value={editModel} class="edit-input">
								<option value="">Default</option>
								{#each providerModels(k.provider) as m}
									<option value={m}>{m}</option>
								{/each}
							</select>
							<button class="btn-icon" onclick={saveEdit}><Check size={12} /></button>
							<button class="btn-icon" onclick={() => (editingId = null)}><X size={12} /></button>
						{:else}
							<div class="key-icon"><Key size={14} weight="fill" /></div>
							<div class="key-info">
								<div class="key-line">
									<span class="key-label">{k.label}</span>
									{#if k.isDefault}<span class="badge">Standard</span>{/if}
								</div>
								<div class="key-meta">
									{providerDisplay(k.provider)} · {k.model || providerDefaultModel(k.provider)} ·
									{k.usageCount} Aufrufe · {formatCost(k.totalCostUsd)}
								</div>
							</div>
							<div class="key-actions">
								{#if !k.isDefault}
									<button class="btn-link" onclick={() => handleSetDefault(k.id)}>Standard</button>
								{/if}
								<button class="btn-icon" onclick={() => startEdit(k)} title="Bearbeiten">
									<PencilSimple size={12} />
								</button>
								<button class="btn-icon danger" onclick={() => handleDelete(k.id)} title="Loeschen">
									<Trash size={12} />
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if showAdd}
			<div class="add-form">
				<div class="form-row">
					<label class="field flex-1">
						<span class="field-label">Provider</span>
						<select
							bind:value={addProvider}
							onchange={() => (addModel = providerDefaultModel(addProvider))}
						>
							{#each BUILTIN_BYOK_PROVIDERS as p}
								<option value={p.id}>{p.displayName}</option>
							{/each}
						</select>
					</label>
					<label class="field flex-1">
						<span class="field-label">Label</span>
						<input
							type="text"
							bind:value={addLabel}
							placeholder="z.B. Privat OpenAI"
							maxlength="40"
						/>
					</label>
				</div>
				<label class="field">
					<span class="field-label">API-Key</span>
					<input
						type="password"
						bind:value={addApiKey}
						placeholder={addProvider === 'openai'
							? 'sk-...'
							: addProvider === 'anthropic'
								? 'sk-ant-...'
								: addProvider === 'gemini'
									? 'AIza...'
									: 'API-Key'}
						autocomplete="off"
					/>
				</label>
				<div class="form-row">
					<label class="field flex-1">
						<span class="field-label">Modell</span>
						<select bind:value={addModel}>
							<option value="">Default ({providerDefaultModel(addProvider)})</option>
							{#each providerModels(addProvider) as m}
								<option value={m}>{m}</option>
							{/each}
						</select>
					</label>
					<label class="checkbox-field">
						<input type="checkbox" bind:checked={addIsDefault} />
						<span>Als Standard</span>
					</label>
				</div>
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
		{:else}
			<button class="add-button" onclick={() => (showAdd = true)}>
				<Plus size={14} weight="bold" />
				{keys.length === 0 ? 'Ersten API-Key hinzufuegen' : 'Weiteren Key hinzufuegen'}
			</button>
		{/if}
	{/if}
</div>

<style>
	.byok-manager {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.notice {
		padding: 0.75rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-muted) / 0.15);
		border-radius: 0.5rem;
	}
	.notice.subtle {
		background: transparent;
		padding: 0.5rem 0;
	}

	.keys-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.key-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
	}
	.key-row.default-key {
		border-color: hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.03);
	}

	.key-icon {
		width: 26px;
		height: 26px;
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
	.key-line {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.key-label {
		font-weight: 500;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.badge {
		font-size: 0.5625rem;
		font-weight: 700;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.key-meta {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.0625rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.key-actions {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		flex-shrink: 0;
	}
	.btn-link {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.btn-link:hover {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
	}
	.btn-icon {
		width: 24px;
		height: 24px;
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

	.add-button {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		align-self: flex-start;
	}
	.add-button:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		color: hsl(var(--color-primary));
	}

	.add-form {
		padding: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.form-row {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
	}
	.flex-1 {
		flex: 1;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.1875rem;
	}
	.field-label {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.field input,
	.field select {
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		outline: none;
		width: 100%;
	}
	.field input:focus,
	.field select:focus {
		border-color: hsl(var(--color-primary));
	}

	.checkbox-field {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		padding-bottom: 0.375rem;
	}

	.edit-input {
		flex: 1;
		padding: 0.25rem 0.375rem;
		font-size: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
	}

	.error {
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		background: hsl(var(--color-error) / 0.1);
		border: 1px solid hsl(var(--color-error) / 0.3);
		color: hsl(var(--color-error));
		border-radius: 0.375rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.btn-cancel {
		padding: 0.375rem 0.625rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
		cursor: pointer;
	}
	.btn-primary {
		padding: 0.375rem 0.875rem;
		border: none;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.75rem;
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
</style>
