<script lang="ts">
	import { goto } from '$app/navigation';
	import { contactsApi, type Contact } from '$lib/api/contacts';
	import { getDisplayName, getInitials } from '$lib/utils/contact-display';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';
	import { ContactsEvents } from '@manacore/shared-utils/analytics';
	import { MagnifyingGlass, Heart, Plus, Tag, Upload } from '@manacore/shared-icons';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), onClose }: Props = $props();

	let searchQuery = $state('');
	let results = $state<Contact[]>([]);
	let loading = $state(false);
	let selectedIndex = $state(0);
	let searchTimeout: ReturnType<typeof setTimeout>;
	let inputElement: HTMLInputElement;

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			searchQuery = '';
			results = [];
			selectedIndex = 0;
			// Focus input after a short delay to ensure modal is rendered
			setTimeout(() => inputElement?.focus(), 50);
		}
	});

	async function handleSearch() {
		clearTimeout(searchTimeout);

		if (!searchQuery.trim()) {
			results = [];
			loading = false;
			return;
		}

		loading = true;

		searchTimeout = setTimeout(async () => {
			try {
				const response = await contactsApi.list({
					search: searchQuery,
					limit: 10,
				});
				results = response.contacts || [];
				selectedIndex = 0;
				ContactsEvents.searchPerformed();
			} catch (e) {
				console.error('Search error:', e);
				results = [];
			} finally {
				loading = false;
			}
		}, 150);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			return;
		}

		if (event.key === 'Enter' && results.length > 0) {
			event.preventDefault();
			selectContact(results[selectedIndex]);
			return;
		}
	}

	function selectContact(contact: Contact) {
		goto(`/contacts/${contact.id}`);
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="search-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label="Kontakt suchen"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div class="search-modal">
			<!-- Search Input -->
			<div class="search-input-wrapper">
				<MagnifyingGlass class="search-icon" />
				<input
					bind:this={inputElement}
					type="text"
					placeholder="Kontakt suchen..."
					bind:value={searchQuery}
					oninput={handleSearch}
					class="search-input"
				/>
				<kbd class="search-shortcut">ESC</kbd>
			</div>

			<!-- Results -->
			{#if searchQuery.trim()}
				<div class="search-results">
					{#if loading}
						<div class="search-loading">
							<div class="loading-spinner"></div>
							<span>Suche...</span>
						</div>
					{:else if results.length === 0}
						<div class="search-empty">
							<span>Keine Kontakte gefunden</span>
						</div>
					{:else}
						{#each results as contact, index (contact.id)}
							<button
								type="button"
								class="search-result"
								class:selected={index === selectedIndex}
								onclick={() => selectContact(contact)}
								onmouseenter={() => (selectedIndex = index)}
							>
								<div class="result-avatar">
									{#if contact.photoUrl}
										<img
											src={contact.photoUrl}
											alt={getDisplayName(contact)}
											class="w-full h-full rounded-full object-cover"
										/>
									{:else}
										{getInitials(contact)}
									{/if}
								</div>
								<div class="result-info">
									<div class="result-name">{getDisplayName(contact)}</div>
									<div class="result-details">
										{#if contact.company}
											<span>{contact.company}</span>
										{/if}
										{#if contact.email}
											<span>{contact.email}</span>
										{/if}
									</div>
								</div>
								{#if contact.isFavorite}
									<Heart class="result-favorite" weight="fill" />
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			{:else}
				<!-- Quick Actions when no search -->
				<div class="quick-actions-list">
					<button
						type="button"
						class="quick-action"
						onclick={() => {
							onClose();
							newContactModalStore.open();
						}}
					>
						<Plus size={20} class="quick-action-icon" />
						<span>Neuen Kontakt erstellen</span>
						<kbd>N</kbd>
					</button>
					<a href="/tags" class="quick-action" onclick={onClose}>
						<Tag size={20} class="quick-action-icon" />
						<span>Tags verwalten</span>
					</a>
					<a href="/data?tab=import" class="quick-action" onclick={onClose}>
						<Upload size={20} class="quick-action-icon" />
						<span>Kontakte importieren</span>
					</a>
				</div>
			{/if}

			<!-- Footer -->
			<div class="search-footer">
				<div class="footer-hints">
					<span><kbd>↑↓</kbd> Navigation</span>
					<span><kbd>↵</kbd> Öffnen</span>
					<span><kbd>ESC</kbd> Schließen</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.search-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 15vh;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.search-modal {
		width: 100%;
		max-width: 560px;
		margin: 0 1rem;
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: var(--radius-lg);
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		overflow: hidden;
		animation: slideIn 0.2s ease;
		color: #e5e5e5;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #333;
	}

	.search-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: #888;
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 1rem;
		color: #fff;
		outline: none;
	}

	.search-input::placeholder {
		color: #666;
	}

	.search-shortcut {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-family: inherit;
		background: #2a2a2a;
		border: 1px solid #444;
		border-radius: var(--radius-sm);
		color: #888;
	}

	.search-results {
		max-height: 320px;
		overflow-y: auto;
	}

	.search-loading,
	.search-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
		color: #888;
		font-size: 0.875rem;
	}

	.loading-spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid #333;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.search-result {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s ease;
		color: #e5e5e5;
	}

	.search-result:hover,
	.search-result.selected {
		background: #2a2a2a;
	}

	.result-avatar {
		width: 40px;
		height: 40px;
		min-width: 40px;
		border-radius: var(--radius-full);
		background: #3b82f6;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.result-info {
		flex: 1;
		min-width: 0;
	}

	.result-name {
		font-weight: 500;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-details {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: #888;
	}

	.result-details span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-favorite {
		width: 1rem;
		height: 1rem;
		color: #ef4444;
		flex-shrink: 0;
	}

	.quick-actions-list {
		padding: 0.5rem;
	}

	.quick-action {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-md);
		color: #e5e5e5;
		text-decoration: none;
		transition: background 0.1s ease;
	}

	.quick-action:hover {
		background: #2a2a2a;
	}

	.quick-action-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: #888;
	}

	.quick-action span {
		flex: 1;
		font-size: 0.9375rem;
	}

	.quick-action kbd {
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		font-family: inherit;
		background: #2a2a2a;
		border: 1px solid #444;
		border-radius: var(--radius-sm);
		color: #888;
	}

	.search-footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid #333;
		background: #141414;
	}

	.footer-hints {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: #666;
	}

	.footer-hints kbd {
		padding: 0.125rem 0.25rem;
		font-family: inherit;
		background: #2a2a2a;
		border: 1px solid #444;
		border-radius: 3px;
		margin-right: 0.25rem;
	}

	@media (max-width: 640px) {
		.search-backdrop {
			padding-top: 5vh;
		}

		.footer-hints {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}
</style>
