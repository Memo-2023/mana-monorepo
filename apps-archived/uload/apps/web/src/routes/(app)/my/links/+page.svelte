<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import LinkCreationCard from '$lib/components/links/LinkCreationCard.svelte';
	import LinkList from '$lib/components/links/LinkList.svelte';
	import LinkStats from '$lib/components/links/LinkStats.svelte';
	import LinkUsageBar from '$lib/components/LinkUsageBar.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toastMessages } from '$lib/services/toast';
	import { viewModes } from '$lib/stores/viewModes';
	import { activeWorkspace } from '$lib/stores/activeWorkspace';
	import type { Tag } from '$lib/pocketbase';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let copiedStates = $state<Record<string, boolean>>({});
	let showCreateForm = $state(true);
	let successMessageVisible = $state(false);

	// Get workspace from store or data
	let currentWorkspace = $derived(activeWorkspace.getData() || data?.workspace);

	// Debug logging
	$effect(() => {
		console.log('[CLIENT LINKS] Data received:', {
			links: data?.links?.items?.length || 0,
			totalLinks: data?.links?.totalItems || 0,
			folders: data?.folders?.length || 0,
			tags: data?.tags?.length || 0,
			user: data?.user,
			workspace: data?.workspace,
			workspaceFromStore: activeWorkspace.getData(),
		});
		if (currentWorkspace) {
			console.log('[CLIENT LINKS] Current workspace:', currentWorkspace);
		}
		if (data?.links?.items?.length > 0) {
			console.log('[CLIENT LINKS] First link:', data.links.items[0]);
		}
		// Log debug info if available
		if (data?._debug) {
			console.log('[CLIENT DEBUG] Server debug info:', data._debug);
		}
	});

	// Filter states
	let searchQuery = $state(data.filters.search);
	let selectedTag = $state(data.filters.tag);
	let selectedStatus = $state(data.filters.status);
	let showFilters = $state(
		typeof window !== 'undefined' ? localStorage.getItem('showLinksFilters') === 'true' : false
	);

	// Multi-select states
	let isSelectMode = $state(false);
	let selectedLinks = $state<Set<string>>(new Set());
	let showBulkTagModal = $state(false);

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		copiedStates['main'] = true;
		toastMessages.linkCopied();
		setTimeout(() => (copiedStates['main'] = false), 2000);
	}

	function applyFilters() {
		const params = new URLSearchParams();

		if (searchQuery) params.set('search', searchQuery);
		if (selectedTag && selectedTag !== 'all') params.set('tag', selectedTag);
		if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);

		goto(`/my/links?${params.toString()}`);
	}

	function clearFilters() {
		searchQuery = '';
		selectedTag = 'all';
		selectedStatus = 'all';
		goto('/my/links');
	}

	function changePage(newPage: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', newPage.toString());
		goto(`/my/links?${params.toString()}`);
	}

	function toggleSelectMode() {
		isSelectMode = !isSelectMode;
		if (!isSelectMode) {
			selectedLinks.clear();
			selectedLinks = selectedLinks; // Trigger reactivity
		}
	}

	function toggleLinkSelection(linkId: string) {
		if (selectedLinks.has(linkId)) {
			selectedLinks.delete(linkId);
		} else {
			selectedLinks.add(linkId);
		}
		selectedLinks = selectedLinks; // Trigger reactivity
	}

	function toggleSelectAll() {
		if (selectedLinks.size === data.links.items.length) {
			selectedLinks.clear();
			selectedLinks = selectedLinks; // Trigger reactivity
		} else {
			selectedLinks = new Set(data.links.items.map((l) => l.id));
		}
	}

	async function bulkToggleActive() {
		if (selectedLinks.size === 0) return;

		const formData = new FormData();
		formData.append('action', 'bulk-toggle-active');
		formData.append('linkIds', JSON.stringify(Array.from(selectedLinks)));

		try {
			const response = await fetch('?/bulkAction', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				toastMessages.success('Links wurden aktualisiert');
				selectedLinks.clear();
				selectedLinks = selectedLinks; // Trigger reactivity
				isSelectMode = false;
				goto('/my/links', { invalidateAll: true });
			}
		} catch (error) {
			toastMessages.error('Fehler beim Aktualisieren der Links');
		}
	}

	async function bulkDelete() {
		if (selectedLinks.size === 0) return;

		if (!confirm(`Möchten Sie wirklich ${selectedLinks.size} Link(s) löschen?`)) {
			return;
		}

		const formData = new FormData();
		formData.append('action', 'bulk-delete');
		formData.append('linkIds', JSON.stringify(Array.from(selectedLinks)));

		try {
			const response = await fetch('?/bulkAction', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				toastMessages.success(`${selectedLinks.size} Link(s) wurden gelöscht`);
				selectedLinks.clear();
				selectedLinks = selectedLinks; // Trigger reactivity
				isSelectMode = false;
				goto('/my/links', { invalidateAll: true });
			}
		} catch (error) {
			toastMessages.error('Fehler beim Löschen der Links');
		}
	}

	async function applyBulkTags() {
		const modalElement = document.querySelector('[data-bulk-tag-modal]');
		if (!modalElement) return;

		const checkboxes = modalElement.querySelectorAll('input[type="checkbox"]:checked');
		const tagIds = Array.from(checkboxes).map((cb) => (cb as HTMLInputElement).value);

		if (tagIds.length === 0) {
			toastMessages.error('Bitte wählen Sie mindestens einen Tag aus');
			return;
		}

		const formData = new FormData();
		formData.append('action', 'bulk-tag');
		formData.append('linkIds', JSON.stringify(Array.from(selectedLinks)));
		formData.append('tagIds', JSON.stringify(tagIds));

		try {
			const response = await fetch('?/bulkAction', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				toastMessages.success('Tags wurden zugewiesen');
				showBulkTagModal = false;
				selectedLinks.clear();
				selectedLinks = selectedLinks; // Trigger reactivity
				isSelectMode = false;
				goto('/my/links', { invalidateAll: true });
			}
		} catch (error) {
			toastMessages.error('Fehler beim Zuweisen der Tags');
		}
	}

	function handleLinkCreated(link: any, shortUrl: string) {
		successMessageVisible = true;
		// Keep form open for continuous link creation
		setTimeout(() => (successMessageVisible = false), 5000);
		// Immediately reload the page to show the new link
		goto('/my/links', { invalidateAll: true });
	}

	$effect(() => {
		if (form?.success && form?.link) {
			handleLinkCreated(form.link, form.shortUrl);
		}
	});

	// Listen for custom events
	let editingLink = $state(null);
	let qrModalLink = $state(null);
	let showQRModal = $state(false);

	onMount(() => {
		const handleShowCreateForm = () => {
			showCreateForm = true;
		};
		const handleEditLink = (event) => {
			editingLink = event.detail;
			showCreateForm = true;
		};
		const handleShowQRModal = (event) => {
			qrModalLink = event.detail;
			showQRModal = true;
		};
		window.addEventListener('show-create-form', handleShowCreateForm);
		window.addEventListener('edit-link', handleEditLink);
		window.addEventListener('show-qr-modal', handleShowQRModal);
		return () => {
			window.removeEventListener('show-create-form', handleShowCreateForm);
			window.removeEventListener('edit-link', handleEditLink);
			window.removeEventListener('show-qr-modal', handleShowQRModal);
		};
	});

	// Save filter state to localStorage
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('showLinksFilters', showFilters.toString());
		}
	});
</script>

<div class="min-h-screen bg-theme-background">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-3xl font-bold text-theme-text">
				Links
				{#if data.links?.totalItems > 0}
					<span class="ml-2 text-2xl text-theme-text-muted">({data.links.totalItems})</span>
				{/if}
			</h1>
			<div class="flex items-center gap-2">
				{#if isSelectMode && selectedLinks.size > 0}
					<!-- Bulk action buttons -->
					<button
						onclick={() => (showBulkTagModal = true)}
						class="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text transition-all hover:bg-theme-surface-hover"
						title="Tag selected links"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
							/>
						</svg>
						<span class="font-medium">Tag</span>
					</button>
					<button
						onclick={bulkToggleActive}
						class="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text transition-all hover:bg-theme-surface-hover"
						title="Toggle active/inactive"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						<span class="font-medium">Aktivieren/Deaktivieren</span>
					</button>
					<button
						onclick={bulkDelete}
						class="flex items-center gap-2 rounded-lg border border-red-500 bg-red-50 px-3 py-2 text-red-600 transition-all hover:bg-red-100"
						title="Delete selected links"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						<span class="font-medium">Löschen ({selectedLinks.size})</span>
					</button>
					<div class="h-6 w-px bg-theme-border"></div>
				{/if}

				{#if $viewModes.links !== 'stats'}
					<button
						onclick={toggleSelectMode}
						class="flex items-center gap-2 rounded-lg border border-theme-border px-3 py-2 text-theme-text transition-all hover:bg-theme-surface-hover {isSelectMode
							? 'bg-theme-primary text-white hover:bg-theme-primary-hover'
							: 'bg-theme-surface'}"
						title={isSelectMode ? 'Exit select mode' : 'Enter select mode'}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
							/>
						</svg>
						<span class="font-medium">{isSelectMode ? 'Fertig' : 'Auswählen'}</span>
					</button>
				{/if}

				{#if $viewModes.links !== 'stats'}
					<button
						onclick={() => (showFilters = !showFilters)}
						class="flex items-center gap-2 rounded-lg border border-theme-border px-3 py-2 text-theme-text transition-all hover:bg-theme-surface-hover {showFilters
							? 'bg-theme-primary text-white hover:bg-theme-primary-hover'
							: 'bg-theme-surface'}"
						title={showFilters ? 'Hide Filters' : 'Show Filters'}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
							/>
						</svg>
						<span class="font-medium">Filter</span>
					</button>
				{/if}
				<ViewToggle
					currentView={$viewModes.links}
					onViewChange={(view) => viewModes.setLinksView(view)}
					showStats={true}
				/>
				<button
					onclick={() => (showCreateForm = !showCreateForm)}
					class="rounded-lg {showCreateForm
						? 'border border-theme-border bg-theme-surface'
						: 'bg-theme-primary'} px-4 py-2 font-medium {showCreateForm
						? 'text-theme-text'
						: 'text-white'} shadow-lg transition-all hover:scale-105 {showCreateForm
						? 'hover:bg-theme-surface-hover'
						: 'hover:bg-theme-primary-hover'}"
				>
					{showCreateForm ? '− Formular ausblenden' : '+ Neuer Link'}
				</button>
			</div>
		</div>

		<!-- Link Usage Display -->
		<LinkUsageBar user={data.user} />

		<!-- Create Form (standardmäßig sichtbar) -->
		<LinkCreationCard
			user={data.user}
			folders={data.folders}
			workspace={currentWorkspace}
			tags={data.tags}
			defaultOpen={showCreateForm}
			{editingLink}
			onSuccess={(link, shortUrl) => {
				handleLinkCreated(link, shortUrl);
				editingLink = null; // Clear editing state after success
			}}
			refreshOnSuccess={true}
		/>

		<!-- Filters (collapsible) -->
		{#if showFilters}
			<div
				class="animate-fade-in mb-6 rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl"
			>
				<h2 class="mb-4 text-lg font-semibold text-theme-text">Filters</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
					<!-- Search -->
					<div>
						<label for="search" class="mb-1 block text-sm font-medium text-theme-text">
							Search
						</label>
						<input
							type="text"
							id="search"
							bind:value={searchQuery}
							placeholder="Search links..."
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
						/>
					</div>

					<!-- Tag Filter -->
					<div>
						<label for="tag-filter" class="mb-1 block text-sm font-medium text-theme-text">
							Tag
						</label>
						<select
							id="tag-filter"
							bind:value={selectedTag}
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
						>
							<option value="all">All tags</option>
							{#each data.tags as tag}
								<option value={tag.id}>
									{tag.icon}
									{tag.name}
								</option>
							{/each}
						</select>
					</div>

					<!-- Status Filter -->
					<div>
						<label for="status-filter" class="mb-1 block text-sm font-medium text-theme-text">
							Status
						</label>
						<select
							id="status-filter"
							bind:value={selectedStatus}
							class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
						>
							<option value="all">All links</option>
							<option value="active">Active only</option>
							<option value="inactive">Inactive only</option>
						</select>
					</div>

					<!-- Action Buttons -->
					<div class="flex gap-2">
						<button
							onclick={applyFilters}
							class="rounded-lg bg-theme-primary px-4 py-2 font-medium text-white transition-colors hover:bg-theme-primary-hover"
						>
							Apply Filters
						</button>
						<button
							onclick={clearFilters}
							class="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
						>
							Clear All
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Select All checkbox when in select mode -->
		{#if isSelectMode && data.links?.items?.length > 0}
			<div
				class="mb-4 flex items-center gap-4 rounded-lg border border-theme-border bg-theme-surface p-4"
			>
				<label class="flex cursor-pointer items-center gap-2">
					<input
						type="checkbox"
						checked={selectedLinks.size === data.links.items.length}
						onchange={toggleSelectAll}
						class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary"
					/>
					<span class="font-medium text-theme-text">
						{selectedLinks.size === data.links.items.length ? 'Alle abwählen' : 'Alle auswählen'}
					</span>
				</label>
				<span class="text-theme-text-muted">
					{selectedLinks.size} von {data.links.items.length} ausgewählt
				</span>
			</div>
		{/if}

		<!-- Links List or Stats View -->
		{#if $viewModes.links === 'stats'}
			<LinkStats
				links={data.links.items}
				totalClicks={data.links.items.reduce((sum, link) => sum + (link.clicks || 0), 0)}
				period="30d"
			/>
		{:else}
			<LinkList
				links={data.links}
				username={data.user?.username}
				viewMode={$viewModes.links}
				onPageChange={changePage}
				{isSelectMode}
				{selectedLinks}
				onToggleSelect={toggleLinkSelection}
			/>
		{/if}
	</div>
</div>

<!-- Bulk Tag Modal -->
{#if showBulkTagModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-xl bg-theme-surface p-6 shadow-2xl">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-theme-text">Tags zuweisen</h3>
				<button
					onclick={() => (showBulkTagModal = false)}
					class="rounded-lg p-1 transition-colors hover:bg-theme-surface-hover"
				>
					<svg
						class="h-5 w-5 text-theme-text-muted"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div data-bulk-tag-modal class="space-y-4">
				<p class="text-sm text-theme-text-muted">
					Wählen Sie Tags für {selectedLinks.size} ausgewählte Link(s):
				</p>

				<div class="max-h-60 space-y-2 overflow-y-auto">
					{#each data.tags as tag}
						<label
							class="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-theme-surface-hover"
						>
							<input
								type="checkbox"
								value={tag.id}
								class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary"
							/>
							<span class="text-theme-text">
								{tag.icon}
								{tag.name}
							</span>
						</label>
					{/each}
				</div>

				<div class="flex gap-2">
					<button
						onclick={applyBulkTags}
						class="flex-1 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
					>
						Tags zuweisen
					</button>
					<button
						onclick={() => (showBulkTagModal = false)}
						class="flex-1 rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
					>
						Abbrechen
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- QR Code Modal -->
{#if showQRModal && qrModalLink}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-xl bg-theme-surface p-6 shadow-2xl">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-theme-text">QR Code</h3>
				<button
					onclick={() => {
						showQRModal = false;
						qrModalLink = null;
					}}
					class="rounded-lg p-1 transition-colors hover:bg-theme-surface-hover"
				>
					<svg
						class="h-5 w-5 text-theme-text-muted"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
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
						src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encodeURIComponent(
							window.location.origin + '/' + qrModalLink.short_code
						)}"
						alt="QR Code"
						class="h-48 w-48"
					/>
				</div>

				<div class="text-center">
					<p class="mb-2 text-sm text-theme-text-muted">Scan to visit:</p>
					<p class="font-mono text-sm text-theme-primary">
						{window.location.origin}/{qrModalLink.short_code}
					</p>
				</div>

				<div class="flex w-full gap-2">
					<button
						onclick={() => {
							const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(window.location.origin + '/' + qrModalLink.short_code)}`;
							const a = document.createElement('a');
							a.href = url;
							a.download = `qr-${qrModalLink.short_code}.png`;
							a.click();
						}}
						class="flex-1 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
					>
						Download QR
					</button>
					<button
						onclick={() => {
							showQRModal = false;
							qrModalLink = null;
						}}
						class="flex-1 rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
