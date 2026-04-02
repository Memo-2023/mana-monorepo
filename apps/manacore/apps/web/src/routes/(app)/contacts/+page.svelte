<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Observable } from 'dexie';
	import { dropTarget } from '@manacore/shared-ui/dnd';
	import type { DragPayload, TagDragData } from '@manacore/shared-ui/dnd';
	import { useAllTags } from '$lib/stores/tags.svelte';
	import {
		type Contact,
		contactsFilterStore,
		contactsStore,
		contactModalStore,
		searchContacts,
		filterActive,
		filterFavorites,
		sortContacts,
		applyContactFilter,
		groupByLetter,
		getDisplayName,
		getInitials,
	} from '$lib/modules/contacts';
	import {
		MagnifyingGlass,
		Plus,
		Star,
		Archive,
		Trash,
		PencilSimple,
		Funnel,
		Users,
		User,
		Envelope,
		Briefcase,
		MapPin,
		X,
	} from '@manacore/shared-icons';

	// Get contacts from layout context
	const allContacts$: Observable<Contact[]> = getContext('contacts');

	let allContacts = $state<Contact[]>([]);

	$effect(() => {
		const sub = allContacts$.subscribe((contacts) => {
			allContacts = contacts;
		});
		return () => sub.unsubscribe();
	});

	// Filtered & sorted contacts
	let activeContacts = $derived(filterActive(allContacts));
	let filtered = $derived(applyContactFilter(activeContacts, contactsFilterStore.contactFilter));
	let searched = $derived(searchContacts(filtered, contactsFilterStore.searchQuery));
	let sorted = $derived(sortContacts(searched, contactsFilterStore.sortField));

	// Stats
	let totalCount = $derived(activeContacts.length);
	let favoriteCount = $derived(filterFavorites(activeContacts).length);

	// Alphabet grouping
	let groups = $derived(groupByLetter(sorted, contactsFilterStore.sortField));
	let letters = $derived(Object.keys(groups).sort());

	// ── DnD: tag support ────────────────────────────────────
	const globalTags = useAllTags();
	const tagMap = $derived(new Map((globalTags.value ?? []).map((t) => [t.id, t])));

	function getContactTags(contact: Contact) {
		return (contact.tagIds ?? [])
			.map((id) => tagMap.get(id))
			.filter((t): t is NonNullable<typeof t> => t != null);
	}

	function handleTagDrop(contact: Contact, payload: DragPayload) {
		const tagData = payload.data as TagDragData;
		const current = contact.tagIds ?? [];
		if (!current.includes(tagData.id)) {
			contactsStore.updateTagIds(contact.id, [...current, tagData.id]);
		}
	}

	function tagNotAlreadyOnContact(contact: Contact) {
		return (payload: DragPayload) => {
			const tagData = payload.data as TagDragData;
			return !(contact.tagIds ?? []).includes(tagData.id);
		};
	}

	// Register passive handler for contact→tag direction
	const tagDropCtx = getContext<{
		set: (handler: (tagId: string, payload: DragPayload) => void) => void;
		clear: () => void;
	}>('tagDropHandler');

	onMount(() => {
		tagDropCtx?.set(async (tagId: string, payload: DragPayload) => {
			const data = payload.data as { id: string };
			if (payload.type === 'contact') {
				const contact = allContacts.find((c) => c.id === data.id);
				if (!contact) return;
				const current = contact.tagIds ?? [];
				if (!current.includes(tagId)) {
					contactsStore.updateTagIds(data.id, [...current, tagId]);
				}
			}
		});
		return () => tagDropCtx?.clear();
	});

	// Handlers
	function handleToggleFavorite(e: MouseEvent, id: string) {
		e.stopPropagation();
		contactsStore.toggleFavorite(id);
	}

	function handleArchive(e: MouseEvent, id: string) {
		e.stopPropagation();
		contactsStore.toggleArchive(id);
	}

	function handleDelete(e: MouseEvent, contact: Contact) {
		e.stopPropagation();
		if (!confirm(`"${getDisplayName(contact)}" endgueltig loeschen?`)) return;
		contactsStore.deleteContact(contact.id);
	}

	let showFilters = $state(false);
</script>

<svelte:head>
	<title>Kontakte - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<!-- Header -->
	<header class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Kontakte</h1>
			<p class="text-muted-foreground mt-1 text-sm">
				{totalCount} Kontakte{favoriteCount > 0 ? ` · ${favoriteCount} Favoriten` : ''}
			</p>
		</div>
		<button
			onclick={() => contactModalStore.open()}
			class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
		>
			<Plus size={16} />
			Neu
		</button>
	</header>

	<!-- Search & Filter Bar -->
	<div class="mb-4 flex gap-2">
		<div class="relative flex-1">
			<MagnifyingGlass
				size={18}
				class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				placeholder="Kontakte suchen..."
				value={contactsFilterStore.searchQuery}
				oninput={(e) => contactsFilterStore.setSearchQuery(e.currentTarget.value)}
				class="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>
		<button
			onclick={() => (showFilters = !showFilters)}
			class="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
			class:border-primary={contactsFilterStore.contactFilter !== 'all'}
			class:text-primary={contactsFilterStore.contactFilter !== 'all'}
		>
			<Funnel size={16} />
		</button>
	</div>

	<!-- Filter Options -->
	{#if showFilters}
		<div class="mb-4 flex flex-wrap gap-2">
			{#each [{ value: 'all', label: 'Alle' }, { value: 'favorites', label: 'Favoriten' }, { value: 'hasEmail', label: 'Mit E-Mail' }, { value: 'hasPhone', label: 'Mit Telefon' }, { value: 'incomplete', label: 'Unvollstaendig' }] as filter}
				<button
					onclick={() => contactsFilterStore.setContactFilter(filter.value)}
					class="rounded-full border px-3 py-1 text-xs font-medium transition-colors
						{contactsFilterStore.contactFilter === filter.value
						? 'border-primary bg-primary/10 text-primary'
						: 'border-border text-muted-foreground hover:border-primary/50'}"
				>
					{filter.label}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Contact List -->
	{#if sorted.length === 0}
		<div class="flex flex-col items-center py-12 text-center">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<Users size={32} class="text-muted-foreground" />
			</div>
			{#if contactsFilterStore.searchQuery}
				<h2 class="mb-1 text-lg font-semibold text-foreground">Keine Ergebnisse</h2>
				<p class="text-sm text-muted-foreground">
					Keine Kontakte gefunden fuer "{contactsFilterStore.searchQuery}"
				</p>
			{:else}
				<h2 class="mb-1 text-lg font-semibold text-foreground">Noch keine Kontakte</h2>
				<p class="mb-4 text-sm text-muted-foreground">
					Erstelle deinen ersten Kontakt oder importiere bestehende.
				</p>
				<div class="flex gap-2">
					<button
						onclick={() => contactModalStore.open()}
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
					>
						Kontakt erstellen
					</button>
					<a
						href="/contacts/import"
						class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
					>
						Importieren
					</a>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Alphabet sections -->
		{#each letters as letter (letter)}
			<div class="mb-4">
				<div
					class="sticky top-0 z-10 mb-1 bg-background/90 px-1 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-sm"
				>
					{letter}
				</div>
				<div class="space-y-1">
					{#each groups[letter] as contact (contact.id)}
						<a
							href="/contacts/{contact.id}"
							class="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-card group"
							use:dropTarget={{
								accepts: ['tag'],
								onDrop: (payload) => handleTagDrop(contact, payload),
								canDrop: tagNotAlreadyOnContact(contact),
							}}
						>
							<!-- Avatar -->
							<div
								class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
							>
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

							<!-- Info -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="font-medium text-foreground truncate">
										{getDisplayName(contact)}
									</span>
									{#if contact.isFavorite}
										<Star weight="fill" size={14} class="flex-shrink-0 text-amber-500" />
									{/if}
								</div>
								{#if contact.company || contact.jobTitle}
									<div class="truncate text-xs text-muted-foreground">
										{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
									</div>
								{/if}
								{#if getContactTags(contact).length > 0}
									<div class="mt-0.5 flex gap-1">
										{#each getContactTags(contact).slice(0, 3) as tag (tag.id)}
											<span
												class="inline-flex rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium"
												style="background: color-mix(in srgb, {tag.color} 15%, transparent); color: {tag.color}"
											>
												{tag.name}
											</span>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Actions (visible on hover) -->
							<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<button
									onclick={(e) => handleToggleFavorite(e, contact.id)}
									class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-amber-500"
									title={contact.isFavorite ? 'Favorit entfernen' : 'Zu Favoriten'}
								>
									{#if contact.isFavorite}
										<Star weight="fill" size={14} />
									{:else}
										<Star size={14} />
									{/if}
								</button>
								<button
									onclick={(e) => handleArchive(e, contact.id)}
									class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
									title="Archivieren"
								>
									<Archive size={14} />
								</button>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/each}

		<p class="mt-4 text-center text-xs text-muted-foreground">
			{sorted.length} Kontakt{sorted.length !== 1 ? 'e' : ''}
		</p>
	{/if}
</div>

<!-- New/Edit Contact Modal -->
{#if contactModalStore.isOpen}
	{@const isEditing = !!contactModalStore.editContactId}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => e.target === e.currentTarget && contactModalStore.close()}
	>
		<div
			class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl"
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div
				class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3"
			>
				<h2 class="text-lg font-bold text-foreground">
					{isEditing ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
				</h2>
				<button
					onclick={() => contactModalStore.close()}
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
				>
					<X size={20} />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					const val = (name: string) => (fd.get(name) as string) || undefined;
					contactsStore.createContact({
						firstName: val('firstName'),
						lastName: val('lastName'),
						email: val('email'),
						phone: val('phone'),
						mobile: val('mobile'),
						company: val('company'),
						jobTitle: val('jobTitle'),
						street: val('street'),
						city: val('city'),
						postalCode: val('postalCode'),
						country: val('country'),
						notes: val('notes'),
						birthday: val('birthday'),
						linkedin: val('linkedin'),
						twitter: val('twitter'),
						instagram: val('instagram'),
						github: val('github'),
						website: val('website'),
					});
					contactModalStore.close();
				}}
				class="space-y-0"
			>
				<!-- Name Section -->
				<div class="contact-section">
					<div class="section-icon-row">
						<User size={18} class="text-muted-foreground" />
						<span class="section-label">Name</span>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<input
							name="firstName"
							type="text"
							placeholder="Vorname"
							value={contactModalStore.prefillData?.firstName ?? ''}
							class="contact-input"
						/>
						<input
							name="lastName"
							type="text"
							placeholder="Nachname"
							value={contactModalStore.prefillData?.lastName ?? ''}
							class="contact-input"
						/>
					</div>
				</div>

				<!-- Contact Section -->
				<div class="contact-section">
					<div class="section-icon-row">
						<Envelope size={18} class="text-muted-foreground" />
						<span class="section-label">Kontakt</span>
					</div>
					<input
						name="email"
						type="email"
						placeholder="E-Mail"
						value={contactModalStore.prefillData?.email ?? ''}
						class="contact-input"
					/>
					<div class="grid grid-cols-2 gap-2">
						<input name="mobile" type="tel" placeholder="Mobil" class="contact-input" />
						<input
							name="phone"
							type="tel"
							placeholder="Telefon"
							value={contactModalStore.prefillData?.phone ?? ''}
							class="contact-input"
						/>
					</div>
				</div>

				<!-- Work Section -->
				<div class="contact-section">
					<div class="section-icon-row">
						<Briefcase size={18} class="text-muted-foreground" />
						<span class="section-label">Arbeit</span>
					</div>
					<input
						name="company"
						type="text"
						placeholder="Unternehmen"
						value={contactModalStore.prefillData?.company ?? ''}
						class="contact-input"
					/>
					<input name="jobTitle" type="text" placeholder="Position" class="contact-input" />
					<input name="website" type="url" placeholder="Website" class="contact-input" />
				</div>

				<!-- Address Section -->
				<div class="contact-section">
					<div class="section-icon-row">
						<MapPin size={18} class="text-muted-foreground" />
						<span class="section-label">Adresse</span>
					</div>
					<input
						name="street"
						type="text"
						placeholder="Straße & Hausnummer"
						class="contact-input"
					/>
					<div class="grid grid-cols-[5rem_1fr] gap-2">
						<input name="postalCode" type="text" placeholder="PLZ" class="contact-input" />
						<input name="city" type="text" placeholder="Stadt" class="contact-input" />
					</div>
					<input name="country" type="text" placeholder="Land" class="contact-input" />
				</div>

				<!-- Birthday -->
				<div class="contact-section">
					<div class="section-icon-row">
						<span class="text-muted-foreground text-sm">🎂</span>
						<span class="section-label">Geburtstag</span>
					</div>
					<input name="birthday" type="date" class="contact-input" />
				</div>

				<!-- Notes Section -->
				<div class="contact-section">
					<div class="section-icon-row">
						<PencilSimple size={18} class="text-muted-foreground" />
						<span class="section-label">Notizen</span>
					</div>
					<textarea
						name="notes"
						rows="3"
						placeholder="Notizen zum Kontakt..."
						class="contact-input resize-none"
					></textarea>
				</div>

				<!-- Social Media (collapsed by default) -->
				<details class="contact-section">
					<summary class="section-icon-row cursor-pointer select-none">
						<span class="text-muted-foreground text-sm">🔗</span>
						<span class="section-label">Social Media</span>
					</summary>
					<div class="mt-2 space-y-2">
						<input name="linkedin" type="url" placeholder="LinkedIn URL" class="contact-input" />
						<input name="twitter" type="text" placeholder="Twitter / X" class="contact-input" />
						<input name="instagram" type="text" placeholder="Instagram" class="contact-input" />
						<input name="github" type="text" placeholder="GitHub" class="contact-input" />
					</div>
				</details>

				<!-- Actions -->
				<div class="flex justify-end gap-2 border-t border-border px-5 py-3">
					<button
						type="button"
						onclick={() => contactModalStore.close()}
						class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Speichern
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Contact Modal Form Styles */
	.contact-section {
		padding: 0.75rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.section-icon-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.contact-input {
		width: 100%;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		transition: border-color 0.15s;
	}

	.contact-input:focus {
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 2px hsl(var(--color-primary) / 0.15);
	}

	.contact-input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.5);
	}

	:global(.mana-drop-target-hover) {
		outline: 2px solid var(--color-primary, #6366f1);
		outline-offset: -2px;
		border-radius: 0.5rem;
		background: rgba(99, 102, 241, 0.06) !important;
	}

	:global(.mana-drop-target-success) {
		animation: drop-success 400ms ease-out;
	}

	@keyframes drop-success {
		0% {
			outline-color: #10b981;
			background: rgba(16, 185, 129, 0.1);
		}
		100% {
			outline-color: transparent;
			background: transparent;
		}
	}
</style>
