<script lang="ts">
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { linkCollection, tagCollection, folderCollection } from '$lib/data/local-store';
	import type { LocalLink } from '$lib/data/local-store';
	import { toast } from 'svelte-sonner';

	const QR_API = 'https://api.qrserver.com/v1/create-qr-code';

	// Live queries
	const links = useLiveQuery(() =>
		linkCollection.getAll({}, { sortBy: 'order', sortDirection: 'asc' })
	);
	const tags = useLiveQuery(() => tagCollection.getAll());
	const folders = useLiveQuery(() =>
		folderCollection.getAll({}, { sortBy: 'order', sortDirection: 'asc' })
	);

	// Filter state
	let searchQuery = $state('');
	let selectedStatus = $state<'all' | 'active' | 'inactive'>('all');
	let selectedFolderId = $state<string | null>(null);

	// Create form state
	let showCreateForm = $state(false);
	let newUrl = $state('');
	let newTitle = $state('');
	let newCustomCode = $state('');
	let showUtm = $state(false);
	let newUtmSource = $state('');
	let newUtmMedium = $state('');
	let newUtmCampaign = $state('');

	// Edit modal state
	let editingLink = $state<LocalLink | null>(null);
	let editUrl = $state('');
	let editTitle = $state('');
	let editCustomCode = $state('');
	let editUtmSource = $state('');
	let editUtmMedium = $state('');
	let editUtmCampaign = $state('');

	// QR modal state
	let qrLink = $state<LocalLink | null>(null);

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

	function getShortUrl(code: string): string {
		return `${window.location.origin}/${code}`;
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
			utmSource: newUtmSource || null,
			utmMedium: newUtmMedium || null,
			utmCampaign: newUtmCampaign || null,
		});
		toast.success(`Link erstellt: ${shortCode}`);
		newUrl = '';
		newTitle = '';
		newCustomCode = '';
		newUtmSource = '';
		newUtmMedium = '';
		newUtmCampaign = '';
		showUtm = false;
	}

	function openEdit(link: LocalLink) {
		editingLink = link;
		editUrl = link.originalUrl;
		editTitle = link.title ?? '';
		editCustomCode = link.customCode ?? '';
		editUtmSource = link.utmSource ?? '';
		editUtmMedium = link.utmMedium ?? '';
		editUtmCampaign = link.utmCampaign ?? '';
	}

	async function saveEdit() {
		if (!editingLink || !editUrl) return;
		await linkCollection.update(editingLink.id, {
			originalUrl: editUrl,
			title: editTitle || null,
			customCode: editCustomCode || null,
			utmSource: editUtmSource || null,
			utmMedium: editUtmMedium || null,
			utmCampaign: editUtmCampaign || null,
		});
		toast.success('Link aktualisiert');
		editingLink = null;
	}

	async function toggleActive(link: LocalLink) {
		await linkCollection.update(link.id, { isActive: !link.isActive });
	}

	async function deleteLink(link: LocalLink) {
		if (!confirm(`"${link.title || link.shortCode}" wirklich löschen?`)) return;
		await linkCollection.delete(link.id);
		toast.success('Link gelöscht');
	}

	function copyShortUrl(code: string) {
		navigator.clipboard.writeText(getShortUrl(code));
		toast.success('Link kopiert!');
	}

	function downloadQr(code: string) {
		const url = `${QR_API}/?size=400x400&data=${encodeURIComponent(getShortUrl(code))}`;
		const a = document.createElement('a');
		a.href = url;
		a.download = `qr-${code}.png`;
		a.click();
	}

	const inputClass =
		'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700';
	const inputSmClass =
		'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700';
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
							class={inputClass}
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
							class={inputClass}
						/>
					</div>
					<div>
						<label for="code" class="mb-1 block text-sm font-medium">Custom Code (optional)</label>
						<input
							id="code"
							type="text"
							bind:value={newCustomCode}
							placeholder="mein-link"
							class={inputClass}
						/>
					</div>
				</div>

				<!-- UTM Parameters (collapsible) -->
				<button
					onclick={() => (showUtm = !showUtm)}
					class="mt-3 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
				>
					<svg
						class="h-4 w-4 transition-transform {showUtm ? 'rotate-90' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
					UTM-Parameter
				</button>
				{#if showUtm}
					<div class="mt-3 grid gap-3 md:grid-cols-3">
						<div>
							<label for="utm-source" class="mb-1 block text-xs font-medium opacity-70"
								>Source</label
							>
							<input
								id="utm-source"
								type="text"
								bind:value={newUtmSource}
								placeholder="newsletter"
								class={inputSmClass}
							/>
						</div>
						<div>
							<label for="utm-medium" class="mb-1 block text-xs font-medium opacity-70"
								>Medium</label
							>
							<input
								id="utm-medium"
								type="text"
								bind:value={newUtmMedium}
								placeholder="email"
								class={inputSmClass}
							/>
						</div>
						<div>
							<label for="utm-campaign" class="mb-1 block text-xs font-medium opacity-70"
								>Campaign</label
							>
							<input
								id="utm-campaign"
								type="text"
								bind:value={newUtmCampaign}
								placeholder="spring-2026"
								class={inputSmClass}
							/>
						</div>
					</div>
				{/if}

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
				class={inputSmClass}
				style="max-width: 240px"
			/>
			<select bind:value={selectedStatus} class={inputSmClass} style="max-width: 140px">
				<option value="all">Alle</option>
				<option value="active">Aktiv</option>
				<option value="inactive">Inaktiv</option>
			</select>
			{#if folders.value && folders.value.length > 0}
				<select bind:value={selectedFolderId} class={inputSmClass} style="max-width: 160px">
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
						class="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="flex items-center justify-between">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span
										class="inline-block h-2 w-2 shrink-0 rounded-full {link.isActive
											? 'bg-green-500'
											: 'bg-gray-400'}"
									></span>
									<h3 class="truncate font-semibold">{link.title || link.shortCode}</h3>
									<span
										class="shrink-0 rounded bg-indigo-100 px-2 py-0.5 font-mono text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
									>
										/{link.shortCode}
									</span>
									{#if link.utmSource || link.utmMedium || link.utmCampaign}
										<span
											class="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300"
											>UTM</span
										>
									{/if}
								</div>
								<p class="mt-1 truncate text-sm opacity-60">{link.originalUrl}</p>
							</div>

							<div class="ml-4 flex items-center gap-1">
								<a
									href="/my/analytics/{link.id}"
									class="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium opacity-60 transition-all hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-700"
									title="Analytics"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									</svg>
									{link.clickCount}
								</a>
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
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
								</button>
								<button
									onclick={() => (qrLink = link)}
									class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
									title="QR-Code"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
										/>
									</svg>
								</button>
								<button
									onclick={() => openEdit(link)}
									class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
									title="Bearbeiten"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<button
									onclick={() => toggleActive(link)}
									class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
									title={link.isActive ? 'Deaktivieren' : 'Aktivieren'}
								>
									<svg
										class="h-4 w-4 {link.isActive ? 'text-green-500' : 'text-gray-400'}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
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
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Edit Modal -->
{#if editingLink}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (editingLink = null)}
	>
		<div
			class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Link bearbeiten</h3>
				<button
					onclick={() => (editingLink = null)}
					class="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="space-y-4">
				<div>
					<label for="edit-url" class="mb-1 block text-sm font-medium">URL</label>
					<input id="edit-url" type="url" bind:value={editUrl} class={inputClass} />
				</div>
				<div>
					<label for="edit-title" class="mb-1 block text-sm font-medium">Titel</label>
					<input id="edit-title" type="text" bind:value={editTitle} class={inputClass} />
				</div>
				<div>
					<label for="edit-code" class="mb-1 block text-sm font-medium">Short Code</label>
					<div class="flex items-center gap-2">
						<span class="text-sm opacity-50">/{editingLink.shortCode}</span>
						<span class="text-xs opacity-30">(nicht änderbar)</span>
					</div>
				</div>

				<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
					<p class="mb-2 text-sm font-medium opacity-70">UTM-Parameter</p>
					<div class="grid gap-3 md:grid-cols-3">
						<input
							type="text"
							bind:value={editUtmSource}
							placeholder="Source"
							class={inputSmClass}
						/>
						<input
							type="text"
							bind:value={editUtmMedium}
							placeholder="Medium"
							class={inputSmClass}
						/>
						<input
							type="text"
							bind:value={editUtmCampaign}
							placeholder="Campaign"
							class={inputSmClass}
						/>
					</div>
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-2">
				<button
					onclick={() => (editingLink = null)}
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
				>
					Abbrechen
				</button>
				<button
					onclick={saveEdit}
					disabled={!editUrl}
					class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
				>
					Speichern
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- QR Code Modal -->
{#if qrLink}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (qrLink = null)}
	>
		<div
			class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">QR-Code</h3>
				<button
					onclick={() => (qrLink = null)}
					class="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="flex flex-col items-center gap-4">
				<div class="rounded-lg bg-white p-4">
					<img
						src="{QR_API}/?size=200x200&data={encodeURIComponent(getShortUrl(qrLink.shortCode))}"
						alt="QR Code für {qrLink.shortCode}"
						class="h-48 w-48"
					/>
				</div>
				<p class="font-mono text-sm text-indigo-600">{getShortUrl(qrLink.shortCode)}</p>
				<div class="flex w-full gap-2">
					<button
						onclick={() => {
							copyShortUrl(qrLink!.shortCode);
						}}
						class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						Link kopieren
					</button>
					<button
						onclick={() => downloadQr(qrLink!.shortCode)}
						class="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
					>
						QR herunterladen
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
