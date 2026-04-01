<script lang="ts">
	import {
		useAllLinks,
		useAllTags,
		useAllFolders,
		useAllLinkTags,
		getFilteredLinks,
		getSortedLinks,
		getLinkTags,
		generateShortCode,
		type Link,
		type StatusFilter,
	} from '$lib/modules/uload/queries';
	import { linkTable, uloadFolderTable } from '$lib/modules/uload/collections';
	import type { LocalLink } from '$lib/modules/uload/types';
	import {
		CaretRight,
		ChartBar,
		Copy,
		QrCode,
		PencilSimple,
		Lightning,
		Trash,
		X,
		Link as LinkIcon,
		FolderSimple,
		MagnifyingGlass,
	} from '@manacore/shared-icons';
	import { toast } from 'svelte-sonner';

	const QR_API = 'https://api.qrserver.com/v1/create-qr-code';

	// Reactive live queries
	const allLinks = useAllLinks();
	const allTags = useAllTags();
	const allFolders = useAllFolders();
	const allLinkTags = useAllLinkTags();

	// Filter state
	let searchQuery = $state('');
	let selectedStatus = $state<StatusFilter>('all');
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
	let showAdvanced = $state(false);
	let newExpiresAt = $state('');
	let newPassword = $state('');
	let newMaxClicks = $state('');

	// Edit modal state
	let editingLink = $state<Link | null>(null);
	let editUrl = $state('');
	let editTitle = $state('');
	let editUtmSource = $state('');
	let editUtmMedium = $state('');
	let editUtmCampaign = $state('');
	let editExpiresAt = $state('');
	let editPassword = $state('');
	let editMaxClicks = $state('');

	// QR modal state
	let qrLink = $state<Link | null>(null);

	// Derived
	const links = $derived(allLinks.value);
	const folders = $derived(allFolders.value);
	const tags = $derived(allTags.value);
	const linkTags = $derived(allLinkTags.value);

	const filteredLinks = $derived(
		getSortedLinks(
			getFilteredLinks(links, {
				search: searchQuery,
				status: selectedStatus,
				folderId: selectedFolderId ?? undefined,
			})
		)
	);

	function getShortUrl(code: string): string {
		return `https://ulo.ad/${code}`;
	}

	async function createLink() {
		if (!newUrl) return;
		const shortCode = newCustomCode || generateShortCode();
		await linkTable.add({
			id: crypto.randomUUID(),
			shortCode,
			customCode: newCustomCode || null,
			originalUrl: newUrl,
			title: newTitle || null,
			description: null,
			isActive: true,
			password: newPassword || null,
			maxClicks: newMaxClicks ? parseInt(newMaxClicks) : null,
			expiresAt: newExpiresAt || null,
			clickCount: 0,
			qrCodeUrl: null,
			utmSource: newUtmSource || null,
			utmMedium: newUtmMedium || null,
			utmCampaign: newUtmCampaign || null,
			folderId: selectedFolderId,
			order: links.length,
		} satisfies LocalLink);
		toast.success(`Link erstellt: ${shortCode}`);
		newUrl = '';
		newTitle = '';
		newCustomCode = '';
		newUtmSource = '';
		newUtmMedium = '';
		newUtmCampaign = '';
		newExpiresAt = '';
		newPassword = '';
		newMaxClicks = '';
		showUtm = false;
		showAdvanced = false;
	}

	function openEdit(link: Link) {
		editingLink = link;
		editUrl = link.originalUrl;
		editTitle = link.title ?? '';
		editUtmSource = link.utmSource ?? '';
		editUtmMedium = link.utmMedium ?? '';
		editUtmCampaign = link.utmCampaign ?? '';
		editExpiresAt = link.expiresAt ?? '';
		editPassword = link.password ?? '';
		editMaxClicks = link.maxClicks?.toString() ?? '';
	}

	async function saveEdit() {
		if (!editingLink || !editUrl) return;
		await linkTable.update(editingLink.id, {
			originalUrl: editUrl,
			title: editTitle || null,
			utmSource: editUtmSource || null,
			utmMedium: editUtmMedium || null,
			utmCampaign: editUtmCampaign || null,
			expiresAt: editExpiresAt || null,
			password: editPassword || null,
			maxClicks: editMaxClicks ? parseInt(editMaxClicks) : null,
		});
		toast.success('Link aktualisiert');
		editingLink = null;
	}

	async function toggleActive(link: Link) {
		await linkTable.update(link.id, { isActive: !link.isActive });
	}

	async function deleteLink(link: Link) {
		if (!confirm(`"${link.title || link.shortCode}" wirklich loeschen?`)) return;
		await linkTable.delete(link.id);
		toast.success('Link geloescht');
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

<svelte:head>
	<title>uLoad - ManaCore</title>
</svelte:head>

<div class="min-h-screen">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold">uLoad</h1>
				<p class="mt-1 text-sm opacity-60">
					{filteredLinks.length} Links
					{#if folders.length > 0}
						&middot; {folders.length} Ordner
					{/if}
				</p>
			</div>
			<div class="flex items-center gap-2">
				<a
					href="/uload/links"
					class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
				>
					Alle Links
				</a>
				<button
					onclick={() => (showCreateForm = !showCreateForm)}
					class="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700"
				>
					{showCreateForm ? '- Ausblenden' : '+ Neuer Link'}
				</button>
			</div>
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

				<!-- Advanced Options -->
				<button
					onclick={() => (showAdvanced = !showAdvanced)}
					class="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
				>
					<span class="transition-transform {showAdvanced ? 'rotate-90' : ''}"
						><CaretRight size={16} /></span
					>
					Erweitert
				</button>
				{#if showAdvanced}
					<div class="mt-3 grid gap-3 md:grid-cols-3">
						<div>
							<label for="expires" class="mb-1 block text-xs font-medium opacity-70"
								>Ablaufdatum</label
							>
							<input
								id="expires"
								type="datetime-local"
								bind:value={newExpiresAt}
								class={inputSmClass}
							/>
						</div>
						<div>
							<label for="password" class="mb-1 block text-xs font-medium opacity-70"
								>Passwort</label
							>
							<input
								id="password"
								type="text"
								bind:value={newPassword}
								placeholder="Optional"
								class={inputSmClass}
							/>
						</div>
						<div>
							<label for="maxclicks" class="mb-1 block text-xs font-medium opacity-70"
								>Max Klicks</label
							>
							<input
								id="maxclicks"
								type="number"
								bind:value={newMaxClicks}
								placeholder="Unbegrenzt"
								min="1"
								class={inputSmClass}
							/>
						</div>
					</div>
				{/if}

				<!-- UTM Parameters -->
				<button
					onclick={() => (showUtm = !showUtm)}
					class="mt-3 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
				>
					<span class="transition-transform {showUtm ? 'rotate-90' : ''}"
						><CaretRight size={16} /></span
					>
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
			<div class="relative">
				<MagnifyingGlass size={14} class="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Links durchsuchen..."
					class="w-60 rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
				/>
			</div>
			<select bind:value={selectedStatus} class={inputSmClass} style="max-width: 140px">
				<option value="all">Alle</option>
				<option value="active">Aktiv</option>
				<option value="inactive">Inaktiv</option>
			</select>
			{#if folders.length > 0}
				<select bind:value={selectedFolderId} class={inputSmClass} style="max-width: 160px">
					<option value={null}>Alle Ordner</option>
					{#each folders as folder}
						<option value={folder.id}>{folder.name}</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Links List -->
		{#if allLinks.loading}
			<div class="space-y-3">
				{#each Array(3) as _}
					<div class="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"></div>
				{/each}
			</div>
		{:else if filteredLinks.length === 0}
			<div
				class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600"
			>
				<LinkIcon size={48} class="mx-auto mb-4 opacity-20" />
				<p class="text-lg font-medium opacity-60">Noch keine Links</p>
				<p class="mt-1 text-sm opacity-40">Erstelle deinen ersten gekuerzten Link!</p>
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
								<div class="flex flex-wrap items-center gap-2">
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
									{#if link.password}
										<span
											class="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300"
											>Passwort</span
										>
									{/if}
									{#if link.expiresAt}
										<span
											class="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-300"
											title="Laeuft ab: {new Date(link.expiresAt).toLocaleDateString('de')}"
											>Ablauf</span
										>
									{/if}
								</div>
								<p class="mt-1 truncate text-sm opacity-60">{link.originalUrl}</p>
								{#if getLinkTags(linkTags, tags, link.id).length > 0}
									<div class="mt-1 flex gap-1">
										{#each getLinkTags(linkTags, tags, link.id) as tag}
											<span
												class="rounded px-1.5 py-0.5 text-[10px] font-medium"
												style="background: {tag.color ?? '#6b7280'}20; color: {tag.color ??
													'#6b7280'}"
											>
												{tag.name}
											</span>
										{/each}
									</div>
								{/if}
							</div>

							<div class="ml-4 flex items-center gap-1">
								<a
									href="/uload/analytics/{link.id}"
									class="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium opacity-60 transition-all hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-700"
									title="Analytics"
								>
									<ChartBar size={16} />
									{link.clickCount}
								</a>
								<button
									onclick={() => copyShortUrl(link.shortCode)}
									class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
									title="Link kopieren"
								>
									<Copy size={16} />
								</button>
								<button
									onclick={() => (qrLink = link)}
									class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
									title="QR-Code"
								>
									<QrCode size={16} />
								</button>
								<button
									onclick={() => openEdit(link)}
									class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
									title="Bearbeiten"
								>
									<PencilSimple size={16} />
								</button>
								<button
									onclick={() => toggleActive(link)}
									class="rounded-lg p-2 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
									title={link.isActive ? 'Deaktivieren' : 'Aktivieren'}
								>
									<Lightning size={16} class={link.isActive ? 'text-green-500' : 'text-gray-400'} />
								</button>
								<button
									onclick={() => deleteLink(link)}
									class="rounded-lg p-2 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
									title="Loeschen"
								>
									<Trash size={16} />
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
					<X size={20} />
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
						<span class="text-xs opacity-30">(nicht aenderbar)</span>
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

				<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
					<p class="mb-2 text-sm font-medium opacity-70">Erweitert</p>
					<div class="grid gap-3 md:grid-cols-3">
						<div>
							<label class="mb-1 block text-xs opacity-50">Ablaufdatum</label>
							<input type="datetime-local" bind:value={editExpiresAt} class={inputSmClass} />
						</div>
						<div>
							<label class="mb-1 block text-xs opacity-50">Passwort</label>
							<input
								type="text"
								bind:value={editPassword}
								placeholder="Optional"
								class={inputSmClass}
							/>
						</div>
						<div>
							<label class="mb-1 block text-xs opacity-50">Max Klicks</label>
							<input
								type="number"
								bind:value={editMaxClicks}
								placeholder="Unbegrenzt"
								min="1"
								class={inputSmClass}
							/>
						</div>
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
					<X size={20} />
				</button>
			</div>

			<div class="flex flex-col items-center gap-4">
				<div class="rounded-lg bg-white p-4">
					<img
						src="{QR_API}/?size=200x200&data={encodeURIComponent(getShortUrl(qrLink.shortCode))}"
						alt="QR Code fuer {qrLink.shortCode}"
						class="h-48 w-48"
					/>
				</div>
				<p class="font-mono text-sm text-indigo-600">{getShortUrl(qrLink.shortCode)}</p>
				<div class="flex w-full gap-2">
					<button
						onclick={() => copyShortUrl(qrLink!.shortCode)}
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
