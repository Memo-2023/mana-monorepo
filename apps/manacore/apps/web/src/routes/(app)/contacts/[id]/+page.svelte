<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import type { Observable } from 'dexie';
	import { type Contact, contactsStore, getDisplayName, getInitials } from '$lib/modules/contacts';
	import {
		CaretLeft,
		Star,
		Archive,
		Trash,
		PencilSimple,
		Envelope,
		Phone,
		Buildings,
		MapPin,
		Cake,
		Note,
	} from '@manacore/shared-icons';

	const allContacts$: Observable<Contact[]> = getContext('contacts');

	let allContacts = $state<Contact[]>([]);
	$effect(() => {
		const sub = allContacts$.subscribe((c) => {
			allContacts = c;
		});
		return () => sub.unsubscribe();
	});

	let contactId = $derived($page.params.id);
	let contact = $derived(allContacts.find((c) => c.id === contactId));

	// Editing state
	let isEditing = $state(false);
	let editData = $state<Partial<Contact>>({});

	function startEdit() {
		if (!contact) return;
		editData = {
			firstName: contact.firstName,
			lastName: contact.lastName,
			email: contact.email,
			phone: contact.phone,
			company: contact.company,
			jobTitle: contact.jobTitle,
			notes: contact.notes,
			birthday: contact.birthday,
		};
		isEditing = true;
	}

	async function saveEdit() {
		if (!contact) return;
		await contactsStore.updateContact(contact.id, editData);
		isEditing = false;
	}

	function cancelEdit() {
		isEditing = false;
		editData = {};
	}

	async function handleToggleFavorite() {
		if (!contact) return;
		await contactsStore.toggleFavorite(contact.id);
	}

	async function handleArchive() {
		if (!contact) return;
		await contactsStore.toggleArchive(contact.id);
		goto('/contacts');
	}

	async function handleDelete() {
		if (!contact) return;
		if (!confirm(`"${getDisplayName(contact)}" endgueltig loeschen?`)) return;
		await contactsStore.deleteContact(contact.id);
		goto('/contacts');
	}
</script>

<svelte:head>
	<title>{contact ? getDisplayName(contact) : 'Kontakt'} - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<!-- Back Link -->
	<a
		href="/contacts"
		class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
	>
		<CaretLeft size={16} />
		Kontakte
	</a>

	{#if !contact}
		<div class="flex flex-col items-center py-16 text-center">
			<h2 class="text-lg font-semibold text-foreground">Kontakt nicht gefunden</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Dieser Kontakt existiert nicht oder wurde geloescht.
			</p>
			<a
				href="/contacts"
				class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
			>
				Zurueck zu Kontakten
			</a>
		</div>
	{:else}
		<!-- Profile Header -->
		<div class="mb-6 rounded-xl border border-border bg-card p-6">
			<div class="flex items-start gap-4">
				<!-- Avatar -->
				<div
					class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary"
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

				<!-- Name & Title -->
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<h1 class="text-xl font-bold text-foreground">{getDisplayName(contact)}</h1>
						{#if contact.isFavorite}
							<Star weight="fill" size={18} class="text-amber-500" />
						{/if}
					</div>
					{#if contact.company || contact.jobTitle}
						<p class="mt-0.5 text-sm text-muted-foreground">
							{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
						</p>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex gap-1">
					<button
						onclick={() => startEdit()}
						class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						title="Bearbeiten"
					>
						<PencilSimple size={18} />
					</button>
					<button
						onclick={handleToggleFavorite}
						class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-amber-500"
						title={contact.isFavorite ? 'Favorit entfernen' : 'Zu Favoriten'}
					>
						{#if contact.isFavorite}
							<Star weight="fill" size={18} class="text-amber-500" />
						{:else}
							<Star size={18} />
						{/if}
					</button>
					<button
						onclick={handleArchive}
						class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
						title="Archivieren"
					>
						<Archive size={18} />
					</button>
					<button
						onclick={handleDelete}
						class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
						title="Loeschen"
					>
						<Trash size={18} />
					</button>
				</div>
			</div>
		</div>

		<!-- Contact Details -->
		{#if isEditing}
			<!-- Edit Form -->
			<div class="rounded-xl border border-border bg-card p-6">
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					Bearbeiten
				</h2>
				<div class="space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<input
							type="text"
							placeholder="Vorname"
							value={editData.firstName ?? ''}
							oninput={(e) => (editData.firstName = e.currentTarget.value || null)}
							class="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						/>
						<input
							type="text"
							placeholder="Nachname"
							value={editData.lastName ?? ''}
							oninput={(e) => (editData.lastName = e.currentTarget.value || null)}
							class="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						/>
					</div>
					<input
						type="email"
						placeholder="E-Mail"
						value={editData.email ?? ''}
						oninput={(e) => (editData.email = e.currentTarget.value || null)}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
					<input
						type="tel"
						placeholder="Telefon"
						value={editData.phone ?? ''}
						oninput={(e) => (editData.phone = e.currentTarget.value || null)}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
					<input
						type="text"
						placeholder="Unternehmen"
						value={editData.company ?? ''}
						oninput={(e) => (editData.company = e.currentTarget.value || null)}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
					<input
						type="text"
						placeholder="Position"
						value={editData.jobTitle ?? ''}
						oninput={(e) => (editData.jobTitle = e.currentTarget.value || null)}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
					<input
						type="date"
						placeholder="Geburtstag"
						value={editData.birthday ?? ''}
						oninput={(e) => (editData.birthday = e.currentTarget.value || null)}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
					<textarea
						placeholder="Notizen"
						value={editData.notes ?? ''}
						oninput={(e) => (editData.notes = e.currentTarget.value || null)}
						rows="3"
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					></textarea>

					<div class="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onclick={cancelEdit}
							class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
						>
							Abbrechen
						</button>
						<button
							type="button"
							onclick={saveEdit}
							class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
						>
							Speichern
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Detail Cards -->
			<div class="space-y-4">
				<!-- Contact Info -->
				<div class="rounded-xl border border-border bg-card p-5">
					<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						Kontaktdaten
					</h2>
					<div class="space-y-3">
						{#if contact.email}
							<div class="flex items-center gap-3">
								<Envelope size={16} class="flex-shrink-0 text-muted-foreground" />
								<a href="mailto:{contact.email}" class="text-sm text-primary hover:underline">
									{contact.email}
								</a>
							</div>
						{/if}
						{#if contact.phone}
							<div class="flex items-center gap-3">
								<Phone size={16} class="flex-shrink-0 text-muted-foreground" />
								<a href="tel:{contact.phone}" class="text-sm text-primary hover:underline">
									{contact.phone}
								</a>
							</div>
						{/if}
						{#if contact.company}
							<div class="flex items-center gap-3">
								<Buildings size={16} class="flex-shrink-0 text-muted-foreground" />
								<span class="text-sm text-foreground">{contact.company}</span>
							</div>
						{/if}
						{#if contact.birthday}
							<div class="flex items-center gap-3">
								<Cake size={16} class="flex-shrink-0 text-muted-foreground" />
								<span class="text-sm text-foreground">
									{new Date(contact.birthday).toLocaleDateString('de-DE', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
									})}
								</span>
							</div>
						{/if}
					</div>

					{#if !contact.email && !contact.phone && !contact.company && !contact.birthday}
						<p class="text-sm text-muted-foreground">Keine Kontaktdaten hinterlegt.</p>
					{/if}
				</div>

				<!-- Notes -->
				{#if contact.notes}
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Notizen
						</h2>
						<p class="whitespace-pre-wrap text-sm text-foreground">{contact.notes}</p>
					</div>
				{/if}

				<!-- Tags -->
				{#if contact.tags.length > 0}
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Tags
						</h2>
						<div class="flex flex-wrap gap-2">
							{#each contact.tags as tag (tag.id)}
								<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
									{tag.name}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Metadata -->
				<div class="rounded-xl border border-border bg-card p-5">
					<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						Details
					</h2>
					<div class="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
						<span>Erstellt</span>
						<span>
							{new Date(contact.createdAt).toLocaleDateString('de-DE', {
								day: 'numeric',
								month: 'short',
								year: 'numeric',
							})}
						</span>
						<span>Aktualisiert</span>
						<span>
							{new Date(contact.updatedAt).toLocaleDateString('de-DE', {
								day: 'numeric',
								month: 'short',
								year: 'numeric',
							})}
						</span>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
