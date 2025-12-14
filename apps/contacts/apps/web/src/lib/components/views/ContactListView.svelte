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

	function handleCheckboxClick(e: MouseEvent, id: string) {
		e.stopPropagation();
		onToggleSelection?.(id);
	}
</script>

<div class="space-y-2">
	<!-- New Contact Card -->
	{#if showNewContactCard && !selectionMode}
		<div
			role="button"
			tabindex="0"
			onclick={() => newContactModalStore.open()}
			onkeydown={(e) => e.key === 'Enter' && newContactModalStore.open()}
			class="contact-card new-contact-card w-full text-left cursor-pointer"
		>
			<!-- Plus Avatar -->
			<div class="avatar new-contact-avatar">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</div>

			<!-- Text -->
			<div class="flex-1 min-w-0">
				<div class="font-medium text-foreground">
					{$_('contacts.new')}
				</div>
				<div class="text-sm text-muted-foreground">
					{$_('contacts.addFirst')}
				</div>
			</div>
		</div>
	{/if}

	{#each contacts as contact (contact.id)}
		<div
			role="button"
			tabindex="0"
			onclick={() => onContactClick(contact.id)}
			onkeydown={(e) => e.key === 'Enter' && onContactClick(contact.id)}
			class="contact-card w-full text-left cursor-pointer {selectionMode &&
			selectedIds.has(contact.id)
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
			<div class="avatar">
				{#if contact.photoUrl}
					<img
						src={contact.photoUrl}
						alt={getDisplayName(contact)}
						class="h-full w-full rounded-full object-cover"
					/>
				{:else}
					{getInitials(contact)}
				{/if}
			</div>

			<!-- Contact Info -->
			<div class="flex-1 min-w-0">
				<div class="font-medium text-foreground truncate">
					{getDisplayName(contact)}
				</div>
				{#if contact.company || contact.jobTitle}
					<div class="text-sm text-muted-foreground truncate">
						{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
					</div>
				{/if}
				{#if contact.email}
					<div class="text-sm text-muted-foreground truncate">
						{contact.email}
					</div>
				{/if}
			</div>

			<!-- Favorite button -->
			<button
				onclick={(e) => onToggleFavorite(e, contact.id)}
				class="p-2 rounded-full hover:bg-accent transition-colors"
			>
				{#if contact.isFavorite}
					<svg class="h-5 w-5 text-red-500 fill-current" viewBox="0 0 24 24">
						<path
							d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
						/>
					</svg>
				{:else}
					<svg
						class="h-5 w-5 text-muted-foreground"
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
		</div>
	{/each}
</div>

<style>
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
		background: hsl(var(--color-muted));
	}

	:global(.contact-card.selected) {
		background: hsl(var(--color-primary) / 0.1) !important;
		border-color: hsl(var(--color-primary) / 0.3) !important;
	}

	/* New Contact Card */
	.new-contact-card {
		border-style: dashed;
		border-color: hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.05);
	}

	.new-contact-card:hover {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}

	.new-contact-avatar {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}
</style>
