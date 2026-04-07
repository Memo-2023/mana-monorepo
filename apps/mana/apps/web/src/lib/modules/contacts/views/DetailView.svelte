<!--
  Contacts — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { contactsStore } from '../stores/contacts.svelte';
	import {
		Trash,
		Star,
		EnvelopeSimple,
		Phone,
		MapPin,
		Briefcase,
		Globe,
		X,
	} from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalContact } from '../types';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import LinkedItems from '$lib/components/links/LinkedItems.svelte';
	import { toastStore } from '@mana/shared-ui/toast';

	let { navigate, goBack, params }: ViewProps = $props();
	let contactId = $derived(params.contactId as string);

	let contact = $state<LocalContact | null>(null);
	let confirmDelete = $state(false);
	let focused = $state(false);

	let editFirstName = $state('');
	let editLastName = $state('');
	let editEmail = $state('');
	let editPhone = $state('');
	let editMobile = $state('');
	let editCompany = $state('');
	let editJobTitle = $state('');
	let editStreet = $state('');
	let editCity = $state('');
	let editPostalCode = $state('');
	let editCountry = $state('');
	let editBirthday = $state('');
	let editWebsite = $state('');
	let editNotes = $state('');

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);
	let contactTags = $derived(getTagsByIds(allTags, contact?.tagIds ?? []));

	async function removeTag(tagId: string) {
		const current = contact?.tagIds ?? [];
		const removed = current.filter((id) => id !== tagId);
		await contactsStore.updateTagIds(contactId, removed);
		toastStore.undo('Tag entfernt', () => {
			contactsStore.updateTagIds(contactId, current);
		});
	}

	$effect(() => {
		contactId; // track
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalContact>('contacts').get(contactId)).subscribe(
			(val) => {
				contact = val ?? null;
				if (val && !focused) syncFields(val);
			}
		);
		return () => sub.unsubscribe();
	});

	function syncFields(c: LocalContact) {
		editFirstName = c.firstName ?? '';
		editLastName = c.lastName ?? '';
		editEmail = c.email ?? '';
		editPhone = c.phone ?? '';
		editMobile = c.mobile ?? '';
		editCompany = c.company ?? '';
		editJobTitle = c.jobTitle ?? '';
		editStreet = c.street ?? '';
		editCity = c.city ?? '';
		editPostalCode = c.postalCode ?? '';
		editCountry = c.country ?? '';
		editBirthday = c.birthday ?? '';
		editWebsite = c.website ?? '';
		editNotes = c.notes ?? '';
	}

	function initials(c: LocalContact): string {
		const f = c.firstName?.[0] ?? '';
		const l = c.lastName?.[0] ?? '';
		return (f + l).toUpperCase() || '?';
	}

	async function saveField() {
		focused = false;
		await contactsStore.updateContact(contactId, {
			firstName: editFirstName.trim() || null,
			lastName: editLastName.trim() || null,
			email: editEmail.trim() || null,
			phone: editPhone.trim() || null,
			mobile: editMobile.trim() || null,
			company: editCompany.trim() || null,
			jobTitle: editJobTitle.trim() || null,
			street: editStreet.trim() || null,
			city: editCity.trim() || null,
			postalCode: editPostalCode.trim() || null,
			country: editCountry.trim() || null,
			birthday: editBirthday || null,
			website: editWebsite.trim() || null,
			notes: editNotes.trim() || null,
		} as Record<string, unknown>);
	}

	async function toggleFavorite() {
		await contactsStore.toggleFavorite(contactId);
	}

	async function deleteContact() {
		const id = contactId;
		await contactsStore.deleteContact(id);
		goBack();
		toastStore.undo('Kontakt gelöscht', () => {
			db.table('contacts').update(id, {
				deletedAt: undefined,
				updatedAt: new Date().toISOString(),
			});
		});
	}
</script>

<div class="detail-view">
	{#if !contact}
		<p class="empty">Kontakt nicht gefunden</p>
	{:else}
		<!-- Profile header -->
		<div class="profile-header">
			<div class="avatar-large">{initials(contact)}</div>
			<div class="name-fields">
				<input
					class="name-input"
					bind:value={editFirstName}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Vorname"
				/>
				<input
					class="name-input"
					bind:value={editLastName}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Nachname"
				/>
			</div>
			<button class="fav-btn" class:active={contact.isFavorite} onclick={toggleFavorite}>
				<Star size={18} weight={contact.isFavorite ? 'fill' : 'regular'} />
			</button>
		</div>

		<!-- Contact fields -->
		<div class="fields">
			<div class="field-row">
				<span class="field-icon"><EnvelopeSimple size={14} /></span>
				<input
					class="field-input"
					bind:value={editEmail}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="E-Mail"
					type="email"
				/>
			</div>

			<div class="field-row">
				<span class="field-icon"><Phone size={14} /></span>
				<input
					class="field-input"
					bind:value={editPhone}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Telefon"
					type="tel"
				/>
			</div>

			<div class="field-row">
				<span class="field-icon"><Phone size={14} /></span>
				<input
					class="field-input"
					bind:value={editMobile}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Mobil"
					type="tel"
				/>
			</div>

			<div class="field-row">
				<span class="field-icon"><Briefcase size={14} /></span>
				<div class="field-group">
					<input
						class="field-input"
						bind:value={editCompany}
						onfocus={() => (focused = true)}
						onblur={saveField}
						placeholder="Firma"
					/>
					<input
						class="field-input"
						bind:value={editJobTitle}
						onfocus={() => (focused = true)}
						onblur={saveField}
						placeholder="Position"
					/>
				</div>
			</div>

			<div class="field-row">
				<span class="field-icon"><MapPin size={14} /></span>
				<div class="field-group">
					<input
						class="field-input"
						bind:value={editStreet}
						onfocus={() => (focused = true)}
						onblur={saveField}
						placeholder="Straße"
					/>
					<div class="field-row-inline">
						<input
							class="field-input small"
							bind:value={editPostalCode}
							onfocus={() => (focused = true)}
							onblur={saveField}
							placeholder="PLZ"
						/>
						<input
							class="field-input"
							bind:value={editCity}
							onfocus={() => (focused = true)}
							onblur={saveField}
							placeholder="Stadt"
						/>
					</div>
					<input
						class="field-input"
						bind:value={editCountry}
						onfocus={() => (focused = true)}
						onblur={saveField}
						placeholder="Land"
					/>
				</div>
			</div>

			<div class="field-row">
				<span class="field-icon"><Globe size={14} /></span>
				<input
					class="field-input"
					bind:value={editWebsite}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="Website"
					type="url"
				/>
			</div>

			<div class="field-row">
				<span class="field-icon">🎂</span>
				<input
					class="field-input"
					bind:value={editBirthday}
					onfocus={() => (focused = true)}
					onblur={saveField}
					type="date"
				/>
			</div>
		</div>

		<!-- Tags -->
		{#if contactTags.length > 0}
			<div class="section">
				<span class="section-label">Tags</span>
				<div class="tags-list">
					{#each contactTags as tag (tag.id)}
						<button
							class="tag-pill"
							style="--tag-color: {tag.color}"
							onclick={() => removeTag(tag.id)}
						>
							<span class="tag-dot" style="background: {tag.color}"></span>
							{tag.name}
							<X size={10} />
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Links -->
		<LinkedItems
			recordRef={{ app: 'contacts', collection: 'contacts', id: contactId }}
			{navigate}
		/>

		<!-- Notes -->
		<div class="section">
			<span class="section-label">Notizen</span>
			<textarea
				class="notes-input"
				bind:value={editNotes}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Notizen hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<!-- Metadata -->
		<div class="meta">
			{#if contact.createdAt}
				<span>Erstellt: {new Date(contact.createdAt).toLocaleDateString('de')}</span>
			{/if}
			{#if contact.updatedAt}
				<span>Bearbeitet: {new Date(contact.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Kontakt wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteContact}>Löschen</button>
					<button class="action-btn" onclick={() => (confirmDelete = false)}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={() => (confirmDelete = true)}>
					<Trash size={14} /> Löschen
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	/* Profile header */
	.profile-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.avatar-large {
		width: 48px;
		height: 48px;
		border-radius: 9999px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.06);
		font-size: 1rem;
		font-weight: 600;
		color: #6b7280;
	}
	:global(.dark) .avatar-large {
		background: rgba(255, 255, 255, 0.08);
		color: #9ca3af;
	}
	.name-fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}
	.name-input {
		font-size: 0.9375rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0.125rem 0;
	}
	.name-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	.name-input::placeholder {
		color: #c0bfba;
		font-weight: 400;
	}
	:global(.dark) .name-input {
		color: #f3f4f6;
	}
	:global(.dark) .name-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .name-input::placeholder {
		color: #4b5563;
	}
	.fav-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		color: #d1d5db;
		padding: 0.25rem;
		transition: color 0.15s;
		flex-shrink: 0;
	}
	.fav-btn.active {
		color: #f59e0b;
	}
	.fav-btn:hover {
		color: #f59e0b;
	}

	/* Fields */
	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.field-row {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.field-icon {
		color: #9ca3af;
		display: flex;
		margin-top: 0.3rem;
		flex-shrink: 0;
	}
	.field-input {
		font-size: 0.8125rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		flex: 1;
		transition: border-color 0.15s;
	}
	.field-input:hover,
	.field-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.field-input::placeholder {
		color: #c0bfba;
	}
	.field-input.small {
		max-width: 5rem;
	}
	:global(.dark) .field-input {
		color: #e5e7eb;
	}
	:global(.dark) .field-input:hover,
	:global(.dark) .field-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .field-input::placeholder {
		color: #4b5563;
	}
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}
	.field-row-inline {
		display: flex;
		gap: 0.375rem;
	}

	/* Notes */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: none;
		background: color-mix(in srgb, var(--tag-color) 12%, transparent);
		font-size: 0.6875rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.tag-pill:hover {
		background: color-mix(in srgb, var(--tag-color) 20%, transparent);
		color: #ef4444;
	}
	:global(.dark) .tag-pill {
		background: color-mix(in srgb, var(--tag-color) 18%, transparent);
		color: #9ca3af;
	}
	:global(.dark) .tag-pill:hover {
		background: color-mix(in srgb, var(--tag-color) 28%, transparent);
		color: #ef4444;
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.notes-input {
		font-size: 0.8125rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: transparent;
		color: #374151;
		padding: 0.5rem;
		outline: none;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	.notes-input:hover,
	.notes-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.notes-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .notes-input {
		color: #f3f4f6;
	}
	:global(.dark) .notes-input:hover,
	:global(.dark) .notes-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .notes-input::placeholder {
		color: #4b5563;
	}

	/* Meta & actions */
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .meta {
		border-color: rgba(255, 255, 255, 0.06);
	}
	.danger-zone {
		padding-top: 0.5rem;
	}
	.confirm-text {
		font-size: 0.8125rem;
		color: #ef4444;
		margin: 0 0 0.5rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	.action-btn.danger {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}
	.action-btn.danger-subtle {
		color: #ef4444;
		border-color: transparent;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}

	@media (max-width: 640px) {
		.detail-view {
			padding: 0.75rem;
		}
		.fav-btn,
		.action-btn,
		.tag-pill {
			min-height: 44px;
		}
		.field-input,
		.name-input {
			min-height: 44px;
		}
	}
</style>
