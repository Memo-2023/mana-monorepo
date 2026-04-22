<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, PageHeader, Badge } from '@mana/shared-ui';
	import { Check, Copy, Info, Key, Plus, Prohibit } from '@mana/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiKeysService, type ApiKey, type ApiKeyWithSecret } from '$lib/api/api-keys';
	import { RoutePage } from '$lib/components/shell';

	// State
	let loading = $state(true);
	let apiKeys = $state<ApiKey[]>([]);
	let error = $state<string | null>(null);

	// Create modal state
	let showCreateModal = $state(false);
	let creating = $state(false);
	let newKeyName = $state('');
	let newKeyScopes = $state<{ stt: boolean; tts: boolean }>({ stt: true, tts: true });
	// Stored as string because the shared <Input> component binds to a
	// string value; we parseInt at submit time.
	let newKeyRateLimit = $state('60');
	let createdKey = $state<ApiKeyWithSecret | null>(null);
	let copied = $state(false);

	// Revoke state
	let revoking = $state<string | null>(null);

	// Computed: active keys (not revoked)
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

		// Build scopes array from checkboxes
		const scopes: string[] = [];
		if (newKeyScopes.stt) scopes.push('stt');
		if (newKeyScopes.tts) scopes.push('tts');

		// Validate at least one scope is selected
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
			// Add to list — strip the secret `key` field that only appears on
			// creation responses, so the local list matches the ApiKey shape.
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
			// Update local state
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

<RoutePage appId="api-keys">
	<div>
		<PageHeader
			title="API Keys"
			description="Manage your API keys for programmatic access to STT and TTS services"
			size="lg"
		>
			{#snippet actions()}
				<Button onclick={() => (showCreateModal = true)}>
					<Plus size={16} class="mr-2" />
					Create API Key
				</Button>
			{/snippet}
		</PageHeader>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
			</div>
		{:else}
			<div class="space-y-6">
				{#if error}
					<div
						class="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
					>
						{error}
					</div>
				{/if}

				<!-- Active Keys -->
				<Card>
					<div class="p-6">
						<div class="flex items-center gap-3 mb-6">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
							>
								<Key size={20} />
							</div>
							<div>
								<h2 class="text-lg font-semibold">Active Keys</h2>
								<p class="text-sm text-muted-foreground">
									{activeKeys.length} active key{activeKeys.length !== 1 ? 's' : ''}
								</p>
							</div>
						</div>

						{#if activeKeys.length === 0}
							<div class="text-center py-8 text-muted-foreground">
								<Key size={48} class="mx-auto mb-4 opacity-50" />
								<p class="font-medium">No API keys yet</p>
								<p class="text-sm mt-1">Create your first API key to get started</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each activeKeys as key (key.id)}
									<div class="flex items-center justify-between p-4 rounded-lg bg-surface-hover">
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 flex-wrap">
												<span class="font-medium">{key.name}</span>
												<Badge variant="default">{key.scopes.join(', ')}</Badge>
												<Badge variant="info">{key.rateLimitRequests}/min</Badge>
											</div>
											<div
												class="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap"
											>
												<code class="bg-muted px-2 py-0.5 rounded font-mono text-xs"
													>{key.keyPrefix}</code
												>
												<span>Created: {formatDate(key.createdAt)}</span>
												<span>Last used: {formatDate(key.lastUsedAt)}</span>
											</div>
										</div>
										<Button
											variant="danger"
											size="sm"
											loading={revoking === key.id}
											onclick={() => handleRevoke(key.id)}
										>
											{revoking === key.id ? 'Revoking...' : 'Revoke'}
										</Button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</Card>

				<!-- Revoked Keys (if any) -->
				{#if revokedKeys.length > 0}
					<Card>
						<div class="p-6">
							<div class="flex items-center gap-3 mb-6">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
								>
									<Prohibit size={20} />
								</div>
								<div>
									<h2 class="text-lg font-semibold">Revoked Keys</h2>
									<p class="text-sm text-muted-foreground">
										{revokedKeys.length} revoked key{revokedKeys.length !== 1 ? 's' : ''}
									</p>
								</div>
							</div>

							<div class="space-y-3">
								{#each revokedKeys as key (key.id)}
									<div
										class="flex items-center justify-between p-4 rounded-lg bg-surface-hover opacity-60"
									>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="font-medium line-through">{key.name}</span>
												<Badge variant="danger">Revoked</Badge>
											</div>
											<div class="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
												<code class="bg-muted px-2 py-0.5 rounded font-mono text-xs"
													>{key.keyPrefix}</code
												>
												<span>Revoked: {formatDate(key.revokedAt)}</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</Card>
				{/if}

				<!-- Usage Instructions -->
				<Card>
					<div class="p-6">
						<div class="flex items-center gap-3 mb-6">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
							>
								<Info size={20} />
							</div>
							<div>
								<h2 class="text-lg font-semibold">How to Use</h2>
								<p class="text-sm text-muted-foreground">Include your API key in requests</p>
							</div>
						</div>

						<div class="space-y-4">
							<div>
								<p class="text-sm font-medium mb-2">Speech-to-Text (STT)</p>
								<pre class="bg-muted p-3 rounded-lg text-sm overflow-x-auto"><code
										>curl -X POST https://gpu-stt.mana.how/transcribe \
  -H "X-API-Key: sk_live_your_key_here" \
  -F "audio=@audio.mp3"</code
									></pre>
							</div>

							<div>
								<p class="text-sm font-medium mb-2">Text-to-Speech (TTS)</p>
								<pre class="bg-muted p-3 rounded-lg text-sm overflow-x-auto"><code
										>curl -X POST https://tts-api.mana.how/synthesize/kokoro \
  -H "X-API-Key: sk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{{ text: 'Hello world', voice: 'af_heart' }}' \
  --output speech.wav</code
									></pre>
							</div>
						</div>
					</div>
				</Card>
			</div>
		{/if}
	</div>
</RoutePage>

<!-- Create API Key Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Backdrop -->
		<button class="absolute inset-0 bg-black/50" onclick={closeCreateModal} aria-label="Close modal"
		></button>

		<!-- Modal -->
		<div class="relative bg-surface rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
			{#if createdKey}
				<!-- Success: Show the key -->
				<div class="text-center">
					<div
						class="flex h-12 w-12 mx-auto mb-4 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
					>
						<Check size={20} />
					</div>

					<h3 class="text-lg font-semibold mb-2">API Key Created</h3>
					<p class="text-sm text-muted-foreground mb-4">
						Copy your API key now. You won't be able to see it again.
					</p>

					<div class="relative mb-4">
						<code
							class="block w-full p-3 bg-muted rounded-lg text-sm font-mono break-all text-left"
						>
							{createdKey.key}
						</code>
						<button
							class="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-surface-hover rounded"
							onclick={() => copyToClipboard(createdKey!.key)}
						>
							{#if copied}
								<Check size={20} class="text-green-600" />
							{:else}
								<Copy size={20} />
							{/if}
						</button>
					</div>

					{#if copied}
						<p class="text-sm text-green-600 dark:text-green-400 mb-4">Copied to clipboard!</p>
					{/if}

					<Button onclick={closeCreateModal} class="w-full">Done</Button>
				</div>
			{:else}
				<!-- Form: Create key -->
				<h3 class="text-lg font-semibold mb-4">Create API Key</h3>

				<div class="mb-4">
					<label for="keyName" class="block text-sm font-medium mb-2">Key Name</label>
					<Input
						type="text"
						id="keyName"
						bind:value={newKeyName}
						placeholder="e.g., Production API Key"
					/>
					<p class="mt-1 text-xs text-muted-foreground">A friendly name to identify this key</p>
				</div>

				<!-- Scopes -->
				<div class="mb-4">
					<span class="block text-sm font-medium mb-2">Scopes</span>
					<div class="space-y-2">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={newKeyScopes.stt}
								class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
							/>
							<span class="text-sm">Speech-to-Text (stt)</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={newKeyScopes.tts}
								class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
							/>
							<span class="text-sm">Text-to-Speech (tts)</span>
						</label>
					</div>
					<p class="mt-1 text-xs text-muted-foreground">
						Select which services this key can access
					</p>
				</div>

				<!-- Rate Limit -->
				<div class="mb-6">
					<label for="rateLimit" class="block text-sm font-medium mb-2">Rate Limit</label>
					<div class="flex items-center gap-2">
						<Input type="number" id="rateLimit" bind:value={newKeyRateLimit} class="w-24" />
						<span class="text-sm text-muted-foreground">requests per minute</span>
					</div>
					<p class="mt-1 text-xs text-muted-foreground">
						Maximum number of API calls allowed per minute (default: 60)
					</p>
				</div>

				<div class="flex gap-3">
					<Button variant="secondary" onclick={closeCreateModal} class="flex-1">Cancel</Button>
					<Button
						onclick={handleCreate}
						loading={creating}
						disabled={!newKeyName.trim() || (!newKeyScopes.stt && !newKeyScopes.tts)}
						class="flex-1"
					>
						{creating ? 'Creating...' : 'Create Key'}
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
