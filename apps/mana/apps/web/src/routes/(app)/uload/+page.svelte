<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
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
	import { linkTable, uloadFolderTable } from '$lib/modules/uload/collections';
	import { encryptRecord } from '$lib/data/crypto';
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

	const ULOAD_DOMAIN = import.meta.env.PUBLIC_ULOAD_DOMAIN || 'ulo.ad';

	function getShortUrl(code: string): string {
		return `https://${ULOAD_DOMAIN}/${code}`;
	}

	function isValidUrl(url: string): boolean {
		try {
			const parsed = new URL(url);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:';
		} catch {
			return false;
		}
	}

	function isValidCustomCode(code: string): boolean {
		return /^[a-zA-Z0-9_-]+$/.test(code);
	}

	async function isShortCodeUnique(code: string): Promise<boolean> {
		const existing = await linkTable.where('shortCode').equals(code).first();
		return !existing;
	}

	async function createLink() {
		if (!newUrl) return;

		if (!isValidUrl(newUrl)) {
			toast.error($_('uload.page.err_invalid_url_input'));
			return;
		}

		const shortCode = newCustomCode || generateShortCode();

		if (newCustomCode && !isValidCustomCode(newCustomCode)) {
			toast.error($_('uload.page.err_invalid_custom_code'));
			return;
		}

		if (!(await isShortCodeUnique(shortCode))) {
			toast.error($_('uload.page.err_short_code_taken', { values: { code: shortCode } }));
			return;
		}

		const maxClicks = newMaxClicks ? parseInt(newMaxClicks) : null;
		if (maxClicks !== null && maxClicks < 1) {
			toast.error($_('uload.page.err_max_clicks'));
			return;
		}

		if (newExpiresAt && new Date(newExpiresAt) <= new Date()) {
			toast.error($_('uload.page.err_expires_past'));
			return;
		}

		const newRow: LocalLink = {
			id: crypto.randomUUID(),
			shortCode,
			customCode: newCustomCode || null,
			originalUrl: newUrl,
			title: newTitle || null,
			description: null,
			isActive: true,
			password: newPassword || null,
			maxClicks,
			expiresAt: newExpiresAt || null,
			clickCount: 0,
			qrCodeUrl: null,
			utmSource: newUtmSource || null,
			utmMedium: newUtmMedium || null,
			utmCampaign: newUtmCampaign || null,
			folderId: selectedFolderId,
			order: links.length,
		};
		await encryptRecord('links', newRow);
		await linkTable.add(newRow);
		toast.success($_('uload.page.toast_created', { values: { code: shortCode } }));
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

		if (!isValidUrl(editUrl)) {
			toast.error($_('uload.page.err_invalid_url_input'));
			return;
		}

		const maxClicks = editMaxClicks ? parseInt(editMaxClicks) : null;
		if (maxClicks !== null && maxClicks < 1) {
			toast.error($_('uload.page.err_max_clicks'));
			return;
		}

		if (editExpiresAt && new Date(editExpiresAt) <= new Date()) {
			toast.error($_('uload.page.err_expires_past'));
			return;
		}

		const diff: Record<string, unknown> = {
			originalUrl: editUrl,
			title: editTitle || null,
			utmSource: editUtmSource || null,
			utmMedium: editUtmMedium || null,
			utmCampaign: editUtmCampaign || null,
			expiresAt: editExpiresAt || null,
			password: editPassword || null,
			maxClicks,
		};
		await encryptRecord('links', diff);
		await linkTable.update(editingLink.id, diff);
		toast.success($_('uload.page.toast_updated'));
		editingLink = null;
	}

	async function toggleActive(link: Link) {
		await linkTable.update(link.id, { isActive: !link.isActive });
	}

	async function deleteLink(link: Link) {
		const name = link.title || link.shortCode;
		if (!confirm($_('uload.page.confirm_delete', { values: { name } }))) return;
		await linkTable.delete(link.id);
		toast.success($_('uload.page.toast_deleted'));
	}

	function copyShortUrl(code: string) {
		navigator.clipboard.writeText(getShortUrl(code));
		toast.success($_('uload.page.toast_copied'));
	}

	function downloadQr(code: string) {
		const url = `${QR_API}/?size=400x400&data=${encodeURIComponent(getShortUrl(code))}`;
		const a = document.createElement('a');
		a.href = url;
		a.download = `qr-${code}.png`;
		a.click();
	}

	const inputClass =
		'w-full rounded-lg border border-border-strong bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-border dark:bg-muted';
	const inputSmClass =
		'w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-border dark:bg-muted';
</script>

<svelte:head>
	<title>{$_('uload.page.title')}</title>
</svelte:head>

<RoutePage appId="uload">
	<div class="min-h-screen">
		<div class="mx-auto max-w-7xl">
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold">uLoad</h1>
					<p class="mt-1 text-sm opacity-60">
						{folders.length > 0
							? $_('uload.page.counts', {
									values: { links: filteredLinks.length, folders: folders.length },
								})
							: $_('uload.page.counts_no_folders', {
									values: { links: filteredLinks.length },
								})}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<a
						href="/uload/links"
						class="rounded-lg border border-border-strong px-3 py-2 text-sm font-medium hover:bg-muted dark:border-border dark:hover:bg-muted"
					>
						{$_('uload.page.all_links')}
					</a>
					<button
						onclick={() => (showCreateForm = !showCreateForm)}
						class="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-lg transition-[transform,colors,box-shadow] hover:scale-105 hover:bg-indigo-700"
					>
						{showCreateForm ? $_('uload.page.hide_form') : $_('uload.page.show_form')}
					</button>
				</div>
			</div>

			<!-- Create Form -->
			{#if showCreateForm}
				<div
					class="mb-6 rounded-xl border border-border-strong bg-white p-6 shadow-sm dark:border-border dark:bg-card"
				>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="md:col-span-2">
							<label for="url" class="mb-1 block text-sm font-medium"
								>{$_('uload.page.label_url_modal')}</label
							>
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
							<label for="title" class="mb-1 block text-sm font-medium"
								>{$_('uload.page.label_title')}</label
							>
							<input
								id="title"
								type="text"
								bind:value={newTitle}
								placeholder={$_('uload.page.placeholder_title')}
								class={inputClass}
							/>
						</div>
						<div>
							<label for="code" class="mb-1 block text-sm font-medium"
								>{$_('uload.page.label_custom_code')}</label
							>
							<input
								id="code"
								type="text"
								bind:value={newCustomCode}
								placeholder={$_('uload.page.placeholder_custom_code')}
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
						{$_('uload.page.section_advanced')}
					</button>
					{#if showAdvanced}
						<div class="mt-3 grid gap-3 md:grid-cols-3">
							<div>
								<label for="expires" class="mb-1 block text-xs font-medium opacity-70"
									>{$_('uload.page.label_expires')}</label
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
									>{$_('uload.page.label_password')}</label
								>
								<input
									id="password"
									type="text"
									bind:value={newPassword}
									placeholder={$_('uload.page.placeholder_optional')}
									class={inputSmClass}
								/>
							</div>
							<div>
								<label for="maxclicks" class="mb-1 block text-xs font-medium opacity-70"
									>{$_('uload.page.label_max_clicks')}</label
								>
								<input
									id="maxclicks"
									type="number"
									bind:value={newMaxClicks}
									placeholder={$_('uload.page.placeholder_unlimited')}
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
						{$_('uload.page.section_utm')}
					</button>
					{#if showUtm}
						<div class="mt-3 grid gap-3 md:grid-cols-3">
							<div>
								<label for="utm-source" class="mb-1 block text-xs font-medium opacity-70"
									>{$_('uload.page.label_source')}</label
								>
								<input
									id="utm-source"
									type="text"
									bind:value={newUtmSource}
									placeholder={$_('uload.page.placeholder_source')}
									class={inputSmClass}
								/>
							</div>
							<div>
								<label for="utm-medium" class="mb-1 block text-xs font-medium opacity-70"
									>{$_('uload.page.label_medium')}</label
								>
								<input
									id="utm-medium"
									type="text"
									bind:value={newUtmMedium}
									placeholder={$_('uload.page.placeholder_medium')}
									class={inputSmClass}
								/>
							</div>
							<div>
								<label for="utm-campaign" class="mb-1 block text-xs font-medium opacity-70"
									>{$_('uload.page.label_campaign')}</label
								>
								<input
									id="utm-campaign"
									type="text"
									bind:value={newUtmCampaign}
									placeholder={$_('uload.page.placeholder_campaign')}
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
							{$_('uload.page.action_create')}
						</button>
					</div>
				</div>
			{/if}

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
						placeholder={$_('uload.page.placeholder_search')}
						class="w-60 rounded-lg border border-border-strong bg-white py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-border dark:bg-muted"
					/>
				</div>
				<select bind:value={selectedStatus} class={inputSmClass} style="max-width: 140px">
					<option value="all">{$_('uload.page.option_all')}</option>
					<option value="active">{$_('uload.page.option_active')}</option>
					<option value="inactive">{$_('uload.page.option_inactive')}</option>
				</select>
				{#if folders.length > 0}
					<select bind:value={selectedFolderId} class={inputSmClass} style="max-width: 160px">
						<option value={null}>{$_('uload.page.option_all_folders')}</option>
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
						<div class="h-20 animate-pulse rounded-xl bg-muted dark:bg-card"></div>
					{/each}
				</div>
			{:else if filteredLinks.length === 0}
				<div
					class="rounded-xl border-2 border-dashed border-border-strong p-12 text-center dark:border-border"
				>
					<LinkIcon size={48} class="mx-auto mb-4 opacity-20" />
					<p class="text-lg font-medium opacity-60">{$_('uload.page.empty_title')}</p>
					<p class="mt-1 text-sm opacity-40">{$_('uload.page.empty_desc')}</p>
					<button
						onclick={() => (showCreateForm = true)}
						class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
					>
						{$_('uload.page.show_form')}
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each filteredLinks as link (link.id)}
						<div
							class="group rounded-xl border border-border-strong bg-white p-4 shadow-sm transition-colors hover:shadow-md dark:border-border dark:bg-card"
						>
							<div class="flex items-center justify-between">
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
												>{$_('uload.page.badge_utm')}</span
											>
										{/if}
										{#if link.password}
											<span
												class="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300"
												>{$_('uload.page.badge_password')}</span
											>
										{/if}
										{#if link.expiresAt}
											<span
												class="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-300"
												title={$_('uload.page.badge_expires_title', {
													values: { date: formatDate(new Date(link.expiresAt)) },
												})}>{$_('uload.page.badge_expires')}</span
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
										title={$_('uload.page.action_analytics_title')}
									>
										<ChartBar size={16} />
										{link.clickCount}
									</a>
									<button
										onclick={() => copyShortUrl(link.shortCode)}
										class="rounded-lg p-2 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100 dark:hover:bg-muted"
										title={$_('uload.page.action_copy_title')}
									>
										<Copy size={16} />
									</button>
									<button
										onclick={() => (qrLink = link)}
										class="rounded-lg p-2 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100 dark:hover:bg-muted"
										title={$_('uload.page.action_qr_title')}
									>
										<QrCode size={16} />
									</button>
									<button
										onclick={() => openEdit(link)}
										class="rounded-lg p-2 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100 dark:hover:bg-muted"
										title={$_('uload.page.action_edit_title')}
									>
										<PencilSimple size={16} />
									</button>
									<button
										onclick={() => toggleActive(link)}
										class="rounded-lg p-2 opacity-0 transition-colors hover:bg-muted group-hover:opacity-100 dark:hover:bg-muted"
										title={link.isActive
											? $_('uload.page.action_deactivate_title')
											: $_('uload.page.action_activate_title')}
									>
										<Lightning
											size={16}
											class={link.isActive ? 'text-green-500' : 'text-muted-foreground'}
										/>
									</button>
									<button
										onclick={() => deleteLink(link)}
										class="rounded-lg p-2 opacity-0 transition-colors hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
										title={$_('uload.page.action_delete_title')}
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

<!-- Edit Modal -->
{#if editingLink}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (editingLink = null)}
		onkeydown={(e) => e.key === 'Escape' && (editingLink = null)}
		tabindex="-1"
		role="presentation"
	>
		<div
			class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-card"
			onclick={(e) => e.stopPropagation()}
			role="none"
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">{$_('uload.page.modal_edit_title')}</h3>
				<button
					onclick={() => (editingLink = null)}
					class="rounded-lg p-1 hover:bg-muted dark:hover:bg-muted"
				>
					<X size={20} />
				</button>
			</div>

			<div class="space-y-4">
				<div>
					<label for="edit-url" class="mb-1 block text-sm font-medium"
						>{$_('uload.page.label_url_modal')}</label
					>
					<input id="edit-url" type="url" bind:value={editUrl} class={inputClass} />
				</div>
				<div>
					<label for="edit-title" class="mb-1 block text-sm font-medium"
						>{$_('uload.page.label_title_modal')}</label
					>
					<input id="edit-title" type="text" bind:value={editTitle} class={inputClass} />
				</div>
				<div>
					<label for="edit-code" class="mb-1 block text-sm font-medium"
						>{$_('uload.page.label_short_code_modal')}</label
					>
					<div class="flex items-center gap-2">
						<span class="text-sm opacity-50">/{editingLink.shortCode}</span>
						<span class="text-xs opacity-30">{$_('uload.page.short_code_locked')}</span>
					</div>
				</div>

				<div class="border-t border-border-strong pt-4 dark:border-border">
					<p class="mb-2 text-sm font-medium opacity-70">{$_('uload.page.section_utm')}</p>
					<div class="grid gap-3 md:grid-cols-3">
						<input
							type="text"
							bind:value={editUtmSource}
							placeholder={$_('uload.page.label_source')}
							class={inputSmClass}
						/>
						<input
							type="text"
							bind:value={editUtmMedium}
							placeholder={$_('uload.page.label_medium')}
							class={inputSmClass}
						/>
						<input
							type="text"
							bind:value={editUtmCampaign}
							placeholder={$_('uload.page.label_campaign')}
							class={inputSmClass}
						/>
					</div>
				</div>

				<div class="border-t border-border-strong pt-4 dark:border-border">
					<p class="mb-2 text-sm font-medium opacity-70">{$_('uload.page.section_advanced')}</p>
					<div class="grid gap-3 md:grid-cols-3">
						<div>
							<label for="uload-expires-at" class="mb-1 block text-xs opacity-50"
								>{$_('uload.page.label_expires')}</label
							>
							<input
								id="uload-expires-at"
								type="datetime-local"
								bind:value={editExpiresAt}
								class={inputSmClass}
							/>
						</div>
						<div>
							<label for="uload-password" class="mb-1 block text-xs opacity-50"
								>{$_('uload.page.label_password')}</label
							>
							<input
								id="uload-password"
								type="text"
								bind:value={editPassword}
								placeholder={$_('uload.page.placeholder_optional')}
								class={inputSmClass}
							/>
						</div>
						<div>
							<label for="uload-max-clicks" class="mb-1 block text-xs opacity-50"
								>{$_('uload.page.label_max_clicks')}</label
							>
							<input
								id="uload-max-clicks"
								type="number"
								bind:value={editMaxClicks}
								placeholder={$_('uload.page.placeholder_unlimited')}
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
					class="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium hover:bg-muted dark:border-border dark:hover:bg-muted"
				>
					{$_('uload.page.action_cancel')}
				</button>
				<button
					onclick={saveEdit}
					disabled={!editUrl}
					class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
				>
					{$_('uload.page.action_save')}
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
		onkeydown={(e) => e.key === 'Escape' && (qrLink = null)}
		tabindex="-1"
		role="presentation"
	>
		<div
			class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-card"
			onclick={(e) => e.stopPropagation()}
			role="none"
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">{$_('uload.page.modal_qr_title')}</h3>
				<button
					onclick={() => (qrLink = null)}
					class="rounded-lg p-1 hover:bg-muted dark:hover:bg-muted"
				>
					<X size={20} />
				</button>
			</div>

			<div class="flex flex-col items-center gap-4">
				<div class="rounded-lg bg-white p-4">
					<img
						src="{QR_API}/?size=200x200&data={encodeURIComponent(getShortUrl(qrLink.shortCode))}"
						alt={$_('uload.page.qr_alt', { values: { code: qrLink.shortCode } })}
						class="h-48 w-48"
					/>
				</div>
				<p class="font-mono text-sm text-indigo-600">{getShortUrl(qrLink.shortCode)}</p>
				<div class="flex w-full gap-2">
					<button
						onclick={() => copyShortUrl(qrLink!.shortCode)}
						class="flex-1 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium hover:bg-muted dark:border-border dark:hover:bg-muted"
					>
						{$_('uload.page.action_copy_link')}
					</button>
					<button
						onclick={() => downloadQr(qrLink!.shortCode)}
						class="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
					>
						{$_('uload.page.action_download_qr')}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
