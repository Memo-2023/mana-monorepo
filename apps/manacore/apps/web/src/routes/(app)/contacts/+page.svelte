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
		StarFill,
		Archive,
		Trash,
		PencilSimple,
		Funnel,
		Users,
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
										<StarFill size={14} class="flex-shrink-0 text-amber-500" />
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
										<StarFill size={14} />
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
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
			<h2 class="mb-4 text-lg font-bold text-foreground">
				{isEditing ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
			</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const data = {
						firstName: (formData.get('firstName') as string) || undefined,
						lastName: (formData.get('lastName') as string) || undefined,
						email: (formData.get('email') as string) || undefined,
						phone: (formData.get('phone') as string) || undefined,
						company: (formData.get('company') as string) || undefined,
						jobTitle: (formData.get('jobTitle') as string) || undefined,
					};
					contactsStore.createContact(data);
					contactModalStore.close();
				}}
				class="space-y-3"
			>
				<div class="grid grid-cols-2 gap-3">
					<input
						name="firstName"
						type="text"
						placeholder="Vorname"
						value={contactModalStore.prefillData?.firstName ?? ''}
						class="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
					<input
						name="lastName"
						type="text"
						placeholder="Nachname"
						value={contactModalStore.prefillData?.lastName ?? ''}
						class="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
				<input
					name="email"
					type="email"
					placeholder="E-Mail"
					value={contactModalStore.prefillData?.email ?? ''}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
				<input
					name="phone"
					type="tel"
					placeholder="Telefon"
					value={contactModalStore.prefillData?.phone ?? ''}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
				<input
					name="company"
					type="text"
					placeholder="Unternehmen"
					value={contactModalStore.prefillData?.company ?? ''}
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
				<input
					name="jobTitle"
					type="text"
					placeholder="Position"
					class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>

				<div class="flex justify-end gap-2 pt-2">
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
