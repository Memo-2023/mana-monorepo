<script lang="ts">
	import { goto } from '$app/navigation';
	import { contactsApi, type Contact } from '$lib/api/contacts';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';
	import { ContactsEvents } from '@manacore/shared-utils/analytics';

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

	function getDisplayName(contact: Contact) {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		return contact.email || 'Unbekannt';
	}

	function getInitials(contact: Contact) {
		const first = contact.firstName?.[0] || '';
		const last = contact.lastName?.[0] || '';
		return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || '?';
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
				<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
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
									<svg class="result-favorite" fill="currentColor" viewBox="0 0 24 24">
										<path
											d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
										/>
									</svg>
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
						<svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						<span>Neuen Kontakt erstellen</span>
						<kbd>N</kbd>
					</button>
					<a href="/tags" class="quick-action" onclick={onClose}>
						<svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
							/>
						</svg>
						<span>Tags verwalten</span>
					</a>
					<a href="/data?tab=import" class="quick-action" onclick={onClose}>
						<svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
							/>
						</svg>
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
