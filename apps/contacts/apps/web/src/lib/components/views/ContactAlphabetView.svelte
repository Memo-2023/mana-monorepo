<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Contact } from '$lib/api/contacts';
	import type { SortField } from '$lib/components/SortToggle.svelte';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';

	interface Props {
		contacts: Contact[];
		onContactClick: (id: string) => void;
		onToggleFavorite: (e: MouseEvent, id: string) => void;
		selectionMode?: boolean;
		selectedIds?: Set<string>;
		onToggleSelection?: (id: string) => void;
		sortField?: SortField;
		showNewContactCard?: boolean;
	}

	let {
		contacts,
		onContactClick,
		onToggleFavorite,
		selectionMode = false,
		selectedIds = new Set(),
		onToggleSelection,
		sortField = 'lastName',
		showNewContactCard = true,
	}: Props = $props();

	function handleCheckboxClick(e: MouseEvent, id: string) {
		e.stopPropagation();
		onToggleSelection?.(id);
	}

	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	function getInitials(contact: Contact) {
		const first = contact.firstName?.[0] || '';
		const last = contact.lastName?.[0] || '';
		return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || '?';
	}

	function getDisplayName(contact: Contact) {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		return contact.email || 'Unbekannt';
	}

	function getFirstLetter(contact: Contact): string {
		const name =
			sortField === 'firstName'
				? contact.firstName || contact.lastName || contact.displayName || contact.email || ''
				: contact.lastName || contact.firstName || contact.displayName || contact.email || '';
		const letter = name[0]?.toUpperCase() || '#';
		return /[A-Z]/.test(letter) ? letter : '#';
	}

	// Group contacts by first letter (contacts are already sorted from parent)
	let groupedContacts = $derived.by(() => {
		const groups: Record<string, Contact[]> = {};

		for (const contact of contacts) {
			const letter = getFirstLetter(contact);
			if (!groups[letter]) {
				groups[letter] = [];
			}
			groups[letter].push(contact);
		}

		return groups;
	});

	// Available letters (letters that have contacts)
	let availableLetters = $derived(Object.keys(groupedContacts).sort());

	function scrollToLetter(letter: string) {
		const element = document.getElementById(`section-${letter}`);
		if (element) {
			const headerOffset = 100; // Account for sticky header
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.scrollY - headerOffset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth',
			});
		}
	}
</script>

<div class="alphabet-view">
	<!-- New Contact Card at top -->
	{#if showNewContactCard && !selectionMode}
		<div class="new-contact-section">
			<div
				role="button"
				tabindex="0"
				onclick={() => newContactModalStore.open()}
				onkeydown={(e) => e.key === 'Enter' && newContactModalStore.open()}
				class="alphabet-contact-card new-contact-card"
			>
				<!-- Plus Avatar -->
				<div class="avatar-sm new-contact-avatar">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</div>

				<!-- Text -->
				<div class="contact-info">
					<div class="contact-main-row">
						<span class="contact-name">{$_('contacts.new')}</span>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Contacts grouped by letter -->
	<div class="alphabet-sections">
		{#each availableLetters as letter}
			<div id="section-{letter}" class="alphabet-section">
				<!-- Section Header -->
				<div class="section-header">
					<span class="section-letter">{letter}</span>
					<span class="section-count">{groupedContacts[letter].length}</span>
				</div>

				<!-- Contacts in this section -->
				<div class="section-contacts">
					{#each groupedContacts[letter] as contact (contact.id)}
						<div
							role="button"
							tabindex="0"
							onclick={() => onContactClick(contact.id)}
							onkeydown={(e) => e.key === 'Enter' && onContactClick(contact.id)}
							class="alphabet-contact-card {selectionMode && selectedIds.has(contact.id)
								? 'selected'
								: ''}"
						>
							<!-- Selection Checkbox -->
							{#if selectionMode}
								<button
									type="button"
									onclick={(e) => handleCheckboxClick(e, contact.id)}
									class="selection-checkbox"
									aria-label={selectedIds.has(contact.id) ? 'Auswahl aufheben' : 'Auswählen'}
								>
									{#if selectedIds.has(contact.id)}
										<svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
										</svg>
									{:else}
										<div class="w-5 h-5 rounded border-2 border-border"></div>
									{/if}
								</button>
							{/if}

							<!-- Avatar -->
							<div class="avatar-sm">
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

							<!-- Contact Info -->
							<div class="contact-info">
								<div class="contact-main-row">
									<span class="contact-name">{getDisplayName(contact)}</span>
									{#if contact.isFavorite}
										<svg class="favorite-badge" fill="currentColor" viewBox="0 0 24 24">
											<path
												d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
											/>
										</svg>
									{/if}
									{#if contact.company}
										<span class="contact-company-inline">@ {contact.company}</span>
									{/if}
								</div>
								{#if contact.tags && contact.tags.length > 0}
									<div class="contact-tags-row">
										{#each contact.tags.slice(0, 3) as tag}
											<span
												class="tag-chip"
												style="--tag-color: {tag.color || 'hsl(var(--primary))'}"
											>
												{tag.name}
											</span>
										{/each}
										{#if contact.tags.length > 3}
											<span class="tag-chip more-tags">+{contact.tags.length - 3}</span>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Action Icons (right side) -->
							<div class="contact-actions">
								{#if contact.phone || contact.mobile}
									<a
										href="tel:{contact.mobile || contact.phone}"
										onclick={(e) => e.stopPropagation()}
										class="action-chip"
										title={contact.mobile || contact.phone}
									>
										<svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
											/>
										</svg>
									</a>
								{/if}
								{#if contact.email}
									<a
										href="mailto:{contact.email}"
										onclick={(e) => e.stopPropagation()}
										class="action-chip"
										title={contact.email}
									>
										<svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</a>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Alphabet Quick Jump (like DateStrip) -->
	<div class="alphabet-nav">
		<div class="alphabet-nav-container">
			{#each alphabet as letter}
				<button
					type="button"
					class="alphabet-nav-btn"
					class:active={availableLetters.includes(letter)}
					class:disabled={!availableLetters.includes(letter)}
					onclick={() => availableLetters.includes(letter) && scrollToLetter(letter)}
					disabled={!availableLetters.includes(letter)}
				>
					{letter}
				</button>
			{/each}
			{#if availableLetters.includes('#')}
				<button type="button" class="alphabet-nav-btn active" onclick={() => scrollToLetter('#')}>
					#
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.alphabet-view {
		display: block;
		position: relative;
		padding-bottom: 10rem; /* Space for fixed alphabet nav + InputBar */
	}

	.alphabet-sections {
		min-width: 0;
	}

	.alphabet-section {
		margin-bottom: 1.5rem;
	}

	.section-header {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.875rem;
		margin-bottom: 0.75rem;
		position: sticky;
		top: 8px;
		z-index: 10;
		/* Glass pill effect */
		background: hsl(var(--background) / 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 9999px;
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.05);
	}

	.section-letter {
		font-size: 1rem;
		font-weight: 700;
		color: hsl(var(--primary));
		line-height: 1;
	}

	.section-count {
		font-size: 0.6875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1;
	}

	.section-contacts {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.alphabet-contact-card {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.75rem;
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		min-width: 0;
	}

	.alphabet-contact-card:hover {
		border-color: hsl(var(--primary));
		background-color: hsl(var(--accent));
	}

	.avatar-sm {
		width: 36px;
		height: 36px;
		min-width: 36px;
		border-radius: var(--radius-full);
		background-color: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.8125rem;
		flex-shrink: 0;
	}

	.contact-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.contact-main-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.contact-name {
		font-weight: 500;
		font-size: 0.9375rem;
		color: hsl(var(--foreground));
		white-space: nowrap;
	}

	.favorite-badge {
		width: 0.8125rem;
		height: 0.8125rem;
		color: hsl(var(--destructive, 0 84% 60%));
		flex-shrink: 0;
	}

	.contact-company-inline {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contact-tags-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.tag-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.0625rem 0.375rem;
		font-size: 0.625rem;
		font-weight: 500;
		border-radius: 9999px;
		background: var(--tag-color, hsl(var(--primary)));
		color: white;
		white-space: nowrap;
	}

	.tag-chip.more-tags {
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
	}

	.contact-actions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.action-chip {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full);
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.action-chip:hover {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.action-icon {
		width: 1rem;
		height: 1rem;
	}

	.selection-checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background 0.2s ease;
		flex-shrink: 0;
	}

	.selection-checkbox:hover {
		background: hsl(var(--muted));
	}

	.alphabet-contact-card.selected {
		background: hsl(var(--primary) / 0.1);
		border-color: hsl(var(--primary) / 0.3);
	}

	/* Alphabet Navigation - Horizontal strip above InputBar + PillNav (like DateStrip) */
	.alphabet-nav {
		position: fixed;
		bottom: calc(140px + env(safe-area-inset-bottom, 0px)); /* Above PillNav + InputBar */
		left: 0;
		right: 0;
		z-index: 48;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		pointer-events: none;
		transition: bottom 0.2s ease;
		/* Container query context */
		container-type: inline-size;
		container-name: alphabetnav;
	}

	.alphabet-nav-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 2px;
		padding: 0.5rem 1.5rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		scroll-behavior: smooth;
		/* Glass container with blur effect */
		background: hsl(var(--background) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: 16px;
		margin: 0 1rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
		border: 1px solid hsl(var(--border) / 0.6);
		pointer-events: auto;
		/* Default: left-aligned with fit-content */
		width: fit-content;
		max-width: calc(100% - 2rem);
	}

	/* Center when container has enough space */
	@container alphabetnav (min-width: 600px) {
		.alphabet-nav-container {
			margin-left: auto;
			margin-right: auto;
		}
	}

	.alphabet-nav-container::-webkit-scrollbar {
		display: none;
	}

	.alphabet-nav-btn {
		min-width: 44px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.alphabet-nav-btn:hover {
		background: hsl(var(--muted));
	}

	.alphabet-nav-btn.active {
		color: hsl(var(--foreground));
	}

	.alphabet-nav-btn.active:hover {
		background-color: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.alphabet-nav-btn.disabled {
		color: hsl(var(--muted-foreground) / 0.2);
		cursor: default;
	}

	.alphabet-nav-btn.disabled:hover {
		background: transparent;
	}

	/* New Contact Card */
	.new-contact-section {
		margin-bottom: 1rem;
	}

	.new-contact-card {
		border-style: dashed;
		border-color: hsl(var(--primary) / 0.4);
		background: hsl(var(--primary) / 0.05);
	}

	.new-contact-card:hover {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.1);
	}

	.new-contact-avatar {
		background: hsl(var(--primary) / 0.15);
		color: hsl(var(--primary));
	}

	.new-contact-avatar svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.new-contact-card .contact-info {
		gap: 0;
	}

	.new-contact-card .contact-name {
		font-size: 0.875rem;
	}
</style>
