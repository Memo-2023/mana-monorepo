<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { viewModeStore } from '$lib/stores/view-mode.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
	import { goto } from '$app/navigation';
	import ContactListView from '$lib/components/views/ContactListView.svelte';
	import ContactGridView from '$lib/components/views/ContactGridView.svelte';
	import ContactAlphabetView from '$lib/components/views/ContactAlphabetView.svelte';
	import { ContactListSkeleton, ContactGridSkeleton } from '$lib/components/skeletons';
	import { batchApi } from '$lib/api/batch';
	import { toasts } from '$lib/stores/toast';

	// Infinite scroll
	let intersectionObserver: IntersectionObserver | null = null;
	let loadMoreTrigger: HTMLDivElement;

	// Batch selection state
	let selectionMode = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let batchLoading = $state(false);

	// Derived state for selection
	let allSelected = $derived(
		contactsStore.contacts.length > 0 && contactsStore.contacts.every((c) => selectedIds.has(c.id))
	);

	// Helper functions for birthday filtering
	function isBirthdayToday(birthday: string | null | undefined): boolean {
		if (!birthday) return false;
		const today = new Date();
		const bday = new Date(birthday);
		return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth();
	}

	function isBirthdayThisWeek(birthday: string | null | undefined): boolean {
		if (!birthday) return false;
		const today = new Date();
		const bday = new Date(birthday);
		// Set birthday to current year
		bday.setFullYear(today.getFullYear());
		// Get start and end of current week
		const startOfWeek = new Date(today);
		startOfWeek.setDate(today.getDate() - today.getDay());
		startOfWeek.setHours(0, 0, 0, 0);
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6);
		endOfWeek.setHours(23, 59, 59, 999);
		return bday >= startOfWeek && bday <= endOfWeek;
	}

	function isBirthdayThisMonth(birthday: string | null | undefined): boolean {
		if (!birthday) return false;
		const today = new Date();
		const bday = new Date(birthday);
		return bday.getMonth() === today.getMonth();
	}

	function isContactIncomplete(contact: (typeof contactsStore.contacts)[0]): boolean {
		return !contact.phone && !contact.mobile && !contact.email;
	}

	// Filtered and sorted contacts (using filter store)
	let filteredContacts = $derived.by(() => {
		let result = [...contactsStore.contacts];

		// Apply search filter from InputBar
		const searchQuery = contactsFilterStore.searchQuery?.toLowerCase().trim();
		if (searchQuery) {
			result = result.filter((c) => {
				const searchFields = [
					c.firstName,
					c.lastName,
					c.displayName,
					c.nickname,
					c.company,
					c.email,
					c.phone,
					c.mobile,
					c.city,
				];
				return searchFields.some((field) => field?.toLowerCase().includes(searchQuery));
			});
		}

		// Apply contact filter from store
		const contactFilter = contactsFilterStore.contactFilter;
		if (contactFilter === 'favorites') {
			result = result.filter((c) => c.isFavorite);
		} else if (contactFilter === 'hasPhone') {
			result = result.filter((c) => c.phone || c.mobile);
		} else if (contactFilter === 'hasEmail') {
			result = result.filter((c) => c.email);
		} else if (contactFilter === 'incomplete') {
			result = result.filter((c) => isContactIncomplete(c));
		}

		// Apply birthday filter from store
		const birthdayFilter = contactsFilterStore.birthdayFilter;
		if (birthdayFilter === 'today') {
			result = result.filter((c) => isBirthdayToday(c.birthday));
		} else if (birthdayFilter === 'thisWeek') {
			result = result.filter((c) => isBirthdayThisWeek(c.birthday));
		} else if (birthdayFilter === 'thisMonth') {
			result = result.filter((c) => isBirthdayThisMonth(c.birthday));
		}

		// Apply company filter from store
		const selectedCompany = contactsFilterStore.selectedCompany;
		if (selectedCompany) {
			result = result.filter((c) => c.company === selectedCompany);
		}

		return result;
	});

	// Sorted contacts based on selected sort field from store
	let sortedContacts = $derived.by(() => {
		const sortField = contactsFilterStore.sortField;
		return [...filteredContacts].sort((a, b) => {
			const aValue =
				(sortField === 'firstName'
					? a.firstName || a.lastName || a.displayName || a.email
					: a.lastName || a.firstName || a.displayName || a.email
				)?.toLowerCase() || '';
			const bValue =
				(sortField === 'firstName'
					? b.firstName || b.lastName || b.displayName || b.email
					: b.lastName || b.firstName || b.displayName || b.email
				)?.toLowerCase() || '';
			return aValue.localeCompare(bValue, 'de');
		});
	});

	async function handleToggleFavorite(e: MouseEvent, id: string) {
		e.stopPropagation();
		await contactsStore.toggleFavorite(id);
	}

	function handleContactClick(id: string) {
		if (selectionMode) {
			toggleSelection(id);
		} else {
			goto(`/contacts/${id}`);
		}
	}

	function toggleSelectionMode() {
		selectionMode = !selectionMode;
		if (!selectionMode) {
			selectedIds = new Set();
		}
	}

	function toggleSelection(id: string) {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedIds = newSet;
	}

	function toggleSelectAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(contactsStore.contacts.map((c) => c.id));
		}
	}

	async function handleBatchDelete() {
		if (selectedIds.size === 0) return;
		if (!confirm(`${selectedIds.size} Kontakte wirklich löschen?`)) return;

		batchLoading = true;
		try {
			const result = await batchApi.deleteMany([...selectedIds]);
			toasts.success(`${result.success} Kontakte gelöscht`);
			selectedIds = new Set();
			selectionMode = false;
			await contactsStore.loadContacts();
		} catch (e) {
			toasts.error(e instanceof Error ? e.message : 'Fehler beim Löschen');
		} finally {
			batchLoading = false;
		}
	}

	async function handleBatchArchive() {
		if (selectedIds.size === 0) return;

		batchLoading = true;
		try {
			const result = await batchApi.archiveMany([...selectedIds], true);
			toasts.success(`${result.success} Kontakte archiviert`);
			selectedIds = new Set();
			selectionMode = false;
			await contactsStore.loadContacts();
		} catch (e) {
			toasts.error(e instanceof Error ? e.message : 'Fehler beim Archivieren');
		} finally {
			batchLoading = false;
		}
	}

	async function handleBatchFavorite() {
		if (selectedIds.size === 0) return;

		batchLoading = true;
		try {
			const result = await batchApi.favoriteMany([...selectedIds], true);
			toasts.success(`${result.success} Kontakte zu Favoriten hinzugefügt`);
			selectedIds = new Set();
			selectionMode = false;
			await contactsStore.loadContacts();
		} catch (e) {
			toasts.error(e instanceof Error ? e.message : 'Fehler');
		} finally {
			batchLoading = false;
		}
	}

	function setupInfiniteScroll() {
		if (intersectionObserver) {
			intersectionObserver.disconnect();
		}

		intersectionObserver = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting && contactsStore.hasMore && !contactsStore.loadingMore) {
					contactsStore.loadMore();
				}
			},
			{
				rootMargin: '200px',
				threshold: 0.1,
			}
		);

		if (loadMoreTrigger) {
			intersectionObserver.observe(loadMoreTrigger);
		}
	}

	onMount(async () => {
		// Only load if not already loaded
		if (contactsStore.contacts.length === 0) {
			await contactsStore.loadContacts();
		}

		// Setup infinite scroll after DOM is ready
		setupInfiniteScroll();
	});

	onDestroy(() => {
		if (intersectionObserver) {
			intersectionObserver.disconnect();
		}
	});

	// Re-setup observer when trigger element changes
	$effect(() => {
		if (loadMoreTrigger && intersectionObserver) {
			intersectionObserver.disconnect();
			intersectionObserver.observe(loadMoreTrigger);
		}
	});

	// Reload contacts when tag filter changes (tag filtering is server-side)
	let lastTagId: string | null = null;
	$effect(() => {
		const currentTagId = contactsFilterStore.selectedTagId;
		if (currentTagId !== lastTagId) {
			lastTagId = currentTagId;
			if (currentTagId) {
				contactsStore.setTagId(currentTagId);
			} else {
				contactsStore.setTagId(undefined);
			}
			contactsStore.loadContacts();
		}
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<h1 class="text-2xl font-bold text-foreground">{$_('contacts.title')}</h1>

	<!-- Batch Actions Bar (shown when in selection mode) -->
	{#if selectionMode}
		<div class="batch-actions-bar">
			<div class="flex items-center gap-3">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={allSelected}
						onchange={toggleSelectAll}
						class="w-5 h-5 rounded border-2 border-border text-primary focus:ring-primary"
					/>
					<span class="text-sm text-muted-foreground">
						{#if selectedIds.size === 0}
							Alle auswählen
						{:else}
							{selectedIds.size} ausgewählt
						{/if}
					</span>
				</label>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={handleBatchFavorite}
					disabled={batchLoading || selectedIds.size === 0}
					class="batch-btn"
					title="Zu Favoriten hinzufügen"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
					<span class="hidden sm:inline">Favoriten</span>
				</button>
				<button
					type="button"
					onclick={handleBatchArchive}
					disabled={batchLoading || selectedIds.size === 0}
					class="batch-btn"
					title="Archivieren"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
						/>
					</svg>
					<span class="hidden sm:inline">Archivieren</span>
				</button>
				<button
					type="button"
					onclick={handleBatchDelete}
					disabled={batchLoading || selectedIds.size === 0}
					class="batch-btn batch-btn-danger"
					title="Löschen"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					<span class="hidden sm:inline">Löschen</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Loading state with skeleton -->
	{#if contactsStore.loading}
		{#if viewModeStore.mode === 'grid'}
			<ContactGridSkeleton count={8} />
		{:else}
			<ContactListSkeleton count={10} />
		{/if}
	{:else if contactsStore.contacts.length === 0}
		<!-- Empty state -->
		<div class="text-center py-12">
			<div class="text-6xl mb-4">👤</div>
			<h2 class="text-xl font-semibold text-foreground mb-2">{$_('contacts.noContacts')}</h2>
			<p class="text-muted-foreground mb-4">{$_('contacts.addFirst')}</p>
			<a href="/contacts/new" class="btn btn-primary">
				{$_('contacts.new')}
			</a>
		</div>
	{:else}
		<!-- Contacts View -->
		{#if viewModeStore.mode === 'grid'}
			<ContactGridView
				contacts={sortedContacts}
				onContactClick={handleContactClick}
				onToggleFavorite={handleToggleFavorite}
				{selectionMode}
				{selectedIds}
				onToggleSelection={toggleSelection}
			/>
		{:else if viewModeStore.mode === 'alphabet'}
			<ContactAlphabetView
				contacts={sortedContacts}
				onContactClick={handleContactClick}
				onToggleFavorite={handleToggleFavorite}
				{selectionMode}
				{selectedIds}
				onToggleSelection={toggleSelection}
				sortField={contactsFilterStore.sortField}
			/>
		{:else}
			<ContactListView
				contacts={sortedContacts}
				onContactClick={handleContactClick}
				onToggleFavorite={handleToggleFavorite}
				{selectionMode}
				{selectedIds}
				onToggleSelection={toggleSelection}
			/>
		{/if}

		<!-- Infinite scroll trigger & loading more indicator -->
		{#if contactsStore.hasMore}
			<div bind:this={loadMoreTrigger} class="load-more-trigger">
				{#if contactsStore.loadingMore}
					<div class="loading-more">
						<div class="loading-spinner"></div>
						<span>{$_('common.loadingMore')}</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Total count -->
		<p class="text-sm text-muted-foreground text-center">
			{contactsStore.contacts.length} / {contactsStore.total}
			{contactsStore.total === 1 ? $_('contacts.contact') : $_('contacts.contactsPlural')}
		</p>
	{/if}
</div>

<style>
	.batch-actions-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.batch-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.batch-btn:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
	}

	.batch-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.batch-btn-danger:hover:not(:disabled) {
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
	}

	/* Infinite scroll */
	.load-more-trigger {
		height: 1px;
		margin-top: 1rem;
	}

	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1.5rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	.loading-spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid hsl(var(--muted));
		border-top-color: hsl(var(--primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
