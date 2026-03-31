<script lang="ts">
	import {
		Plus,
		Check,
		Heart,
		HeartBreak,
		Phone,
		Envelope,
		TextAa,
		CaretDown,
		ArrowSquareOut,
		Trash,
	} from '@manacore/shared-icons';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { _ } from 'svelte-i18n';
	import type { Contact } from '$lib/api/contacts';
	import { getDisplayName, getInitials } from '$lib/utils/contact-display';
	import type { SortField } from '$lib/components/SortToggle.svelte';
	import { newContactModalStore } from '$lib/stores/new-contact-modal.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
	import { contactsSettings } from '$lib/stores/settings.svelte';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import AlphabetNavContextMenu from '$lib/components/AlphabetNavContextMenu.svelte';

	interface Props {
		contacts: Contact[];
		onContactClick: (id: string) => void;
		onToggleFavorite: (e: MouseEvent, id: string) => void;
		onDeleteContact?: (id: string) => void;
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
		onDeleteContact,
		selectionMode = false,
		selectedIds = new Set(),
		onToggleSelection,
		sortField = 'lastName',
		showNewContactCard = true,
	}: Props = $props();

	// Context menu state
	let contactContextMenu = $state({ visible: false, x: 0, y: 0, target: null as Contact | null });

	function handleContactContextMenu(e: MouseEvent, contact: Contact) {
		e.preventDefault();
		e.stopPropagation();
		contactContextMenu = { visible: true, x: e.clientX, y: e.clientY, target: contact };
	}

	function getContactContextMenuItems(contact: Contact): ContextMenuItem[] {
		return [
			{
				id: 'open',
				label: 'Öffnen',
				icon: ArrowSquareOut,
				action: () => onContactClick(contact.id),
			},
			{
				id: 'favorite',
				label: contact.isFavorite ? 'Favorit entfernen' : 'Zu Favoriten',
				icon: contact.isFavorite ? HeartBreak : Heart,
				action: () => onToggleFavorite(new MouseEvent('click'), contact.id),
			},
			{ id: 'divider-1', label: '', type: 'divider' },
			{
				id: 'call',
				label: 'Anrufen',
				icon: Phone,
				disabled: !contact.phone && !contact.mobile,
				action: () => window.open('tel:' + (contact.mobile || contact.phone)),
			},
			{
				id: 'email',
				label: 'E-Mail schreiben',
				icon: Envelope,
				disabled: !contact.email,
				action: () => window.open('mailto:' + contact.email),
			},
			{ id: 'divider-2', label: '', type: 'divider' },
			{
				id: 'delete',
				label: 'Löschen',
				icon: Trash,
				variant: 'danger',
				action: () => onDeleteContact?.(contact.id),
			},
		];
	}

	// Derived state for toolbar positioning
	let isToolbarExpanded = $derived(!contactsFilterStore.isToolbarCollapsed);
	let isAlphabetNavCollapsed = $derived(contactsFilterStore.isAlphabetNavCollapsed);

	function toggleAlphabetNav() {
		contactsFilterStore.toggleAlphabetNav();
	}

	// Context menu for alphabet nav
	let alphabetContextMenu: AlphabetNavContextMenu;

	function handleAlphabetContextMenu(e: MouseEvent) {
		e.preventDefault();
		alphabetContextMenu?.show(e.clientX, e.clientY);
	}

	function handleCheckboxClick(e: MouseEvent, id: string) {
		e.stopPropagation();
		onToggleSelection?.(id);
	}

	// Alphabet with optional reverse order
	let alphabet = $derived.by(() => {
		let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
		if (contactsSettings.alphabetNavReverseOrder) {
			letters = letters.reverse();
		}
		return letters;
	});

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

	// Inline name editing
	function handleNameBlur(contact: Contact, el: HTMLSpanElement) {
		const trimmed = (el.textContent || '').trim();
		const currentName = getDisplayName(contact);
		if (trimmed && trimmed !== currentName) {
			// Parse display name back into first/last name
			const parts = trimmed.split(/\s+/);
			const firstName = parts[0] || '';
			const lastName = parts.slice(1).join(' ') || '';
			contactsStore.updateContact(contact.id, {
				firstName,
				lastName,
				displayName: trimmed,
			});
		} else {
			el.textContent = currentName;
		}
	}

	function handleNameKeydown(e: KeyboardEvent, contact: Contact) {
		const target = e.target as HTMLSpanElement;
		if (e.key === 'Enter') {
			e.preventDefault();
			target.blur();
		} else if (e.key === 'Escape') {
			target.textContent = getDisplayName(contact);
			target.blur();
		} else if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			const direction = e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey) ? -1 : 1;
			e.preventDefault();
			const allNames = Array.from(
				document.querySelectorAll<HTMLElement>('.contact-name-editable[contenteditable]')
			);
			const currentIndex = allNames.indexOf(target);
			const next = allNames[currentIndex + direction];
			target.blur();
			if (next) {
				next.focus();
			} else {
				document.querySelector<HTMLInputElement>('.quick-input-bar input')?.focus();
			}
		}
	}

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
					<Plus size={18} />
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
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="alphabet-contact-card {selectionMode && selectedIds.has(contact.id)
								? 'selected'
								: ''}"
							onclick={() => onContactClick(contact.id)}
							oncontextmenu={(e) => handleContactContextMenu(e, contact)}
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

							<!-- Avatar — click opens detail -->
							<button
								class="avatar-sm avatar-btn"
								onclick={() => onContactClick(contact.id)}
								title="Details öffnen"
							>
								{#if contact.photoUrl}
									<img
										src={contact.photoUrl}
										alt={getDisplayName(contact)}
										class="w-full h-full rounded-full object-cover"
									/>
								{:else}
									{getInitials(contact)}
								{/if}
							</button>

							<!-- Contact Info -->
							<div class="contact-info">
								<div class="contact-main-row">
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<span
										class="contact-name contact-name-editable"
										contenteditable="true"
										role="textbox"
										spellcheck="true"
										onkeydown={(e) => handleNameKeydown(e, contact)}
										onblur={(e) => handleNameBlur(contact, e.target as HTMLSpanElement)}
										onclick={(e) => e.stopPropagation()}
									>
										{getDisplayName(contact)}
									</span>
									{#if contact.isFavorite}
										<Heart size={13} weight="fill" class="favorite-badge" />
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
										class="action-chip"
										title={contact.mobile || contact.phone}
										onclick={(e) => e.stopPropagation()}
									>
										<Phone size={16} class="action-icon" />
									</a>
								{/if}
								{#if contact.email}
									<a
										href="mailto:{contact.email}"
										class="action-chip"
										title={contact.email}
										onclick={(e) => e.stopPropagation()}
									>
										<Envelope size={16} class="action-icon" />
									</a>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Alphabet FAB (when collapsed) - positioned left of InputBar -->
	<div class="alphabet-fab-container" class:toolbar-expanded={isToolbarExpanded}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<button
			onclick={toggleAlphabetNav}
			oncontextmenu={handleAlphabetContextMenu}
			class="alphabet-fab"
			class:active={!isAlphabetNavCollapsed}
			title={isAlphabetNavCollapsed
				? 'Alphabet-Navigation öffnen (Rechtsklick für Optionen)'
				: 'Alphabet-Navigation schließen (Rechtsklick für Optionen)'}
		>
			{#if isAlphabetNavCollapsed}
				<TextAa size={24} class="fab-icon" />
			{:else}
				<CaretDown size={24} class="fab-icon" />
			{/if}
		</button>
	</div>

	<!-- Alphabet Quick Jump (like DateStrip) - hidden when collapsed -->
	{#if !isAlphabetNavCollapsed}
		<div class="alphabet-nav" class:toolbar-expanded={isToolbarExpanded}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="alphabet-nav-container"
				class:compact={contactsSettings.alphabetNavCompact}
				oncontextmenu={handleAlphabetContextMenu}
			>
				{#each alphabet as letter}
					{@const isActive = availableLetters.includes(letter)}
					{@const shouldHide = contactsSettings.alphabetNavHideInactive && !isActive}
					{#if !shouldHide}
						<button
							type="button"
							class="alphabet-nav-btn"
							class:active={isActive}
							class:disabled={!isActive}
							class:compact={contactsSettings.alphabetNavCompact}
							onclick={() => isActive && scrollToLetter(letter)}
							disabled={!isActive}
						>
							{letter}
						</button>
					{/if}
				{/each}
				{#if contactsSettings.alphabetNavShowHash && availableLetters.includes('#')}
					<button
						type="button"
						class="alphabet-nav-btn active"
						class:compact={contactsSettings.alphabetNavCompact}
						onclick={() => scrollToLetter('#')}
					>
						#
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<AlphabetNavContextMenu bind:this={alphabetContextMenu} />
</div>

<ContextMenu
	visible={contactContextMenu.visible}
	x={contactContextMenu.x}
	y={contactContextMenu.y}
	items={contactContextMenu.target ? getContactContextMenuItems(contactContextMenu.target) : []}
	onClose={() => (contactContextMenu = { visible: false, x: 0, y: 0, target: null })}
/>

<style>
	.alphabet-view {
		display: block;
		position: relative;
		padding-bottom: 10rem; /* Space for fixed alphabet nav + InputBar */
		max-width: 600px;
		margin: 0 auto;
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
		min-width: 0;
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	.alphabet-contact-card:hover {
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

	.contact-name-editable {
		cursor: text;
		outline: none;
		border-radius: 0.25rem;
		padding: 0.0625rem 0.125rem;
		margin: -0.0625rem -0.125rem;
	}

	.avatar-btn {
		border: none;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.avatar-btn:hover {
		opacity: 0.8;
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

	/* When toolbar is expanded, push Alphabet-Nav up (+70px) */
	.alphabet-nav.toolbar-expanded {
		bottom: calc(210px + env(safe-area-inset-bottom, 0px));
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

	/* Compact mode for alphabet nav */
	.alphabet-nav-container.compact {
		padding: 0.375rem 1rem;
	}

	.alphabet-nav-btn.compact {
		min-width: 36px;
		height: 40px;
		font-size: 0.9375rem;
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

	/* Alphabet FAB - positioned left of InputBar */
	.alphabet-fab-container {
		position: fixed;
		bottom: calc(70px + 9px + env(safe-area-inset-bottom, 0px)); /* Align with InputBar */
		/* InputBar is 450px when toolbar is shown: left edge at 50% - 225px, minus gap and fab width */
		left: calc(50% - 225px - 8px - 54px);
		z-index: 49; /* Below InputBar (90) and ExpandableToolbar FAB (91), above alphabet-nav (48) */
		pointer-events: none;
		transition:
			bottom 0.2s ease,
			left 0.2s ease;
	}

	/* Responsive positioning for FAB */
	@media (max-width: 900px) {
		.alphabet-fab-container {
			left: 1rem;
		}
	}

	/* When toolbar is expanded, move FAB up */
	.alphabet-fab-container.toolbar-expanded {
		bottom: calc(140px + 9px + env(safe-area-inset-bottom, 0px));
	}

	.alphabet-fab {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 54px;
		height: 54px;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		pointer-events: auto;
		/* Glass pill styling */
		background: hsl(var(--background) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border));
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.08);
		border-radius: 9999px;
	}

	.alphabet-fab:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px hsl(var(--foreground) / 0.15);
	}

	.alphabet-fab.active {
		background: hsl(var(--muted));
	}

	.alphabet-fab.active .fab-icon {
		color: hsl(var(--primary));
	}

	.alphabet-fab .fab-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: hsl(var(--muted-foreground));
		transition: color 0.2s ease;
	}

	.alphabet-fab:hover .fab-icon {
		color: hsl(var(--foreground));
	}
</style>
