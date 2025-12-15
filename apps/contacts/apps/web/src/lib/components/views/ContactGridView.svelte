<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Contact } from '$lib/api/contacts';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';

	interface Props {
		contacts: Contact[];
		onContactClick: (id: string) => void;
		onToggleFavorite: (e: MouseEvent, id: string) => void;
		selectionMode?: boolean;
		selectedIds?: Set<string>;
		onToggleSelection?: (id: string) => void;
		showNewContactCard?: boolean;
	}

	let {
		contacts,
		onContactClick,
		onToggleFavorite,
		selectionMode = false,
		selectedIds = new Set(),
		onToggleSelection,
		showNewContactCard = true,
	}: Props = $props();

	function handleCheckboxClick(e: MouseEvent, id: string) {
		e.stopPropagation();
		onToggleSelection?.(id);
	}

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

	// Generate a consistent gradient based on contact name
	function getGradient(contact: Contact) {
		const name = getDisplayName(contact);
		const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
		const gradients = [
			'from-blue-500 to-purple-600',
			'from-green-500 to-teal-600',
			'from-orange-500 to-red-600',
			'from-pink-500 to-rose-600',
			'from-indigo-500 to-blue-600',
			'from-cyan-500 to-blue-600',
			'from-violet-500 to-purple-600',
			'from-amber-500 to-orange-600',
		];
		return gradients[hash % gradients.length];
	}
</script>

<div class="contact-grid">
	<!-- New Contact Card -->
	{#if showNewContactCard && !selectionMode}
		<div
			role="button"
			tabindex="0"
			onclick={() => newContactModalStore.open()}
			onkeydown={(e) => e.key === 'Enter' && newContactModalStore.open()}
			class="grid-card new-contact-card"
		>
			<!-- Plus Avatar -->
			<div class="grid-avatar new-contact-avatar">
				<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</div>

			<!-- Info -->
			<div class="grid-info">
				<h3 class="grid-name">{$_('contacts.new')}</h3>
				<p class="grid-job">{$_('contacts.addFirst')}</p>
			</div>
		</div>
	{/if}

	{#each contacts as contact (contact.id)}
		<div
			role="button"
			tabindex="0"
			onclick={() => onContactClick(contact.id)}
			onkeydown={(e) => e.key === 'Enter' && onContactClick(contact.id)}
			class="grid-card {selectionMode && selectedIds.has(contact.id) ? 'selected' : ''}"
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

			<!-- Favorite Badge -->
			<button
				onclick={(e) => onToggleFavorite(e, contact.id)}
				class="favorite-btn"
				title={contact.isFavorite ? $_('contacts.unfavorite') : $_('contacts.favorite')}
			>
				{#if contact.isFavorite}
					<svg class="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
						<path
							d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
						/>
					</svg>
				{:else}
					<svg
						class="w-5 h-5 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
				{/if}
			</button>

			<!-- Avatar -->
			<div class="grid-avatar bg-gradient-to-br {getGradient(contact)}">
				{#if contact.photoUrl}
					<img
						src={contact.photoUrl}
						alt={getDisplayName(contact)}
						class="w-full h-full rounded-full object-cover"
					/>
				{:else}
					<span class="text-white font-bold text-2xl">{getInitials(contact)}</span>
				{/if}
			</div>

			<!-- Contact Info -->
			<div class="grid-info">
				<h3 class="grid-name">{getDisplayName(contact)}</h3>
				{#if contact.jobTitle}
					<p class="grid-job">{contact.jobTitle}</p>
				{/if}
				{#if contact.company}
					<p class="grid-company">{contact.company}</p>
				{/if}
			</div>

			<!-- Quick Actions -->
			<div class="grid-actions">
				{#if contact.phone || contact.mobile}
					<a
						href="tel:{contact.mobile || contact.phone}"
						onclick={(e) => e.stopPropagation()}
						class="action-btn"
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
						class="action-btn"
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
			</div>
		</div>
	{/each}
</div>

<style>
	.contact-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.contact-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.contact-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.contact-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.grid-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1rem;
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-base);
		/* Equal height cards */
		min-height: 280px;
	}

	.grid-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: hsl(var(--primary) / 0.3);
	}

	.favorite-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-full);
		transition: all var(--transition-fast);
	}

	.favorite-btn:hover {
		background-color: hsl(var(--muted));
		transform: scale(1.1);
	}

	.grid-avatar {
		width: 100px;
		height: 100px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
		box-shadow: var(--shadow-md);
		font-size: 2rem;
	}

	.grid-info {
		text-align: center;
		min-width: 0;
		width: 100%;
	}

	.grid-name {
		font-weight: 600;
		font-size: 1rem;
		color: hsl(var(--foreground));
		margin-bottom: 0.25rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.grid-job {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.grid-company {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground) / 0.8);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.grid-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: auto; /* Push to bottom of card */
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
		width: 100%;
		justify-content: center;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-full);
		background-color: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
		transition: all var(--transition-fast);
	}

	.action-btn:hover {
		background-color: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.selection-checkbox {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: hsl(var(--background));
		border: none;
		cursor: pointer;
		transition: background 0.2s ease;
		z-index: 10;
	}

	.selection-checkbox:hover {
		background: hsl(var(--muted));
	}

	.grid-card.selected {
		background: hsl(var(--primary) / 0.1) !important;
		border-color: hsl(var(--primary) / 0.3) !important;
	}

	/* New Contact Card */
	.new-contact-card {
		border-style: dashed;
		border-color: hsl(var(--primary) / 0.4);
		background: hsl(var(--primary) / 0.05);
	}

	.new-contact-card:hover {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.1);
		transform: translateY(-4px);
	}

	.new-contact-avatar {
		background: hsl(var(--primary) / 0.15);
		color: hsl(var(--primary));
	}
</style>
