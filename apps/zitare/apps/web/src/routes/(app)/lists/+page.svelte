<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ZitareEvents } from '@manacore/shared-utils/analytics';

	interface QuoteList {
		id: string;
		name: string;
		description?: string;
		quoteIds: string[];
		createdAt: string;
		updatedAt: string;
	}

	let lists = $state<QuoteList[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let deletingId = $state<string | null>(null);
	let showCreateModal = $state(false);
	let newListName = $state('');
	let newListDescription = $state('');

	// Get backend URL
	function getBackendUrl(): string {
		if (typeof window !== 'undefined') {
			const injectedUrl = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
				.__PUBLIC_BACKEND_URL__;
			return injectedUrl || 'http://localhost:3007';
		}
		return 'http://localhost:3007';
	}

	async function fetchLists() {
		if (!authStore.isAuthenticated) {
			loading = false;
			return;
		}

		const token = await authStore.getValidToken();
		if (!token) {
			loading = false;
			return;
		}

		try {
			const response = await fetch(`${getBackendUrl()}/api/lists`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				lists = data.lists || [];
			}
		} catch (error) {
			console.error('Failed to fetch lists:', error);
		} finally {
			loading = false;
		}
	}

	async function createList() {
		if (!newListName.trim() || saving) return;

		const token = await authStore.getValidToken();
		if (!token) return;

		saving = true;
		try {
			const response = await fetch(`${getBackendUrl()}/api/lists`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: newListName.trim(),
					description: newListDescription.trim() || undefined,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				lists = [...lists, data.list];
				ZitareEvents.listCreated();
				showCreateModal = false;
				newListName = '';
				newListDescription = '';
			}
		} catch (error) {
			console.error('Failed to create list:', error);
		} finally {
			saving = false;
		}
	}

	async function deleteList(listId: string) {
		if (deletingId || !confirm($_('lists.confirmDelete'))) return;

		const token = await authStore.getValidToken();
		if (!token) return;

		deletingId = listId;
		try {
			const response = await fetch(`${getBackendUrl()}/api/lists/${listId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				lists = lists.filter((l) => l.id !== listId);
				ZitareEvents.listDeleted();
			}
		} catch (error) {
			console.error('Failed to delete list:', error);
		} finally {
			deletingId = null;
		}
	}

	onMount(() => {
		fetchLists();
	});
</script>

<svelte:head>
	<title>Zitare - {$_('lists.title')}</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-3xl font-bold text-foreground">{$_('lists.title')}</h1>
		{#if authStore.isAuthenticated}
			<button
				onclick={() => (showCreateModal = true)}
				class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-colors"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{$_('lists.create')}
			</button>
		{/if}
	</div>

	{#if !authStore.isAuthenticated}
		<div class="text-center py-12 bg-surface-elevated rounded-2xl">
			<svg
				class="w-16 h-16 mx-auto text-foreground-muted mb-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
			<p class="text-foreground-secondary mb-4">{$_('lists.loginPrompt')}</p>
			<button
				onclick={() => goto('/login')}
				class="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-colors"
			>
				{$_('auth.login')}
			</button>
		</div>
	{:else if loading}
		<div class="text-center py-12">
			<div
				class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"
			></div>
		</div>
	{:else if lists.length === 0}
		<div class="text-center py-12 bg-surface-elevated rounded-2xl">
			<svg
				class="w-16 h-16 mx-auto text-foreground-muted mb-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
			<p class="text-lg font-medium text-foreground mb-2">{$_('lists.empty')}</p>
			<p class="text-foreground-secondary">{$_('lists.emptyDescription')}</p>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each lists as list (list.id)}
				<a
					href="/lists/{list.id}"
					class="block p-6 bg-surface-elevated rounded-2xl hover:shadow-lg transition-all group"
				>
					<div class="flex items-start justify-between">
						<div>
							<h3
								class="text-lg font-semibold text-foreground group-hover:text-primary transition-colors"
							>
								{list.name}
							</h3>
							{#if list.description}
								<p class="text-foreground-secondary mt-1">{list.description}</p>
							{/if}
							<p class="text-sm text-foreground-muted mt-2">
								{$_('lists.quoteCount', { values: { count: list.quoteIds.length } })}
							</p>
						</div>
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								deleteList(list.id);
							}}
							disabled={deletingId === list.id}
							class="p-2 text-foreground-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
						>
							{#if deletingId === list.id}
								<div
									class="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"
								></div>
							{:else}
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-surface-elevated rounded-2xl w-full max-w-md shadow-xl">
			<div class="flex items-center justify-between p-6 border-b border-border">
				<h3 class="text-xl font-semibold text-foreground">{$_('lists.createModal.title')}</h3>
				<button
					onclick={() => (showCreateModal = false)}
					class="p-2 text-foreground-secondary hover:text-foreground transition-colors"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="p-6 space-y-4">
				<div>
					<label class="block text-sm font-medium text-foreground mb-2"
						>{$_('lists.nameLabel')} *</label
					>
					<input
						type="text"
						bind:value={newListName}
						placeholder={$_('lists.createModal.namePlaceholder')}
						class="w-full p-3 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:border-primary"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-foreground mb-2"
						>{$_('lists.descriptionLabel')}</label
					>
					<textarea
						bind:value={newListDescription}
						placeholder={$_('lists.createModal.descriptionPlaceholder')}
						rows="3"
						class="w-full p-3 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:border-primary resize-none"
					></textarea>
				</div>
			</div>
			<div class="flex justify-end gap-3 p-6 border-t border-border">
				<button
					onclick={() => (showCreateModal = false)}
					class="px-4 py-2 text-foreground-secondary hover:text-foreground transition-colors"
				>
					{$_('common.cancel')}
				</button>
				<button
					onclick={createList}
					disabled={!newListName.trim() || saving}
					class="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
				>
					{#if saving}
						<div
							class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
						></div>
					{/if}
					{$_('lists.createModal.submit')}
				</button>
			</div>
		</div>
	</div>
{/if}
