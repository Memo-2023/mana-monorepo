<!--
  API Keys — Workbench-embedded API key management with create/revoke
  and usage instructions for STT/TTS services.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, Badge } from '@mana/shared-ui';
	import { Check, Copy, Info, Key, Plus, Prohibit } from '@mana/shared-icons';
	import { apiKeysService, type ApiKey, type ApiKeyWithSecret } from '$lib/api/api-keys';

	let loading = $state(true);
	let apiKeys = $state<ApiKey[]>([]);
	let error = $state<string | null>(null);

	let showCreateModal = $state(false);
	let creating = $state(false);
	let newKeyName = $state('');
	let newKeyScopes = $state<{ stt: boolean; tts: boolean }>({ stt: true, tts: true });
	let newKeyRateLimit = $state('60');
	let createdKey = $state<ApiKeyWithSecret | null>(null);
	let copied = $state(false);

	let revoking = $state<string | null>(null);

	let activeKeys = $derived(apiKeys.filter((k) => !k.revokedAt));
	let revokedKeys = $derived(apiKeys.filter((k) => k.revokedAt));

	onMount(async () => {
		await loadKeys();
	});

	async function loadKeys() {
		loading = true;
		error = null;
		const result = await apiKeysService.list();
		if (result.error) {
			error = result.error;
		} else {
			apiKeys = result.data || [];
		}
		loading = false;
	}

	async function handleCreate() {
		if (!newKeyName.trim()) return;
		const scopes: string[] = [];
		if (newKeyScopes.stt) scopes.push('stt');
		if (newKeyScopes.tts) scopes.push('tts');
		if (scopes.length === 0) {
			error = 'Please select at least one scope';
			return;
		}
		creating = true;
		const result = await apiKeysService.create({
			name: newKeyName.trim(),
			scopes,
			rateLimitRequests: parseInt(newKeyRateLimit, 10) || 60,
		});
		if (result.error) {
			error = result.error;
		} else if (result.data) {
			createdKey = result.data;
			const { key: _omit, ...withoutSecret } = result.data;
			apiKeys = [...apiKeys, withoutSecret];
		}
		creating = false;
		newKeyName = '';
	}

	async function handleRevoke(id: string) {
		revoking = id;
		const result = await apiKeysService.revoke(id);
		if (result.error) {
			error = result.error;
		} else {
			apiKeys = apiKeys.map((k) =>
				k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k
			);
		}
		revoking = null;
	}

	async function copyToClipboard(text: string) {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function closeCreateModal() {
		showCreateModal = false;
		createdKey = null;
		newKeyName = '';
		newKeyScopes = { stt: true, tts: true };
		newKeyRateLimit = '60';
		copied = false;
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

<div class="apikeys-page">
	<div class="header">
		<button class="add-btn" onclick={() => (showCreateModal = true)}>
			<Plus size={14} weight="bold" /> API Key
		</button>
	</div>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
		</div>
	{:else}
		{#if error}
			<div class="error-box">{error}</div>
		{/if}

		<!-- Active Keys -->
		<div class="section">
			<div class="section-header">
				<Key size={16} />
				<span class="section-title">Active Keys</span>
				<span class="section-count">{activeKeys.length}</span>
			</div>

			{#if activeKeys.length === 0}
				<div class="empty">
					<Key size={32} />
					<p>No API keys yet</p>
				</div>
			{:else}
				<div class="key-list">
					{#each activeKeys as key (key.id)}
						<div class="key-card">
							<div class="key-info">
								<div class="key-name-row">
									<span class="key-name">{key.name}</span>
									<span class="key-scope">{key.scopes.join(', ')}</span>
									<span class="key-rate">{key.rateLimitRequests}/min</span>
								</div>
								<div class="key-meta">
									<code class="key-prefix">{key.keyPrefix}</code>
									<span>Created: {formatDate(key.createdAt)}</span>
								</div>
							</div>
							<button
								class="revoke-btn"
								disabled={revoking === key.id}
								onclick={() => handleRevoke(key.id)}
							>
								{revoking === key.id ? '...' : 'Revoke'}
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Revoked Keys -->
		{#if revokedKeys.length > 0}
			<div class="section dimmed">
				<div class="section-header">
					<Prohibit size={16} />
					<span class="section-title">Revoked</span>
					<span class="section-count">{revokedKeys.length}</span>
				</div>
				<div class="key-list">
					{#each revokedKeys as key (key.id)}
						<div class="key-card revoked">
							<div class="key-info">
								<span class="key-name strikethrough">{key.name}</span>
								<div class="key-meta">
									<code class="key-prefix">{key.keyPrefix}</code>
									<span>Revoked: {formatDate(key.revokedAt)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Usage -->
		<div class="section">
			<div class="section-header">
				<Info size={16} />
				<span class="section-title">How to Use</span>
			</div>
			<div class="usage-block">
				<p class="usage-label">Speech-to-Text (STT)</p>
				<pre class="usage-code"><code
						>curl -X POST https://gpu-stt.mana.how/transcribe \
  -H "X-API-Key: sk_live_..." \
  -F "audio=@audio.mp3"</code
					></pre>
			</div>
			<div class="usage-block">
				<p class="usage-label">Text-to-Speech (TTS)</p>
				<pre class="usage-code"><code
						>curl -X POST https://tts-api.mana.how/synthesize/kokoro \
  -H "X-API-Key: sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{{ text: 'Hello', voice: 'af_heart' }}' \
  --output speech.wav</code
					></pre>
			</div>
		</div>
	{/if}
</div>

<!-- Create API Key Modal -->
{#if showCreateModal}
	<div class="modal-backdrop">
		<button class="backdrop-btn" onclick={closeCreateModal} aria-label="Close modal"></button>
		<div class="modal">
			{#if createdKey}
				<div class="modal-success">
					<div class="success-icon"><Check size={20} /></div>
					<h3 class="modal-title">API Key Created</h3>
					<p class="modal-hint">Copy your API key now. You won't be able to see it again.</p>
					<div class="key-display">
						<code>{createdKey.key}</code>
						<button class="copy-btn" onclick={() => copyToClipboard(createdKey!.key)}>
							{#if copied}<Check size={16} />{:else}<Copy size={16} />{/if}
						</button>
					</div>
					{#if copied}<p class="copied-msg">Copied!</p>{/if}
					<button class="done-btn" onclick={closeCreateModal}>Done</button>
				</div>
			{:else}
				<h3 class="modal-title">Create API Key</h3>
				<label class="field-label" for="wbKeyName">Key Name</label>
				<input
					id="wbKeyName"
					type="text"
					class="field-input"
					bind:value={newKeyName}
					placeholder="e.g., Production API Key"
				/>
				<span class="field-label">Scopes</span>
				<div class="scope-checks">
					<label class="scope-check">
						<input type="checkbox" bind:checked={newKeyScopes.stt} /> STT
					</label>
					<label class="scope-check">
						<input type="checkbox" bind:checked={newKeyScopes.tts} /> TTS
					</label>
				</div>
				<label class="field-label" for="wbRateLimit">Rate Limit</label>
				<div class="rate-row">
					<input
						id="wbRateLimit"
						type="number"
						class="field-input rate-input"
						bind:value={newKeyRateLimit}
					/>
					<span class="rate-unit">req/min</span>
				</div>
				<div class="modal-actions">
					<button class="cancel-btn" onclick={closeCreateModal}>Cancel</button>
					<button
						class="create-btn"
						disabled={!newKeyName.trim() || (!newKeyScopes.stt && !newKeyScopes.tts) || creating}
						onclick={handleCreate}
					>
						{creating ? 'Creating...' : 'Create'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.apikeys-page {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		overflow-y: auto;
	}

	.header {
		display: flex;
		justify-content: flex-end;
	}

	.add-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		border: none;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}
	.add-btn:hover {
		background: hsl(var(--color-primary) / 0.2);
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem 0;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid hsl(var(--color-border));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-box {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(0 84% 60% / 0.08);
		color: hsl(0 84% 60%);
		font-size: 0.8125rem;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section.dimmed {
		opacity: 0.6;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: hsl(var(--color-muted-foreground));
	}

	.section-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.section-count {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		opacity: 0.5;
	}

	.key-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.key-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
	}

	.key-card.revoked {
		opacity: 0.6;
	}

	.key-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.key-name-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.key-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.key-name.strikethrough {
		text-decoration: line-through;
	}

	.key-scope {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	.key-rate {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
	}

	.key-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		flex-wrap: wrap;
	}

	.key-prefix {
		font-family: monospace;
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: 0.25rem;
	}

	.revoke-btn {
		flex-shrink: 0;
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(0 84% 60% / 0.3);
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(0 84% 60%);
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
	}
	.revoke-btn:hover {
		background: hsl(0 84% 60% / 0.08);
	}
	.revoke-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Usage */
	.usage-block {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.usage-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.usage-code {
		padding: 0.5rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: 0.5rem;
		font-size: 0.6875rem;
		overflow-x: auto;
		margin: 0;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.backdrop-btn {
		position: absolute;
		inset: 0;
		background: hsl(0 0% 0% / 0.5);
		border: none;
		cursor: pointer;
	}

	.modal {
		position: relative;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		box-shadow: 0 8px 32px hsl(0 0% 0% / 0.2);
		max-width: 24rem;
		width: calc(100% - 2rem);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-success {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
	}

	.success-icon {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: hsl(142 71% 45% / 0.15);
		color: hsl(142 71% 45%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.modal-hint {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.key-display {
		position: relative;
		width: 100%;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: 0.5rem;
		font-family: monospace;
		font-size: 0.75rem;
		word-break: break-all;
	}

	.copy-btn {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: transparent;
		border: none;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem;
		border-radius: 0.25rem;
	}
	.copy-btn:hover {
		background: hsl(var(--color-surface-hover));
	}

	.copied-msg {
		font-size: 0.75rem;
		color: hsl(142 71% 45%);
	}

	.done-btn,
	.create-btn {
		width: 100%;
		padding: 0.5rem;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.done-btn:hover,
	.create-btn:hover {
		opacity: 0.9;
	}
	.create-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.field-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.field-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
	}
	.field-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary) / 0.5);
	}

	.scope-checks {
		display: flex;
		gap: 1rem;
	}

	.scope-check {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.rate-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.rate-input {
		width: 5rem;
	}

	.rate-unit {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.modal-actions {
		display: flex;
		gap: 0.5rem;
	}

	.cancel-btn {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.cancel-btn:hover {
		background: hsl(var(--color-surface-hover));
	}
</style>
