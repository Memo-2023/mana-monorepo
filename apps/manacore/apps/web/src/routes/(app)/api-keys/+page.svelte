<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, PageHeader, Badge } from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiKeysService, type ApiKey, type ApiKeyWithSecret } from '$lib/api/api-keys';

	// State
	let loading = $state(true);
	let apiKeys = $state<ApiKey[]>([]);
	let error = $state<string | null>(null);

	// Create modal state
	let showCreateModal = $state(false);
	let creating = $state(false);
	let newKeyName = $state('');
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

		creating = true;
		const result = await apiKeysService.create({ name: newKeyName.trim() });

		if (result.error) {
			error = result.error;
		} else if (result.data) {
			createdKey = result.data;
			// Add to list (without the secret key)
			apiKeys = [
				...apiKeys,
				{
					...result.data,
					key: undefined as unknown as string, // Remove secret from local state
				},
			];
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

<div>
	<PageHeader
		title="API Keys"
		description="Manage your API keys for programmatic access to STT and TTS services"
		size="lg"
	>
		{#snippet actions()}
			<Button onclick={() => (showCreateModal = true)}>
				<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
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
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
								/>
							</svg>
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
							<svg
								class="h-12 w-12 mx-auto mb-4 opacity-50"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
								/>
							</svg>
							<p class="font-medium">No API keys yet</p>
							<p class="text-sm mt-1">Create your first API key to get started</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each activeKeys as key (key.id)}
								<div class="flex items-center justify-between p-4 rounded-lg bg-surface-hover">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<span class="font-medium">{key.name}</span>
											<Badge variant="secondary">{key.scopes.join(', ')}</Badge>
										</div>
										<div class="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
											<code class="bg-muted px-2 py-0.5 rounded font-mono text-xs"
												>{key.keyPrefix}</code
											>
											<span>Created: {formatDate(key.createdAt)}</span>
											<span>Last used: {formatDate(key.lastUsedAt)}</span>
										</div>
									</div>
									<Button
										variant="destructive"
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
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
									/>
								</svg>
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
											<Badge variant="destructive">Revoked</Badge>
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
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
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
									>curl -X POST https://stt-api.mana.how/transcribe \
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
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
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
								<svg
									class="h-5 w-5 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{:else}
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
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

				<div class="flex gap-3">
					<Button variant="secondary" onclick={closeCreateModal} class="flex-1">Cancel</Button>
					<Button
						onclick={handleCreate}
						loading={creating}
						disabled={!newKeyName.trim()}
						class="flex-1"
					>
						{creating ? 'Creating...' : 'Create Key'}
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
