<script lang="ts">
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import {
		linkCollection,
		tagCollection,
		folderCollection,
		linkTagCollection,
	} from '$lib/data/local-store';
	import type { LocalLink } from '$lib/data/local-store';
	import { toast } from 'svelte-sonner';

	// Live queries — auto-update when IndexedDB changes
	const links = useLiveQuery(() =>
		linkCollection.getAll({}, { sortBy: 'order', sortDirection: 'asc' })
	);
	const tags = useLiveQuery(() => tagCollection.getAll());
	const folders = useLiveQuery(() =>
		folderCollection.getAll({}, { sortBy: 'order', sortDirection: 'asc' })
	);

	// State
	let searchQuery = $state('');
	let selectedStatus = $state<'all' | 'active' | 'inactive'>('all');
	let selectedFolderId = $state<string | null>(null);
	let showCreateForm = $state(false);
	let newUrl = $state('');
	let newTitle = $state('');
	let newCustomCode = $state('');

	// Filtered links
	let filteredLinks = $derived.by(() => {
		let result = links.value ?? [];
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(l) =>
					l.title?.toLowerCase().includes(q) ||
					l.originalUrl.toLowerCase().includes(q) ||
					l.shortCode.toLowerCase().includes(q)
			);
		}
		if (selectedStatus === 'active') result = result.filter((l) => l.isActive);
		if (selectedStatus === 'inactive') result = result.filter((l) => !l.isActive);
		if (selectedFolderId) result = result.filter((l) => l.folderId === selectedFolderId);
		return result;
	});

	function generateShortCode(): string {
		const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let code = '';
		for (let i = 0; i < 6; i++) {
			code += chars[Math.floor(Math.random() * chars.length)];
		}
		return code;
	}

	async function createLink() {
		if (!newUrl) return;

		const shortCode = newCustomCode || generateShortCode();
		await linkCollection.insert({
			id: crypto.randomUUID(),
			shortCode,
			customCode: newCustomCode || null,
			originalUrl: newUrl,
			title: newTitle || null,
			isActive: true,
			clickCount: 0,
			folderId: selectedFolderId,
			order: links.value?.length ?? 0,
		});

		toast.success(`Link erstellt: ${shortCode}`);
		newUrl = '';
		newTitle = '';
		newCustomCode = '';
	}

	async function toggleActive(link: LocalLink) {
		await linkCollection.update(link.id, { isActive: !link.isActive });
	}

	async function deleteLink(link: LocalLink) {
		await linkCollection.delete(link.id);
		toast.success('Link gelöscht');
	}

	function copyShortUrl(code: string) {
		navigator.clipboard.writeText(`${window.location.origin}/${code}`);
		toast.success('Link kopiert!');
	}
</script>

<div class="min-h-screen">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-3xl font-bold">
				Links
				{#if filteredLinks.length > 0}
					<span class="ml-2 text-2xl opacity-50">({filteredLinks.length})</span>
				{/if}
			</h1>
			<button
				onclick={() => (showCreateForm = !showCreateForm)}
				class="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700"
			>
				{showCreateForm ? '- Ausblenden' : '+ Neuer Link'}
			</button>
		</div>

		<!-- Create Form -->
		{#if showCreateForm}
			<div
				class="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="md:col-span-2">
						<label for="url" class="mb-1 block text-sm font-medium">URL</label>
						<input
							id="url"
							type="url"
							bind:value={newUrl}
							placeholder="https://example.com/long-url-here"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700"
							onkeydown={(e) => e.key === 'Enter' && createLink()}
						/>
					</div>
					<div>
						<label for="title" class="mb-1 block text-sm font-medium">Titel (optional)</label>
						<input
							id="title"
							type="text"
							bind:value={newTitle}
							placeholder="Mein Link"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700"
						/>
					</div>
					<div>
						<label for="code" class="mb-1 block text-sm font-medium">Custom Code (optional)</label>
						<input
							id="code"
							type="text"
							bind:value={newCustomCode}
							placeholder="mein-link"
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700"
						/>
					</div>
				</div>
				<div class="mt-4 flex justify-end">
					<button
						onclick={createLink}
						disabled={!newUrl}
						class="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Link erstellen
					</button>
				</div>
			</div>
		{/if}

		<!-- Filters -->
		<div class="mb-4 flex flex-wrap items-center gap-3">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Links durchsuchen..."
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700"
			/>
			<select
				bind:value={selectedStatus}
				class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
			>
				<option value="all">Alle</option>
				<option value="active">Aktiv</option>
				<option value="inactive">Inaktiv</option>
			</select>
			{#if folders.value && folders.value.length > 0}
				<select
					bind:value={selectedFolderId}
					class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
				>
					<option value={null}>Alle Ordner</option>
					{#each folders.value as folder}
						<option value={folder.id}>{folder.name}</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Links List -->
		{#if links.loading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"></div>
				{/each}
			</div>
		{:else if filteredLinks.length === 0}
			<div
				class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600"
			>
				<p class="text-lg font-medium opacity-60">Noch keine Links</p>
				<p class="mt-1 text-sm opacity-40">Erstelle deinen ersten gekürzten Link!</p>
				<button
					onclick={() => (showCreateForm = true)}
					class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>
					+ Neuer Link
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredLinks as link (link.id)}
					<div
						class="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span
									class="inline-block h-2 w-2 rounded-full {link.isActive
										? 'bg-green-500'
										: 'bg-gray-400'}"
								></span>
								<h3 class="truncate font-semibold">{link.title || link.shortCode}</h3>
								<span
									class="rounded bg-indigo-100 px-2 py-0.5 font-mono text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
								>
									/{link.shortCode}
								</span>
							</div>
							<p class="mt-1 truncate text-sm opacity-60">{link.originalUrl}</p>
						</div>

						<div class="ml-4 flex items-center gap-2">
							<span class="whitespace-nowrap text-sm font-medium opacity-60">
								{link.clickCount} clicks
							</span>
							<button
								onclick={() => copyShortUrl(link.shortCode)}
								class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
								title="Link kopieren"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
									/>
								</svg>
							</button>
							<button
								onclick={() => toggleActive(link)}
								class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
								title={link.isActive ? 'Deaktivieren' : 'Aktivieren'}
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</button>
							<button
								onclick={() => deleteLink(link)}
								class="rounded-lg p-2 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
								title="Löschen"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
