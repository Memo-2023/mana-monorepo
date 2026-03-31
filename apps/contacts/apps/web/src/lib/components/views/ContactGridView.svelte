<script lang="ts">
	import { Plus, Check, Heart, Phone, Envelope } from '@manacore/shared-icons';
	import { _ } from 'svelte-i18n';
	import type { Contact } from '$lib/api/contacts';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';

	interface Props {
		contacts: Contact[];
		onContactClick: (id: string) => void;
		onToggleFavorite: (e: MouseEvent, id: string) => void;
		onDeleteContact?: (id: string) => void;
		selectionMode?: boolean;
		selectedIds?: Set<string>;
		onToggleSelection?: (id: string) => void;
		showNewContactCard?: boolean;
	}

	let {
		contacts,
		onContactClick,
		onToggleFavorite,
		onDeleteContact,
		selectionMode = false,
		selectedIds = new Set(),
		onToggleSelection,
		showNewContactCard = true,
	}: Props = $props();

	let contextMenu = $state({ visible: false, x: 0, y: 0, target: null as Contact | null });

	function handleContextMenu(e: MouseEvent, contact: Contact) {
		e.preventDefault();
		e.stopPropagation();
		contextMenu = { visible: true, x: e.clientX, y: e.clientY, target: contact };
	}

	function getContextMenuItems(contact: Contact): ContextMenuItem[] {
		return [
			{
				id: 'open',
				label: 'Öffnen',
				action: () => onContactClick(contact.id),
			},
			{
				id: 'favorite',
				label: contact.isFavorite ? 'Favorit entfernen' : 'Favorit',
				action: () => onToggleFavorite(new MouseEvent('click'), contact.id),
			},
			{ id: 'divider-1', label: '', type: 'divider' },
			{
				id: 'call',
				label: 'Anrufen',
				disabled: !contact.phone && !contact.mobile,
				action: () => window.open('tel:' + (contact.mobile || contact.phone)),
			},
			{
				id: 'email',
				label: 'E-Mail',
				disabled: !contact.email,
				action: () => window.open('mailto:' + contact.email),
			},
			{ id: 'divider-2', label: '', type: 'divider' },
			{
				id: 'delete',
				label: 'Löschen',
				variant: 'danger',
				action: () => onDeleteContact?.(contact.id),
			},
		];
	}

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
				<Plus size={40} />
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
			oncontextmenu={(e) => handleContextMenu(e, contact)}
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
						<Check size={20} class="text-primary" />
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
					<Heart size={20} weight="fill" class="text-red-500" />
				{:else}
					<Heart size={20} class="text-muted-foreground" />
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
						<Phone size={16} />
					</a>
				{/if}
				{#if contact.email}
					<a
						href="mailto:{contact.email}"
						onclick={(e) => e.stopPropagation()}
						class="action-btn"
						title={$_('contacts.email')}
					>
						<Envelope size={16} />
					</a>
				{/if}
			</div>
		</div>
	{/each}
</div>

{#if contextMenu.visible && contextMenu.target}
	<ContextMenu
		visible={contextMenu.visible}
		x={contextMenu.x}
		y={contextMenu.y}
		items={getContextMenuItems(contextMenu.target)}
		onClose={() => (contextMenu = { visible: false, x: 0, y: 0, target: null })}
	/>
{/if}

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
