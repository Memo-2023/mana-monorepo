<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Contact } from '$lib/api/contacts';
	import type { SortField } from '$lib/components/SortToggle.svelte';

	interface Props {
		contacts: Contact[];
		onContactClick: (id: string) => void;
		onToggleFavorite: (e: MouseEvent, id: string) => void;
		selectionMode?: boolean;
		selectedIds?: Set<string>;
		onToggleSelection?: (id: string) => void;
		sortField?: SortField;
	}

	let {
		contacts,
		onContactClick,
		onToggleFavorite,
		selectionMode = false,
		selectedIds = new Set(),
		onToggleSelection,
		sortField = 'lastName',
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
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

<div class="alphabet-view">
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
								<div class="contact-name">
									{getDisplayName(contact)}
								</div>
								<div class="contact-details">
									{#if contact.jobTitle && contact.company}
										<span>{contact.jobTitle} @ {contact.company}</span>
									{:else if contact.company}
										<span>{contact.company}</span>
									{:else if contact.email}
										<span>{contact.email}</span>
									{/if}
								</div>
							</div>

							<!-- Quick Actions -->
							<div class="quick-actions">
								{#if contact.phone || contact.mobile}
									<a
										href="tel:{contact.mobile || contact.phone}"
										onclick={(e) => e.stopPropagation()}
										class="quick-action-btn"
										title={$_('contacts.call')}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
										class="quick-action-btn"
										title={$_('contacts.email')}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
									</a>
								{/if}
								<button
									onclick={(e) => onToggleFavorite(e, contact.id)}
									class="quick-action-btn"
									title={contact.isFavorite ? $_('contacts.unfavorite') : $_('contacts.favorite')}
								>
									{#if contact.isFavorite}
										<svg class="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24">
											<path
												d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
											/>
										</svg>
									{:else}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
											/>
										</svg>
									{/if}
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Alphabet Quick Jump -->
	<div class="alphabet-nav">
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

<style>
	.alphabet-view {
		display: flex;
		gap: 1rem;
		position: relative;
	}

	.alphabet-sections {
		flex: 1;
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
		top: 80px;
		z-index: 10;
		/* Glass pill effect */
		background: hsl(var(--background) / 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 9999px;
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.05);
	}

	@media (max-width: 768px) {
		.section-header {
			top: 90px;
		}
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
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.alphabet-contact-card:hover {
		border-color: hsl(var(--primary));
		background-color: hsl(var(--accent));
	}

	.avatar-sm {
		width: 52px;
		height: 52px;
		min-width: 52px;
		border-radius: var(--radius-full);
		background-color: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.125rem;
	}

	.contact-info {
		flex: 1;
		min-width: 0;
	}

	.contact-name {
		font-weight: 500;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contact-details {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.quick-actions {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity var(--transition-fast);
	}

	.alphabet-contact-card:hover .quick-actions {
		opacity: 1;
	}

	.quick-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full);
		background-color: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		transition: all var(--transition-fast);
		border: none;
		cursor: pointer;
	}

	.quick-action-btn:hover {
		background-color: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
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

	/* Alphabet Navigation */
	.alphabet-nav {
		position: sticky;
		top: 80px;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.25rem;
		height: fit-content;
		/* Glass effect */
		background: hsl(var(--background) / 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: var(--radius-lg);
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.05);
	}

	@media (min-width: 769px) and (max-width: 1024px) {
		.alphabet-nav {
			top: 80px;
		}
	}

	.alphabet-nav-btn {
		width: 1.75rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.alphabet-nav-btn.active {
		color: hsl(var(--foreground));
	}

	.alphabet-nav-btn.active:hover {
		background-color: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.alphabet-nav-btn.disabled {
		color: hsl(var(--muted-foreground) / 0.3);
		cursor: default;
	}

	/* Mobile: Hide alphabet nav, show horizontal version at bottom */
	@media (max-width: 768px) {
		.alphabet-view {
			flex-direction: column;
		}

		.alphabet-nav {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.25rem;
			padding: 0.5rem;
			border-radius: 0;
			border-left: none;
			border-right: none;
			border-bottom: none;
			z-index: 50;
		}

		.alphabet-nav-btn {
			width: 1.5rem;
			height: 1.5rem;
		}

		.alphabet-sections {
			padding-bottom: 4rem;
		}

		.quick-actions {
			opacity: 1;
		}
	}
</style>
