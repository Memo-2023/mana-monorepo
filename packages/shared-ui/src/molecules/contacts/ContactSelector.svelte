<script lang="ts">
	import { Plus, MagnifyingGlass, User, Envelope } from '@manacore/shared-icons';
	import ContactBadge from './ContactBadge.svelte';
	import ContactAvatar from './ContactAvatar.svelte';
	import type {
		ContactReference,
		ContactSummary,
		ManualContactEntry,
		ContactOrManual,
		createContactReference,
	} from '@manacore/shared-types';

	interface Props {
		/** Currently selected contacts */
		selectedContacts: ContactOrManual[];
		/** Called when selection changes */
		onContactsChange: (contacts: ContactOrManual[]) => void;
		/** Function to search contacts (async) */
		onSearch: (query: string) => Promise<ContactSummary[]>;
		/** Allow manual email entry (for contacts not in system) */
		allowManualEntry?: boolean;
		/** Maximum contacts that can be selected */
		maxContacts?: number;
		/** Single select mode (only one contact allowed) */
		singleSelect?: boolean;
		/** Placeholder text */
		placeholder?: string;
		/** Add button label */
		addLabel?: string;
		/** Search placeholder */
		searchPlaceholder?: string;
		/** Loading state */
		loading?: boolean;
		/** Disabled state */
		disabled?: boolean;
		/** Show "not available" message when contacts API is down */
		unavailableMessage?: string;
		/** Is contacts API available */
		isAvailable?: boolean;
	}

	let {
		selectedContacts,
		onContactsChange,
		onSearch,
		allowManualEntry = false,
		maxContacts,
		singleSelect = false,
		placeholder = 'Kontakt hinzufügen...',
		addLabel = 'Kontakt hinzufügen',
		searchPlaceholder = 'Name oder E-Mail suchen...',
		loading = false,
		disabled = false,
		unavailableMessage = 'Kontakte nicht verfügbar',
		isAvailable = true,
	}: Props = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<ContactSummary[]>([]);
	let isSearching = $state(false);
	let showManualEntry = $state(false);
	let manualEmail = $state('');
	let manualName = $state('');
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let searchInputRef = $state<HTMLInputElement | null>(null);
	let highlightedIndex = $state(-1);

	// Focus search input when dropdown opens
	$effect(() => {
		if (isOpen && searchInputRef) {
			setTimeout(() => searchInputRef?.focus(), 0);
			highlightedIndex = -1;
		}
	});

	// Reset highlighted index when results change
	$effect(() => {
		if (searchResults.length > 0) {
			highlightedIndex = -1;
		}
	});

	const effectiveMax = $derived(singleSelect ? 1 : maxContacts);
	const canAddMore = $derived(!effectiveMax || selectedContacts.length < effectiveMax);

	// Check if an email looks valid
	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	// Debounced search
	async function handleSearchInput(query: string) {
		searchQuery = query;

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		if (!query.trim()) {
			searchResults = [];
			return;
		}

		searchTimeout = setTimeout(async () => {
			if (!isAvailable) return;

			isSearching = true;
			try {
				const results = await onSearch(query);
				// Filter out already selected contacts
				const selectedIds = new Set(
					selectedContacts
						.filter((c): c is ContactReference => 'contactId' in c)
						.map((c) => c.contactId)
				);
				searchResults = results.filter((r) => !selectedIds.has(r.id));
			} catch (error) {
				console.error('Contact search failed:', error);
				searchResults = [];
			} finally {
				isSearching = false;
			}
		}, 300);
	}

	function handleSelectContact(contact: ContactSummary) {
		if (!canAddMore) return;

		const reference: ContactReference = {
			contactId: contact.id,
			displayName: contact.displayName,
			email: contact.email,
			photoUrl: contact.photoUrl,
			company: contact.company,
			fetchedAt: new Date().toISOString(),
		};

		if (singleSelect) {
			onContactsChange([reference]);
		} else {
			onContactsChange([...selectedContacts, reference]);
		}

		searchQuery = '';
		searchResults = [];
		isOpen = false;
	}

	function handleRemoveContact(index: number) {
		onContactsChange(selectedContacts.filter((_, i) => i !== index));
	}

	function handleAddManualEntry() {
		if (!manualEmail.trim() || !isValidEmail(manualEmail)) return;

		const entry: ManualContactEntry = {
			email: manualEmail.trim(),
			name: manualName.trim() || undefined,
			isManual: true,
		};

		if (singleSelect) {
			onContactsChange([entry]);
		} else {
			onContactsChange([...selectedContacts, entry]);
		}

		manualEmail = '';
		manualName = '';
		showManualEntry = false;
		isOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.contact-selector-container')) {
			isOpen = false;
			showManualEntry = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
			showManualEntry = false;
		}
	}

	function handleSearchKeyDown(e: KeyboardEvent) {
		if (!isOpen || searchResults.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, searchResults.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, -1);
		} else if (e.key === 'Enter' && highlightedIndex >= 0) {
			e.preventDefault();
			handleSelectContact(searchResults[highlightedIndex]);
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeyDown} />

<div class="contact-selector-container">
	<!-- Selected Contacts Display -->
	<div class="selected-contacts">
		{#each selectedContacts as contact, index (index)}
			<ContactBadge {contact} removable onRemove={() => handleRemoveContact(index)} />
		{/each}

		{#if canAddMore && !disabled}
			<button type="button" onclick={() => (isOpen = !isOpen)} class="add-button" {disabled}>
				<Plus size={14} weight="bold" />
				<span>{addLabel}</span>
			</button>
		{/if}
	</div>

	<!-- Dropdown -->
	{#if isOpen}
		<div class="dropdown">
			{#if !isAvailable}
				<!-- Unavailable State -->
				<div class="unavailable-state">
					<User size={24} />
					<p>{unavailableMessage}</p>
					{#if allowManualEntry}
						<button type="button" onclick={() => (showManualEntry = true)} class="manual-link">
							Manuell hinzufügen
						</button>
					{/if}
				</div>
			{:else}
				<!-- Search Input -->
				<div class="search-section">
					<div class="search-input-wrapper">
						<MagnifyingGlass size={16} class="search-icon" />
						<input
							bind:this={searchInputRef}
							type="text"
							value={searchQuery}
							oninput={(e) => handleSearchInput(e.currentTarget.value)}
							onkeydown={handleSearchKeyDown}
							placeholder={searchPlaceholder}
							class="search-input"
						/>
					</div>
				</div>

				<!-- Results List -->
				<div class="results-list">
					{#if isSearching || loading}
						<div class="empty-state">Suche...</div>
					{:else if searchResults.length > 0}
						{#each searchResults as contact, index (contact.id)}
							<button
								type="button"
								onclick={() => handleSelectContact(contact)}
								class="result-item"
								class:highlighted={index === highlightedIndex}
							>
								<ContactAvatar photoUrl={contact.photoUrl} name={contact.displayName} size="md" />
								<div class="result-info">
									<div class="result-name">{contact.displayName}</div>
									{#if contact.email}
										<div class="result-detail">{contact.email}</div>
									{/if}
									{#if contact.company}
										<div class="result-detail">{contact.company}</div>
									{/if}
								</div>
							</button>
						{/each}
					{:else if searchQuery.trim()}
						<div class="empty-state">Kein Kontakt gefunden</div>
					{:else}
						<div class="empty-state">Name oder E-Mail eingeben...</div>
					{/if}
				</div>

				<!-- Manual Entry Option -->
				{#if allowManualEntry}
					<div class="manual-section">
						{#if showManualEntry}
							<div class="manual-form">
								<div class="input-with-icon">
									<Envelope size={14} />
									<input
										type="email"
										bind:value={manualEmail}
										placeholder="E-Mail-Adresse *"
										class="manual-input"
									/>
								</div>
								<div class="input-with-icon">
									<User size={14} />
									<input
										type="text"
										bind:value={manualName}
										placeholder="Name (optional)"
										class="manual-input"
										onkeydown={(e) => e.key === 'Enter' && handleAddManualEntry()}
									/>
								</div>
								<div class="manual-actions">
									<button
										type="button"
										onclick={() => (showManualEntry = false)}
										class="btn-cancel"
									>
										Abbrechen
									</button>
									<button
										type="button"
										onclick={handleAddManualEntry}
										disabled={!manualEmail.trim() || !isValidEmail(manualEmail)}
										class="btn-add"
									>
										Hinzufügen
									</button>
								</div>
							</div>
						{:else}
							<button type="button" onclick={() => (showManualEntry = true)} class="manual-trigger">
								<Envelope size={14} />
								<span>E-Mail manuell hinzufügen</span>
							</button>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.contact-selector-container {
		position: relative;
	}

	.selected-contacts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.add-button {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		color: #6b7280;
		background: transparent;
		border: 1px dashed rgba(0, 0, 0, 0.2);
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .add-button {
		color: #9ca3af;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.add-button:hover:not(:disabled) {
		color: #374151;
		border-color: rgba(0, 0, 0, 0.3);
		background: rgba(0, 0, 0, 0.03);
	}

	:global(.dark) .add-button:hover:not(:disabled) {
		color: #e5e7eb;
		border-color: rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.05);
	}

	.add-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Dropdown */
	.dropdown {
		position: absolute;
		z-index: 50;
		margin-top: 0.25rem;
		width: 100%;
		min-width: 320px;
		background: rgba(255, 255, 255, 1);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 1rem;
		box-shadow:
			0 12px 28px -5px rgba(0, 0, 0, 0.2),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	:global(.dark) .dropdown {
		background: rgba(45, 45, 45, 1);
		border-color: rgba(255, 255, 255, 0.18);
		box-shadow:
			0 12px 28px -5px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(255, 255, 255, 0.05);
	}

	/* Search Section */
	.search-section {
		padding: 0.75rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .search-section {
		border-bottom-color: rgba(255, 255, 255, 0.08);
	}

	.search-input-wrapper {
		position: relative;
	}

	.search-input-wrapper :global(.search-icon) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: #6b7280;
	}

	:global(.dark) .search-input-wrapper :global(.search-icon) {
		color: #9ca3af;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.25rem;
		font-size: 0.875rem;
		color: #374151;
		background: rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.75rem;
		outline: none;
		transition: all 0.15s;
	}

	:global(.dark) .search-input {
		color: #f3f4f6;
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.search-input:focus {
		border-color: #8b5cf6;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	/* Results List */
	.results-list {
		max-height: 14rem;
		overflow-y: auto;
	}

	.empty-state {
		padding: 1rem;
		text-align: center;
		font-size: 0.875rem;
		color: #6b7280;
	}

	:global(.dark) .empty-state {
		color: #9ca3af;
	}

	.result-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 1rem;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s;
	}

	.result-item:hover,
	.result-item.highlighted {
		background: rgba(139, 92, 246, 0.08);
	}

	:global(.dark) .result-item:hover,
	:global(.dark) .result-item.highlighted {
		background: rgba(139, 92, 246, 0.15);
	}

	.result-info {
		flex: 1;
		min-width: 0;
	}

	.result-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .result-name {
		color: #f3f4f6;
	}

	.result-detail {
		font-size: 0.75rem;
		color: #6b7280;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .result-detail {
		color: #9ca3af;
	}

	/* Manual Entry Section */
	.manual-section {
		padding: 0.75rem;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .manual-section {
		border-top-color: rgba(255, 255, 255, 0.08);
	}

	.manual-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-with-icon > :global(svg) {
		position: absolute;
		left: 0.75rem;
		color: #6b7280;
	}

	:global(.dark) .input-with-icon > :global(svg) {
		color: #9ca3af;
	}

	.manual-input {
		width: 100%;
		padding: 0.5rem 0.75rem 0.5rem 2.25rem;
		font-size: 0.875rem;
		color: #374151;
		background: rgba(0, 0, 0, 0.04);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.75rem;
		outline: none;
		transition: all 0.15s;
	}

	:global(.dark) .manual-input {
		color: #f3f4f6;
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.manual-input:focus {
		border-color: #8b5cf6;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
	}

	.manual-input::placeholder {
		color: #9ca3af;
	}

	.manual-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-cancel {
		flex: 1;
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		color: #6b7280;
		background: transparent;
		border: none;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: background 0.15s;
	}

	:global(.dark) .btn-cancel {
		color: #9ca3af;
	}

	.btn-cancel:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .btn-cancel:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.btn-add {
		flex: 1;
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		background: #8b5cf6;
		border: none;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.btn-add:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-add:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.manual-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		color: #6b7280;
		background: transparent;
		border: none;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	:global(.dark) .manual-trigger {
		color: #9ca3af;
	}

	.manual-trigger:hover {
		color: #374151;
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .manual-trigger:hover {
		color: #e5e7eb;
		background: rgba(255, 255, 255, 0.08);
	}

	/* Unavailable State */
	.unavailable-state {
		padding: 1.5rem;
		text-align: center;
		color: #6b7280;
	}

	:global(.dark) .unavailable-state {
		color: #9ca3af;
	}

	.unavailable-state > :global(svg) {
		margin: 0 auto 0.5rem;
		opacity: 0.5;
	}

	.unavailable-state p {
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.manual-link {
		font-size: 0.875rem;
		color: #8b5cf6;
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: none;
	}

	.manual-link:hover {
		text-decoration: underline;
	}
</style>
