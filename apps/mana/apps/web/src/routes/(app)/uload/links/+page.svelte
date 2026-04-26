<script lang="ts">
	import { _ } from 'svelte-i18n';
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
	import { linkTable } from '$lib/modules/uload/collections';
	import type { LocalLink } from '$lib/modules/uload/types';
	import {
		ArrowLeft,
		ChartBar,
		Copy,
		QrCode,
		PencilSimple,
		Lightning,
		Trash,
		MagnifyingGlass,
		Link as LinkIcon,
	} from '@mana/shared-icons';
	import { toast } from '$lib/stores/toast.svelte';
	import { RoutePage } from '$lib/components/shell';

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

	// Bulk selection
	let selectMode = $state(false);
	let selectedIds = $state<Set<string>>(new Set());

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

	const ULOAD_DOMAIN = import.meta.env.PUBLIC_ULOAD_DOMAIN || 'ulo.ad';

	function getShortUrl(code: string): string {
		return `https://${ULOAD_DOMAIN}/${code}`;
	}

	function copyShortUrl(code: string) {
		navigator.clipboard.writeText(getShortUrl(code));
		toast.success($_('uload.links_route.toast_copied'));
	}

	async function toggleActive(link: Link) {
		await linkTable.update(link.id, { isActive: !link.isActive });
	}

	async function deleteLink(link: Link) {
		const name = link.title || link.shortCode;
		if (!confirm($_('uload.links_route.confirm_delete_single', { values: { name } }))) return;
		await linkTable.delete(link.id);
		toast.success($_('uload.links_route.toast_deleted_single'));
	}

	// Bulk actions
	function toggleSelect(id: string) {
		if (selectedIds.has(id)) {
			selectedIds.delete(id);
		} else {
			selectedIds.add(id);
		}
		selectedIds = selectedIds;
	}

	function toggleSelectAll() {
		if (selectedIds.size === filteredLinks.length) {
			selectedIds.clear();
		} else {
			selectedIds = new Set(filteredLinks.map((l) => l.id));
		}
		selectedIds = selectedIds;
	}

	async function bulkDelete() {
		const count = selectedIds.size;
		if (!confirm($_('uload.links_route.confirm_bulk_delete', { values: { count } }))) return;
		for (const id of selectedIds) {
			await linkTable.delete(id);
		}
		toast.success($_('uload.links_route.toast_bulk_deleted', { values: { count } }));
		selectedIds.clear();
		selectedIds = selectedIds;
		selectMode = false;
	}

	async function bulkToggleActive() {
		const count = selectedIds.size;
		for (const id of selectedIds) {
			const link = filteredLinks.find((l) => l.id === id);
			if (link) await linkTable.update(id, { isActive: !link.isActive });
		}
		toast.success($_('uload.links_route.toast_bulk_updated', { values: { count } }));
		selectedIds.clear();
		selectedIds = selectedIds;
		selectMode = false;
	}

	const inputSmClass =
		'w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-border dark:bg-muted';
</script>

<svelte:head>
	<title>{$_('uload.links_route.title')}</title>
</svelte:head>

<RoutePage appId="uload" backHref="/uload">
	<div class="min-h-screen">
		<div class="mx-auto max-w-7xl">
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a
						href="/uload"
						class="rounded-lg p-2 hover:bg-muted dark:hover:bg-muted"
						title={$_('uload.links_route.action_back_title')}
					>
						<ArrowLeft size={20} />
					</a>
					<div>
						<h1 class="text-2xl font-bold">
							{$_('uload.links_route.heading')}
							{#if filteredLinks.length > 0}
								<span class="ml-1 text-xl opacity-50">({filteredLinks.length})</span>
							{/if}
						</h1>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() => {
							selectMode = !selectMode;
							if (!selectMode) {
								selectedIds.clear();
								selectedIds = selectedIds;
							}
						}}
						class="rounded-lg border border-border-strong px-3 py-2 text-sm font-medium transition-colors {selectMode
							? 'bg-indigo-600 text-white'
							: 'hover:bg-muted dark:border-border dark:hover:bg-muted'}"
					>
						{selectMode
							? $_('uload.links_route.action_select_done')
							: $_('uload.links_route.action_select_start')}
					</button>
				</div>
			</div>

			<!-- Filters -->
			<div class="mb-4 flex flex-wrap items-center gap-3">
				<div class="relative">
					<MagnifyingGlass
						size={14}
						class="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40"
					/>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={$_('uload.links_route.placeholder_search')}
						class="w-60 rounded-lg border border-border-strong bg-white py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-border dark:bg-muted"
					/>
				</div>
				<select bind:value={selectedStatus} class={inputSmClass} style="max-width: 140px">
					<option value="all">{$_('uload.links_route.option_all')}</option>
					<option value="active">{$_('uload.links_route.option_active')}</option>
					<option value="inactive">{$_('uload.links_route.option_inactive')}</option>
				</select>
				{#if folders.length > 0}
					<select bind:value={selectedFolderId} class={inputSmClass} style="max-width: 160px">
						<option value={null}>{$_('uload.links_route.option_all_folders')}</option>
						{#each folders as folder}
							<option value={folder.id}>{folder.name}</option>
						{/each}
					</select>
				{/if}
			</div>

			<!-- Bulk Actions Bar -->
			{#if selectMode && selectedIds.size > 0}
				<div
					class="mb-4 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20"
				>
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={selectedIds.size === filteredLinks.length}
							onchange={toggleSelectAll}
							class="h-4 w-4 rounded"
						/>
						<span class="text-sm font-medium"
							>{$_('uload.links_route.selected_count', {
								values: { count: selectedIds.size },
							})}</span
						>
					</label>
					<div class="h-4 w-px bg-indigo-300 dark:bg-indigo-700"></div>
					<button
						onclick={bulkToggleActive}
						class="rounded px-3 py-1 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800"
						>{$_('uload.links_route.action_bulk_toggle')}</button
					>
					<button
						onclick={bulkDelete}
						class="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
						>{$_('uload.links_route.action_bulk_delete')}</button
					>
				</div>
			{/if}

			<!-- Links List -->
			{#if allLinks.loading}
				<div class="space-y-3">
					{#each Array(5) as _}
						<div class="h-20 animate-pulse rounded-xl bg-muted dark:bg-card"></div>
					{/each}
				</div>
			{:else if filteredLinks.length === 0}
				<div
					class="rounded-xl border-2 border-dashed border-border-strong p-12 text-center dark:border-border"
				>
					<LinkIcon size={48} class="mx-auto mb-4 opacity-20" />
					<p class="text-lg font-medium opacity-60">{$_('uload.links_route.empty_title')}</p>
					{#if searchQuery || selectedStatus !== 'all' || selectedFolderId}
						<p class="mt-1 text-sm opacity-40">{$_('uload.links_route.empty_filtered')}</p>
					{:else}
						<p class="mt-1 text-sm opacity-40">{$_('uload.links_route.empty_root')}</p>
					{/if}
				</div>
			{:else}
				<div class="space-y-3">
					{#each filteredLinks as link (link.id)}
						<div
							class="group rounded-xl border border-border-strong bg-white p-4 shadow-sm transition-colors hover:shadow-md dark:border-border dark:bg-card"
						>
							<div class="flex items-center justify-between">
								{#if selectMode}
									<input
										type="checkbox"
										checked={selectedIds.has(link.id)}
										onchange={() => toggleSelect(link.id)}
										class="mr-3 h-4 w-4 shrink-0 rounded"
									/>
								{/if}
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-2">
										<span
											class="inline-block h-2 w-2 shrink-0 rounded-full {link.isActive
												? 'bg-green-500'
												: 'bg-muted'}"
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
										class="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium opacity-60 transition-colors hover:bg-muted hover:opacity-100 dark:hover:bg-muted"
										title={$_('uload.links_route.action_analytics_title')}
									>
										<ChartBar size={16} />
										{link.clickCount}
									</a>
									<button
										onclick={() => copyShortUrl(link.shortCode)}
										class="rounded-lg p-2 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100 dark:hover:bg-muted"
										title={$_('uload.links_route.action_copy_title')}
									>
										<Copy size={16} />
									</button>
									<button
										onclick={() => toggleActive(link)}
										class="rounded-lg p-2 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100 dark:hover:bg-muted"
										title={link.isActive
											? $_('uload.links_route.action_deactivate_title')
											: $_('uload.links_route.action_activate_title')}
									>
										<Lightning
											size={16}
											class={link.isActive ? 'text-green-500' : 'text-muted-foreground'}
										/>
									</button>
									<button
										onclick={() => deleteLink(link)}
										class="rounded-lg p-2 opacity-0 transition-colors hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
										title={$_('uload.links_route.action_delete_title')}
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
</RoutePage>
