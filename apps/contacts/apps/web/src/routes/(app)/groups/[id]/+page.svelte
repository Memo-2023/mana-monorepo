<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { groupsApi, contactsApi } from '$lib/api/contacts';
	import type { ContactGroup, Contact } from '$lib/api/contacts';
	import '$lib/i18n';

	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let isEditing = $state(false);
	let showAddContacts = $state(false);

	let group = $state<(ContactGroup & { contactIds?: string[] }) | null>(null);
	let contacts = $state<Contact[]>([]);
	let allContacts = $state<Contact[]>([]);
	let searchQuery = $state('');

	// Editable fields
	let name = $state('');
	let description = $state('');
	let color = $state('#6366f1');

	const presetColors = [
		'#ef4444',
		'#f97316',
		'#f59e0b',
		'#84cc16',
		'#22c55e',
		'#14b8a6',
		'#06b6d4',
		'#3b82f6',
		'#6366f1',
		'#8b5cf6',
		'#a855f7',
		'#ec4899',
	];

	const groupContacts = $derived(() => {
		if (!group?.contactIds) return [];
		return contacts.filter((c) => group.contactIds?.includes(c.id));
	});

	const availableContacts = $derived(() => {
		if (!group?.contactIds) return allContacts;
		const query = searchQuery.toLowerCase();
		return allContacts
			.filter((c) => !group.contactIds?.includes(c.id))
			.filter((c) => {
				if (!query) return true;
				const name = getDisplayName(c).toLowerCase();
				return name.includes(query) || c.email?.toLowerCase().includes(query);
			});
	});

	async function loadGroup() {
		loading = true;
		error = null;
		try {
			const id = $page.params.id;
			group = await groupsApi.get(id);
			name = group.name;
			description = group.description || '';
			color = group.color || '#6366f1';

			// Load all contacts
			const allContactsData = await contactsApi.list({ limit: 1000 });
			allContacts = allContactsData.contacts || allContactsData;

			// Filter to get group's contacts
			if (group.contactIds && group.contactIds.length > 0) {
				contacts = allContacts.filter((c: Contact) => group!.contactIds?.includes(c.id));
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Gruppe';
		} finally {
			loading = false;
		}
	}

	function getDisplayName(contact: Contact) {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		return contact.email || 'Unbekannt';
	}

	function getInitials(contact: Contact) {
		const first = contact.firstName?.[0] || '';
		const last = contact.lastName?.[0] || '';
		return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || '?';
	}

	async function handleSave() {
		if (!name.trim()) {
			error = 'Bitte einen Namen eingeben';
			return;
		}

		saving = true;
		error = null;

		try {
			await groupsApi.update($page.params.id, {
				name: name.trim(),
				description: description.trim() || undefined,
				color,
			});
			group = { ...group!, name, description, color };
			isEditing = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Speichern';
		} finally {
			saving = false;
		}
	}

	async function handleAddContact(contactId: string) {
		try {
			await groupsApi.addContacts($page.params.id, [contactId]);
			const contact = allContacts.find((c) => c.id === contactId);
			if (contact) {
				contacts = [...contacts, contact];
				group = { ...group!, contactIds: [...(group?.contactIds || []), contactId] };
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Hinzufügen';
		}
	}

	async function handleRemoveContact(contactId: string) {
		try {
			await groupsApi.removeContact($page.params.id, contactId);
			contacts = contacts.filter((c) => c.id !== contactId);
			group = { ...group!, contactIds: group?.contactIds?.filter((id) => id !== contactId) };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Entfernen';
		}
	}

	async function handleDelete() {
		if (!confirm('Gruppe wirklich löschen? Die Kontakte bleiben erhalten.')) return;

		try {
			await groupsApi.delete($page.params.id);
			goto('/groups');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Löschen';
		}
	}

	function cancelEdit() {
		name = group?.name || '';
		description = group?.description || '';
		color = group?.color || '#6366f1';
		isEditing = false;
	}

	onMount(loadGroup);
</script>

<svelte:head>
	<title>{group?.name || 'Gruppe'} - Contacts</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/groups" class="back-button" aria-label="Zurück">
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="title">{isEditing ? 'Gruppe bearbeiten' : group?.name || 'Gruppe'}</h1>
		{#if !loading && group && !isEditing}
			<button onclick={() => (isEditing = true)} class="edit-button" aria-label="Bearbeiten">
				<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
			</button>
		{:else}
			<div class="header-spacer"></div>
		{/if}
	</header>

	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
		</div>
	{:else if error && !group}
		<div class="error-state">
			<div class="error-icon">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>
			<h2 class="error-title">Fehler</h2>
			<p class="error-description">{error}</p>
			<a href="/groups" class="btn btn-primary">Zurück zu Gruppen</a>
		</div>
	{:else if group}
		{#if error}
			<div class="error-banner" role="alert">
				<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<span>{error}</span>
				<button onclick={() => (error = null)} class="dismiss-btn">&times;</button>
			</div>
		{/if}

		{#if isEditing}
			<!-- Edit Mode -->
			<div class="preview-section">
				<div class="preview-color" style="background-color: {color}">
					<svg class="preview-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
				</div>
				<p class="preview-name">{name || 'Gruppenname'}</p>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				class="form"
			>
				<section class="form-section">
					<div class="section-header">
						<div class="section-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</div>
						<h2 class="section-title">Details</h2>
					</div>
					<div class="form-field">
						<label for="name" class="label">Name</label>
						<input id="name" type="text" bind:value={name} class="input" required />
					</div>
					<div class="form-field">
						<label for="description" class="label">Beschreibung</label>
						<textarea id="description" bind:value={description} rows="3" class="input textarea"
						></textarea>
					</div>
				</section>

				<section class="form-section">
					<div class="section-header">
						<div class="section-icon" style="background-color: {color}20; color: {color}">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
								/>
							</svg>
						</div>
						<h2 class="section-title">Farbe</h2>
					</div>
					<div class="color-picker">
						{#each presetColors as presetColor}
							<button
								type="button"
								class="color-option"
								class:selected={color === presetColor}
								style="background-color: {presetColor}"
								onclick={() => (color = presetColor)}
							>
								{#if color === presetColor}
									<svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								{/if}
							</button>
						{/each}
					</div>
				</section>

				<div class="actions">
					<button type="button" onclick={cancelEdit} class="btn btn-secondary">Abbrechen</button>
					<button type="submit" disabled={saving} class="btn btn-primary">
						{#if saving}
							<svg class="spinner-sm" viewBox="0 0 24 24">
								<circle
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="3"
									stroke-opacity="0.25"
									fill="none"
								/>
								<path
									d="M12 2a10 10 0 0 1 10 10"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									fill="none"
								/>
							</svg>
							Speichern...
						{:else}
							Speichern
						{/if}
					</button>
				</div>
			</form>

			<!-- Delete Button -->
			<button onclick={handleDelete} class="delete-group-btn">
				<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
				Gruppe löschen
			</button>
		{:else}
			<!-- View Mode -->
			<div class="preview-section">
				<div class="preview-color" style="background-color: {group.color || '#6366f1'}">
					<svg class="preview-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
				</div>
				<p class="preview-name">{group.name}</p>
				{#if group.description}
					<p class="preview-description">{group.description}</p>
				{/if}
			</div>

			<!-- Contacts in Group -->
			<section class="form-section">
				<div class="section-header">
					<div class="section-icon">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					</div>
					<h2 class="section-title">Kontakte ({groupContacts().length})</h2>
					<button onclick={() => (showAddContacts = true)} class="add-contact-btn">
						<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Hinzufügen
					</button>
				</div>

				{#if groupContacts().length === 0}
					<p class="no-contacts">Keine Kontakte in dieser Gruppe</p>
				{:else}
					<div class="contacts-list">
						{#each groupContacts() as contact (contact.id)}
							<div class="contact-item">
								<div class="contact-avatar">
									{#if contact.photoUrl}
										<img src={contact.photoUrl} alt={getDisplayName(contact)} />
									{:else}
										{getInitials(contact)}
									{/if}
								</div>
								<div class="contact-info">
									<span class="contact-name">{getDisplayName(contact)}</span>
									{#if contact.email}
										<span class="contact-email">{contact.email}</span>
									{/if}
								</div>
								<button
									onclick={() => handleRemoveContact(contact.id)}
									class="remove-btn"
									aria-label="Entfernen"
								>
									<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</div>

<!-- Add Contacts Modal -->
{#if showAddContacts}
	<div class="modal-backdrop" onclick={() => (showAddContacts = false)} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog">
			<div class="modal-header">
				<h2 class="modal-title">Kontakte hinzufügen</h2>
				<button onclick={() => (showAddContacts = false)} class="modal-close">&times;</button>
			</div>
			<div class="modal-search">
				<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					type="text"
					placeholder="Kontakte suchen..."
					bind:value={searchQuery}
					class="modal-search-input"
				/>
			</div>
			<div class="modal-content">
				{#if availableContacts().length === 0}
					<p class="no-results">
						{searchQuery
							? 'Keine Kontakte gefunden'
							: 'Alle Kontakte sind bereits in dieser Gruppe'}
					</p>
				{:else}
					{#each availableContacts() as contact (contact.id)}
						<button class="add-contact-item" onclick={() => handleAddContact(contact.id)}>
							<div class="contact-avatar">
								{#if contact.photoUrl}
									<img src={contact.photoUrl} alt={getDisplayName(contact)} />
								{:else}
									{getInitials(contact)}
								{/if}
							</div>
							<div class="contact-info">
								<span class="contact-name">{getDisplayName(contact)}</span>
								{#if contact.email}
									<span class="contact-email">{contact.email}</span>
								{/if}
							</div>
							<svg class="add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	/* Header */
	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		position: sticky;
		top: 0;
		background: hsl(var(--color-background));
		z-index: 10;
		margin-bottom: 0.5rem;
	}

	.back-button,
	.edit-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--color-surface-hover));
		transform: translateX(-2px);
	}

	.edit-button:hover {
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	.title {
		flex: 1;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.header-spacer {
		width: 2.5rem;
	}

	/* Loading & Error */
	.loading-container {
		display: flex;
		justify-content: center;
		padding: 4rem 0;
	}

	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid hsl(var(--color-muted));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.spinner-sm {
		width: 1.25rem;
		height: 1.25rem;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.error-icon {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.error-icon svg {
		width: 2rem;
		height: 2rem;
	}

	.error-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.5rem;
	}

	.error-description {
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 1.5rem;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--color-error) / 0.1);
		border: 1px solid hsl(var(--color-error) / 0.3);
		border-radius: 0.75rem;
		color: hsl(var(--color-error));
		margin-bottom: 1.5rem;
	}

	.dismiss-btn {
		margin-left: auto;
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: inherit;
		opacity: 0.7;
	}

	.dismiss-btn:hover {
		opacity: 1;
	}

	/* Preview Section */
	.preview-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 0 2rem;
	}

	.preview-color {
		width: 80px;
		height: 80px;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
		box-shadow: 0 8px 24px currentColor;
	}

	.preview-icon {
		width: 2.5rem;
		height: 2.5rem;
		color: white;
	}

	.preview-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.preview-description {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
		text-align: center;
	}

	/* Form */
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.25rem;
	}

	.section-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.section-icon svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.section-title {
		flex: 1;
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.add-contact-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border: none;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-contact-btn:hover {
		opacity: 0.9;
	}

	/* Form Fields */
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.textarea {
		resize: none;
		min-height: 80px;
	}

	/* Color Picker */
	.color-picker {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.75rem;
	}

	.color-option {
		aspect-ratio: 1;
		border-radius: 0.625rem;
		border: 3px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.color-option:hover {
		transform: scale(1.1);
	}

	.color-option.selected {
		border-color: hsl(var(--color-foreground));
		box-shadow: 0 0 0 2px hsl(var(--color-background));
	}

	.check-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: white;
	}

	/* Contacts List */
	.contacts-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.contact-item,
	.add-contact-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: 0.625rem;
		transition: all 0.2s ease;
	}

	.contact-item:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.add-contact-item {
		width: 100%;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.add-contact-item:hover {
		background: hsl(var(--color-primary) / 0.1);
	}

	.contact-avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			hsl(var(--color-primary)) 0%,
			hsl(var(--color-primary) / 0.7) 100%
		);
		color: hsl(var(--color-primary-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 600;
		flex-shrink: 0;
		overflow: hidden;
	}

	.contact-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.contact-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.contact-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.contact-email {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.remove-btn:hover {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	.add-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-primary));
	}

	.no-contacts,
	.no-results {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		padding: 1rem;
	}

	/* Actions */
	.actions {
		display: flex;
		gap: 1rem;
		padding-top: 0.5rem;
	}

	.btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: 0.75rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		text-decoration: none;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.3);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px hsl(var(--color-primary) / 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.btn-secondary:hover {
		background: hsl(var(--color-surface-hover));
	}

	.delete-group-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem;
		margin-top: 1.5rem;
		background: transparent;
		color: hsl(var(--color-error));
		border: 1px solid hsl(var(--color-error) / 0.3);
		border-radius: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.delete-group-btn:hover {
		background: hsl(var(--color-error) / 0.1);
		border-color: hsl(var(--color-error));
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: hsl(var(--color-foreground) / 0.5);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal {
		width: 100%;
		max-width: 480px;
		max-height: 70vh;
		background: hsl(var(--color-background));
		border-radius: 1rem 1rem 0 0;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.2s ease;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.modal-close:hover {
		color: hsl(var(--color-foreground));
	}

	.modal-search {
		position: relative;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.search-icon {
		position: absolute;
		left: 2rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1.125rem;
		height: 1.125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.modal-search-input {
		width: 100%;
		padding: 0.625rem 0.875rem 0.625rem 2.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
	}

	.modal-search-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
	}

	/* Icons */
	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.icon-sm {
		width: 1rem;
		height: 1rem;
	}

	@media (min-width: 640px) {
		.modal-backdrop {
			align-items: center;
		}

		.modal {
			border-radius: 1rem;
			max-height: 80vh;
		}
	}

	@media (max-width: 480px) {
		.color-picker {
			grid-template-columns: repeat(4, 1fr);
		}

		.actions {
			flex-direction: column-reverse;
		}
	}
</style>
