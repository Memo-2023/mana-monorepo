<script lang="ts">
	import { listsStore, type QuoteList } from '$lib/stores/lists';
	import { quotesDE } from '@zitare/shared';
	import { PageHeader } from '@manacore/shared-ui';
	import { toast } from '$lib/stores/toast';

	let lists = $state<QuoteList[]>([]);
	let showCreateModal = $state(false);
	let newListName = $state('');
	let newListDescription = $state('');
	let searchTerm = $state('');

	// Subscribe to lists store
	listsStore.subscribe((value) => {
		lists = value;
	});

	// Filter lists by search term
	let filteredLists = $derived(
		lists.filter(
			(list) =>
				list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				list.description?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	function openCreateModal() {
		showCreateModal = true;
		newListName = '';
		newListDescription = '';
	}

	function closeCreateModal() {
		showCreateModal = false;
		newListName = '';
		newListDescription = '';
	}

	function handleCreateList() {
		if (newListName.trim()) {
			listsStore.createList(newListName.trim(), newListDescription.trim() || undefined);
			toast.success('Liste erstellt!');
			closeCreateModal();
		}
	}

	function handleDeleteList(listId: string) {
		if (confirm('Möchtest du diese Liste wirklich löschen?')) {
			listsStore.deleteList(listId);
			toast.info('Liste gelöscht');
		}
	}

	function getQuoteCount(quoteIds: string[]): number {
		return quoteIds.length;
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Listen - Zitare</title>
</svelte:head>

<div class="lists-page">
	<div class="header-container">
		<PageHeader
			title="Meine Listen"
			description="{lists.length} {lists.length === 1 ? 'Liste' : 'Listen'}"
			size="lg"
		>
			{#snippet actions()}
				<button class="create-fab" onclick={openCreateModal} aria-label="Neue Liste erstellen">
					<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</button>
			{/snippet}
		</PageHeader>

		{#if lists.length > 3}
			<div class="search-container">
				<input
					type="text"
					placeholder="Listen durchsuchen..."
					bind:value={searchTerm}
					class="search"
				/>
			</div>
		{/if}
	</div>

	{#if lists.length === 0}
		<!-- Empty State -->
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
			<h3>Keine Listen</h3>
			<p>Erstelle deine erste Liste, um Zitate zu organisieren</p>
			<button class="cta-button" onclick={openCreateModal}>
				<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Erste Liste erstellen
			</button>
		</div>
	{:else if filteredLists.length === 0}
		<!-- No Search Results -->
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
			<h3>Keine Ergebnisse</h3>
			<p>Versuche es mit anderen Suchbegriffen</p>
		</div>
	{:else}
		<div class="lists-grid">
			{#each filteredLists as list (list.id)}
				<a href="/lists/{list.id}" class="list-card">
					<div class="list-header">
						<h3>{list.name}</h3>
						<button
							class="delete-btn"
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleDeleteList(list.id);
							}}
							aria-label="Liste löschen"
						>
							<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>

					{#if list.description}
						<p class="list-description">{list.description}</p>
					{/if}

					<div class="list-meta">
						<div class="meta-item">
							<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
								/>
							</svg>
							<span>{getQuoteCount(list.quoteIds)} Zitate</span>
						</div>
						<div class="meta-item">
							<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>{formatDate(list.updatedAt)}</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Create List Modal -->
{#if showCreateModal}
	<div class="modal-overlay" onclick={closeCreateModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Neue Liste erstellen</h3>
				<button class="close-btn" onclick={closeCreateModal} aria-label="Schließen">
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
					<label for="list-name">Name *</label>
					<input
						id="list-name"
						type="text"
						bind:value={newListName}
						placeholder="z.B. Motivierende Zitate"
						class="form-input"
						maxlength="50"
					/>
				</div>

				<div class="form-group">
					<label for="list-description">Beschreibung (optional)</label>
					<textarea
						id="list-description"
						bind:value={newListDescription}
						placeholder="Was macht diese Liste besonders?"
						class="form-textarea"
						rows="3"
						maxlength="200"
					></textarea>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn btn-secondary" onclick={closeCreateModal}> Abbrechen </button>
				<button class="btn btn-primary" onclick={handleCreateList} disabled={!newListName.trim()}>
					Erstellen
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.lists-page {
		max-width: 1200px;
		margin: 0 auto;
		padding-bottom: var(--spacing-2xl);
	}

	.header-container {
		max-width: 900px;
		margin: 0 auto var(--spacing-xl);
	}

	.header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	h2 {
		font-size: 2rem;
		margin: 0 0 var(--spacing-xs) 0;
		color: rgb(var(--color-text-primary));
	}

	.subtitle {
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
		margin: 0;
	}

	.create-fab {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 9999px;
		background: rgb(var(--color-primary));
		color: white;
		border: none;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-md);
		flex-shrink: 0;
	}

	.create-fab:hover {
		transform: scale(1.05);
		box-shadow: var(--shadow-lg);
	}

	.create-fab:active {
		transform: scale(0.95);
	}

	.search-container {
		margin-top: var(--spacing-md);
	}

	.search {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
		transition: border-color var(--transition-fast);
	}

	.search:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.lists-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--spacing-lg);
		max-width: 900px;
		margin: 0 auto;
	}

	.list-card {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		text-decoration: none;
		color: inherit;
		transition: all var(--transition-base);
		display: block;
	}

	.list-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: rgb(var(--color-primary));
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.list-card h3 {
		font-size: 1.25rem;
		color: rgb(var(--color-text-primary));
		margin: 0;
		flex: 1;
	}

	.delete-btn {
		background: none;
		border: none;
		padding: var(--spacing-xs);
		cursor: pointer;
		color: rgb(var(--color-text-tertiary));
		transition: all var(--transition-fast);
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.delete-btn:hover {
		color: rgb(var(--color-error));
		background: rgba(var(--color-error), 0.1);
	}

	.list-description {
		color: rgb(var(--color-text-secondary));
		font-size: 0.9375rem;
		margin: 0 0 var(--spacing-md) 0;
		line-height: 1.5;
	}

	.list-meta {
		display: flex;
		gap: var(--spacing-lg);
		padding-top: var(--spacing-sm);
		border-top: 1px solid rgb(var(--color-border));
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
	}

	.meta-item svg {
		color: rgb(var(--color-text-tertiary));
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
		font-size: 1rem;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-md);
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	/* Modal */
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
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: rgb(var(--color-surface-elevated));
		border-radius: var(--radius-xl);
		max-width: 500px;
		width: 100%;
		box-shadow: var(--shadow-xl);
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid rgb(var(--color-border));
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
	}

	.form-group {
		margin-bottom: var(--spacing-lg);
	}

	.form-group:last-child {
		margin-bottom: 0;
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
		min-height: 80px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		border-top: 1px solid rgb(var(--color-border));
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
		.lists-page {
			padding-bottom: var(--spacing-xl);
		}

		.header-container {
			max-width: 100%;
		}

		h2 {
			font-size: 1.5rem;
		}

		.create-fab {
			width: 2.5rem;
			height: 2.5rem;
		}

		.lists-grid {
			grid-template-columns: 1fr;
			max-width: 100%;
		}

		.empty-state {
			padding: var(--spacing-xl);
		}

		.modal {
			margin: var(--spacing-md);
		}
	}
</style>
