<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _, locale } from 'svelte-i18n';
	import { listsStore, type QuoteList } from '$lib/stores/lists.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { QUOTES, type Quote } from '@zitare/content';
	import QuoteCard from '$lib/components/QuoteCard.svelte';

	const allQuotes = QUOTES;

	let list = $state<QuoteList | null>(null);
	let isLoading = $state(true);
	let isSaving = $state(false);
	let isAdding = $state(false);
	let removingQuoteId = $state<string | null>(null);
	let searchTerm = $state('');
	let isSearchOpen = $state(false);
	let showEditModal = $state(false);
	let showAddQuotesModal = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let selectedQuoteIds = $state<Set<string>>(new Set());

	// Load list on mount
	$effect(() => {
		const listId = $page.params.id;
		if (listId) {
			loadList(listId);
		}
	});

	async function loadList(listId: string) {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		isLoading = true;
		list = await listsStore.getList(listId);
		isLoading = false;

		if (!list) {
			toast.error($_('lists.detail.notFound'));
		}
	}

	// Get quotes in this list
	let listQuotes = $derived<Quote[]>(
		list ? allQuotes.filter((quote: Quote) => list!.quoteIds.includes(quote.id)) : []
	);

	// Filter quotes by search
	let filteredQuotes = $derived<Quote[]>(
		listQuotes.filter(
			(quote: Quote) =>
				quotesStore.getText(quote).toLowerCase().includes(searchTerm.toLowerCase()) ||
				quote.author.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	// Get available quotes (not in this list)
	let availableQuotes = $derived<Quote[]>(
		allQuotes.filter((quote: Quote) => !list?.quoteIds.includes(quote.id))
	);

	function toggleSearch() {
		isSearchOpen = !isSearchOpen;
		if (!isSearchOpen) {
			searchTerm = '';
		}
	}

	function openEditModal() {
		if (list) {
			editName = list.name;
			editDescription = list.description || '';
			showEditModal = true;
		}
	}

	function closeEditModal() {
		showEditModal = false;
	}

	async function handleUpdateList() {
		if (!list || !editName.trim() || isSaving) return;
		isSaving = true;
		try {
			const updated = await listsStore.updateList(list.id, {
				name: editName.trim(),
				description: editDescription.trim() || undefined,
			});
			if (updated) {
				list = updated;
				toast.success($_('lists.detail.toast.updated'));
				closeEditModal();
			} else {
				toast.error($_('lists.detail.toast.updateError'));
			}
		} finally {
			isSaving = false;
		}
	}

	async function handleDeleteList() {
		if (list && confirm($_('lists.confirmDelete'))) {
			const success = await listsStore.deleteList(list.id);
			if (success) {
				toast.info($_('lists.detail.toast.deleted'));
				goto('/lists');
			} else {
				toast.error($_('lists.detail.toast.deleteError'));
			}
		}
	}

	function openAddQuotesModal() {
		selectedQuoteIds = new Set();
		showAddQuotesModal = true;
	}

	function closeAddQuotesModal() {
		showAddQuotesModal = false;
		selectedQuoteIds = new Set();
	}

	function toggleQuoteSelection(quoteId: string) {
		if (selectedQuoteIds.has(quoteId)) {
			selectedQuoteIds.delete(quoteId);
		} else {
			selectedQuoteIds.add(quoteId);
		}
		selectedQuoteIds = new Set(selectedQuoteIds);
	}

	async function handleAddQuotes() {
		if (!list || isAdding) return;
		isAdding = true;
		try {
			let successCount = 0;
			for (const quoteId of selectedQuoteIds) {
				const success = await listsStore.addQuoteToList(list.id, quoteId);
				if (success) successCount++;
			}
			if (successCount > 0) {
				list = await listsStore.getList(list.id);
				toast.success($_('lists.detail.toast.quotesAdded', { values: { count: successCount } }));
			}
			closeAddQuotesModal();
		} finally {
			isAdding = false;
		}
	}

	async function handleRemoveQuote(quoteId: string) {
		if (!list || removingQuoteId || !confirm($_('lists.detail.removeConfirm'))) return;
		removingQuoteId = quoteId;
		try {
			const success = await listsStore.removeQuoteFromList(list.id, quoteId);
			if (success) {
				list = await listsStore.getList(list.id);
				toast.info($_('lists.detail.toast.quoteRemoved'));
			} else {
				toast.error($_('lists.detail.toast.removeError'));
			}
		} finally {
			removingQuoteId = null;
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString($locale || 'de', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>{list?.name || $_('common.list')} - Zitare</title>
</svelte:head>

{#if isLoading}
	<div class="loading-state">
		<div class="spinner"></div>
		<p>{$_('common.loading')}</p>
	</div>
{:else if !list}
	<div class="error-state">
		<h2>{$_('lists.detail.notFound')}</h2>
		<p>{$_('lists.detail.notFoundDescription')}</p>
		<a href="/lists" class="cta-button">{$_('lists.detail.backToLists')}</a>
	</div>
{:else}
	<div class="list-detail-page">
		<!-- Header -->
		<div class="header-container">
			<div class="breadcrumb">
				<a href="/lists">{$_('lists.detail.breadcrumb')}</a>
				<span class="separator">/</span>
				<span>{list.name}</span>
			</div>

			<div class="header-row">
				<div class="header-content">
					<h2>{list.name}</h2>
					{#if list.description}
						<p class="description">{list.description}</p>
					{/if}
					<div class="meta">
						<span>{$_('lists.quoteCount', { values: { count: listQuotes.length } })}</span>
						<span class="separator">•</span>
						<span
							>{$_('lists.detail.lastEdited', {
								values: { date: formatDate(list.updatedAt) },
							})}</span
						>
					</div>
				</div>

				<div class="header-actions">
					{#if listQuotes.length > 0}
						<button class="icon-btn" onclick={toggleSearch} aria-label={$_('common.search')}>
							<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								{#if isSearchOpen}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								{:else}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								{/if}
							</svg>
						</button>
					{/if}

					<button
						class="icon-btn"
						onclick={openEditModal}
						aria-label={$_('lists.detail.editModal.title')}
					>
						<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</button>

					<button
						class="icon-btn add-btn"
						onclick={openAddQuotesModal}
						aria-label={$_('lists.detail.addQuotes')}
					>
						<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
					</button>
				</div>
			</div>

			{#if isSearchOpen}
				<div class="search-bar">
					<input
						type="text"
						placeholder={$_('lists.detail.searchPlaceholder')}
						bind:value={searchTerm}
						class="search"
					/>
				</div>
			{/if}
		</div>

		<!-- Quotes Grid -->
		{#if listQuotes.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="64"
						height="64"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<line x1="8" y1="6" x2="21" y2="6"></line>
						<line x1="8" y1="12" x2="21" y2="12"></line>
						<line x1="8" y1="18" x2="21" y2="18"></line>
						<line x1="3" y1="6" x2="3.01" y2="6"></line>
						<line x1="3" y1="12" x2="3.01" y2="12"></line>
						<line x1="3" y1="18" x2="3.01" y2="18"></line>
					</svg>
				</div>
				<h3>{$_('lists.detail.emptyTitle')}</h3>
				<p>{$_('lists.detail.emptyDescription')}</p>
				<button class="cta-button" onclick={openAddQuotesModal}>
					<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					{$_('lists.detail.addQuotes')}
				</button>
			</div>
		{:else if filteredQuotes.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="64"
						height="64"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.35-4.35"></path>
					</svg>
				</div>
				<h3>{$_('lists.detail.noSearchResults')}</h3>
				<p>{$_('lists.detail.noSearchResultsDescription')}</p>
			</div>
		{:else}
			<div class="quotes-grid">
				{#each filteredQuotes as quote (quote.id)}
					<div class="quote-wrapper">
						<QuoteCard {quote} />
						<button
							class="remove-btn"
							onclick={() => handleRemoveQuote(quote.id)}
							disabled={removingQuoteId === quote.id}
							aria-label={$_('lists.detail.remove')}
						>
							{#if removingQuoteId === quote.id}
								<div
									class="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"
								></div>
							{:else}
								<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							{/if}
							{$_('lists.detail.remove')}
						</button>
					</div>
				{/each}
			</div>
		{/if}

		{#if isSearchOpen && filteredQuotes.length > 0}
			<div class="floating-results">
				{$_('lists.detail.floatingResults', {
					values: { filtered: filteredQuotes.length, total: listQuotes.length },
				})}
			</div>
		{/if}
	</div>
{/if}

<!-- Edit List Modal -->
{#if showEditModal}
	<div class="modal-overlay" onclick={closeEditModal} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<div class="modal-header">
				<h3>{$_('lists.detail.editModal.title')}</h3>
				<button class="close-btn" onclick={closeEditModal} aria-label={$_('common.close')}>
					<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label for="edit-name">{$_('lists.nameLabel')} *</label>
					<input
						id="edit-name"
						type="text"
						bind:value={editName}
						class="form-input"
						maxlength="50"
					/>
				</div>

				<div class="form-group">
					<label for="edit-description">{$_('lists.descriptionLabel')}</label>
					<textarea
						id="edit-description"
						bind:value={editDescription}
						class="form-textarea"
						rows="3"
						maxlength="200"
					></textarea>
				</div>

				<button class="danger-btn" onclick={handleDeleteList}>
					<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					{$_('lists.detail.editModal.deleteList')}
				</button>
			</div>

			<div class="modal-footer">
				<button class="btn btn-secondary" onclick={closeEditModal}>{$_('common.cancel')}</button>
				<button
					class="btn btn-primary"
					onclick={handleUpdateList}
					disabled={!editName.trim() || isSaving}
				>
					{#if isSaving}
						<div
							class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1"
						></div>
					{/if}
					{$_('common.save')}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Quotes Modal -->
{#if showAddQuotesModal}
	<div class="modal-overlay" onclick={closeAddQuotesModal} role="presentation">
		<div
			class="modal modal-large"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
		>
			<div class="modal-header">
				<h3>{$_('lists.detail.addModal.title')}</h3>
				<button class="close-btn" onclick={closeAddQuotesModal} aria-label={$_('common.close')}>
					<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="modal-body quote-selection">
				{#each availableQuotes.slice(0, 50) as quote (quote.id)}
					<label class="quote-option">
						<input
							type="checkbox"
							checked={selectedQuoteIds.has(quote.id)}
							onchange={() => toggleQuoteSelection(quote.id)}
						/>
						<div class="quote-preview">
							<p class="quote-text">"{quotesStore.getText(quote)}"</p>
							<p class="quote-author">— {quote.author}</p>
						</div>
					</label>
				{/each}
			</div>

			<div class="modal-footer">
				<div class="selected-count">
					{$_('lists.detail.addModal.selected', { values: { count: selectedQuoteIds.size } })}
				</div>
				<div class="footer-actions">
					<button class="btn btn-secondary" onclick={closeAddQuotesModal}
						>{$_('common.cancel')}</button
					>
					<button
						class="btn btn-primary"
						onclick={handleAddQuotes}
						disabled={selectedQuoteIds.size === 0 || isAdding}
					>
						{#if isAdding}
							<div
								class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1"
							></div>
						{/if}
						{$_('lists.detail.addModal.submit', { values: { count: selectedQuoteIds.size } })}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.list-detail-page {
		max-width: 1200px;
		margin: 0 auto;
		padding-bottom: var(--spacing-2xl);
	}

	.loading-state,
	.error-state {
		max-width: 500px;
		margin: var(--spacing-2xl) auto;
		text-align: center;
		padding: var(--spacing-2xl);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgb(var(--color-border));
		border-top-color: rgb(var(--color-primary));
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto var(--spacing-md);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.header-container {
		max-width: 700px;
		margin: 0 auto var(--spacing-xl);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-md);
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
	}

	.breadcrumb a {
		color: rgb(var(--color-primary));
		text-decoration: none;
		transition: opacity var(--transition-fast);
	}

	.breadcrumb a:hover {
		opacity: 0.8;
	}

	.breadcrumb .separator {
		color: rgb(var(--color-text-tertiary));
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.header-content {
		flex: 1;
	}

	h2 {
		font-size: 2rem;
		margin: 0 0 var(--spacing-xs) 0;
		color: rgb(var(--color-text-primary));
	}

	.description {
		font-size: 1rem;
		color: rgb(var(--color-text-secondary));
		margin: 0 0 var(--spacing-sm) 0;
		line-height: 1.5;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 0.875rem;
		color: rgb(var(--color-text-tertiary));
	}

	.meta .separator {
		color: rgb(var(--color-border));
	}

	.header-actions {
		display: flex;
		gap: var(--spacing-sm);
		align-items: flex-start;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
		border: 1px solid rgb(var(--color-border));
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.icon-btn:hover {
		background: rgb(var(--color-background));
		transform: scale(1.05);
	}

	.icon-btn.add-btn {
		background: rgb(var(--color-primary));
		color: white;
		border: none;
	}

	.icon-btn.add-btn:hover {
		opacity: 0.9;
	}

	.search-bar {
		padding: var(--spacing-md);
		background: rgb(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid rgb(var(--color-border));
		animation: slideDown 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.search {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: rgb(var(--color-background));
		color: rgb(var(--color-text-primary));
		transition: border-color var(--transition-fast);
	}

	.search:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.quotes-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
		max-width: 700px;
		margin: 0 auto;
	}

	.quote-wrapper {
		position: relative;
	}

	.remove-btn {
		display: none;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: rgba(239, 68, 68, 0.1);
		color: rgb(239, 68, 68);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		position: absolute;
		top: var(--spacing-sm);
		right: var(--spacing-sm);
	}

	.quote-wrapper:hover .remove-btn {
		display: flex;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.5);
	}

	/* Empty State */
	.empty-state {
		max-width: 500px;
		margin: var(--spacing-2xl) auto;
		text-align: center;
		padding: var(--spacing-2xl);
	}

	.empty-icon {
		margin: 0 auto var(--spacing-lg);
		color: rgb(var(--color-text-tertiary));
		opacity: 0.5;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		color: rgb(var(--color-text-primary));
		margin: 0 0 var(--spacing-sm) 0;
	}

	.empty-state p {
		font-size: 1rem;
		color: rgb(var(--color-text-secondary));
		margin: 0 0 var(--spacing-xl) 0;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-xl);
		background: rgb(var(--color-primary));
		color: white;
		border: none;
		border-radius: var(--radius-full);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-md);
		text-decoration: none;
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	/* Floating Results */
	.floating-results {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		padding: var(--spacing-sm) var(--spacing-lg);
		background: rgba(var(--color-surface), 0.95);
		backdrop-filter: blur(10px);
		border-radius: var(--radius-full);
		border: 1px solid rgba(var(--color-border), 0.5);
		box-shadow: var(--shadow-lg);
		color: rgb(var(--color-text-secondary));
		font-size: 0.875rem;
		font-weight: 500;
		z-index: 20;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		padding: var(--spacing-lg);
	}

	.modal {
		background: rgb(var(--color-surface-elevated));
		border-radius: var(--radius-xl);
		max-width: 500px;
		width: 100%;
		box-shadow: var(--shadow-xl);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	.modal-large {
		max-width: 700px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid rgb(var(--color-border));
		flex-shrink: 0;
	}

	.modal-header h3 {
		font-size: 1.25rem;
		margin: 0;
		color: rgb(var(--color-text-primary));
	}

	.close-btn {
		background: none;
		border: none;
		padding: var(--spacing-xs);
		cursor: pointer;
		color: rgb(var(--color-text-secondary));
		transition: all var(--transition-fast);
		border-radius: var(--radius-sm);
	}

	.close-btn:hover {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
	}

	.modal-body {
		padding: var(--spacing-lg);
		overflow-y: auto;
		flex: 1;
	}

	.quote-selection {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.quote-option {
		display: flex;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: rgb(var(--color-surface));
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.quote-option:hover {
		border-color: rgb(var(--color-primary));
		background: rgb(var(--color-background));
	}

	.quote-option input[type='checkbox'] {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.quote-preview {
		flex: 1;
	}

	.quote-text {
		font-size: 0.9375rem;
		color: rgb(var(--color-text-primary));
		margin: 0 0 var(--spacing-xs) 0;
		line-height: 1.5;
	}

	.quote-author {
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
		margin: 0;
	}

	.form-group {
		margin-bottom: var(--spacing-lg);
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
		margin-bottom: var(--spacing-xs);
	}

	.form-input,
	.form-textarea {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: rgb(var(--color-background));
		color: rgb(var(--color-text-primary));
		transition: border-color var(--transition-fast);
		font-family: inherit;
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.form-textarea {
		resize: vertical;
	}

	.danger-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: rgba(239, 68, 68, 0.1);
		color: rgb(239, 68, 68);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		margin-top: var(--spacing-xl);
		width: 100%;
		justify-content: center;
	}

	.danger-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.modal-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		border-top: 1px solid rgb(var(--color-border));
		flex-shrink: 0;
	}

	.selected-count {
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
	}

	.footer-actions {
		display: flex;
		gap: var(--spacing-md);
	}

	.btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all var(--transition-base);
		border: none;
	}

	.btn-secondary {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
		border: 1px solid rgb(var(--color-border));
	}

	.btn-secondary:hover {
		background: rgb(var(--color-background));
	}

	.btn-primary {
		background: rgb(var(--color-primary));
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.list-detail-page {
			padding-bottom: var(--spacing-xl);
		}

		.header-container {
			max-width: 100%;
		}

		h2 {
			font-size: 1.5rem;
		}

		.quotes-grid {
			max-width: 100%;
		}

		.remove-btn {
			display: flex;
			position: static;
			width: 100%;
			margin-top: var(--spacing-sm);
		}

		.floating-results {
			bottom: 5rem;
		}

		.modal {
			margin: var(--spacing-sm);
		}

		.modal-footer {
			flex-direction: column;
			align-items: stretch;
		}

		.footer-actions {
			width: 100%;
		}

		.footer-actions .btn {
			flex: 1;
		}
	}
</style>
