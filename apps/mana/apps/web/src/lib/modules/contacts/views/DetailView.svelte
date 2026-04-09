<!--
  Contacts — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { useDetailEntity } from '$lib/data/detail-entity.svelte';
	import DetailViewShell from '$lib/components/DetailViewShell.svelte';
	import { contactsStore } from '../stores/contacts.svelte';
	import { Star, EnvelopeSimple, Phone, MapPin, Briefcase, Globe, X } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalContact } from '../types';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import LinkedItems from '$lib/components/links/LinkedItems.svelte';
	import { removeTagIdWithUndo } from '$lib/data/tag-mutations';

	let { navigate, params, goBack }: ViewProps = $props();
	let contactId = $derived(params.contactId as string);

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

	const detail = useDetailEntity<LocalContact>({
		id: () => contactId,
		table: 'contacts',
		onLoad: (c) => {
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
		},
	});

	let contactTags = $derived(getTagsByIds(allTags, detail.entity?.tagIds ?? []));

	async function removeTag(tagId: string) {
		await removeTagIdWithUndo(detail.entity?.tagIds ?? [], tagId, (next) =>
			contactsStore.updateTagIds(contactId, next)
		);
	}

	function initials(c: LocalContact): string {
		const f = c.firstName?.[0] ?? '';
		const l = c.lastName?.[0] ?? '';
		return (f + l).toUpperCase() || '?';
	}

	async function saveField() {
		detail.blur();
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
</script>

<DetailViewShell
	entity={detail.entity}
	loading={detail.loading}
	notFoundLabel="Kontakt nicht gefunden"
	confirmDelete={detail.confirmDelete}
	onAskDelete={detail.askDelete}
	onCancelDelete={detail.cancelDelete}
	confirmDeleteLabel="Kontakt wirklich löschen?"
	onConfirmDelete={() =>
		detail.deleteWithUndo({
			label: 'Kontakt gelöscht',
			delete: () => contactsStore.deleteContact(contactId),
			goBack,
		})}
>
	{#snippet body(contact)}
		<div class="profile-header">
			<div class="avatar-large">{initials(contact)}</div>
			<div class="name-fields">
				<input
					class="name-input"
					bind:value={editFirstName}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="Vorname"
				/>
				<input
					class="name-input"
					bind:value={editLastName}
					onfocus={detail.focus}
					onblur={saveField}
					placeholder="Nachname"
				/>
			</div>
			<button class="fav-btn" class:active={contact.isFavorite} onclick={toggleFavorite}>
				<Star size={18} weight={contact.isFavorite ? 'fill' : 'regular'} />
			</button>
		</div>

		<div class="fields">
			<div class="field-row">
				<span class="field-icon"><EnvelopeSimple size={14} /></span>
				<input
					class="field-input"
					bind:value={editEmail}
					onfocus={detail.focus}
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
					onfocus={detail.focus}
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
					onfocus={detail.focus}
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
						onfocus={detail.focus}
						onblur={saveField}
						placeholder="Firma"
					/>
					<input
						class="field-input"
						bind:value={editJobTitle}
						onfocus={detail.focus}
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
						onfocus={detail.focus}
						onblur={saveField}
						placeholder="Straße"
					/>
					<div class="field-row-inline">
						<input
							class="field-input small"
							bind:value={editPostalCode}
							onfocus={detail.focus}
							onblur={saveField}
							placeholder="PLZ"
						/>
						<input
							class="field-input"
							bind:value={editCity}
							onfocus={detail.focus}
							onblur={saveField}
							placeholder="Stadt"
						/>
					</div>
					<input
						class="field-input"
						bind:value={editCountry}
						onfocus={detail.focus}
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
					onfocus={detail.focus}
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
					onfocus={detail.focus}
					onblur={saveField}
					type="date"
				/>
			</div>
		</div>

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

		<LinkedItems
			recordRef={{ app: 'contacts', collection: 'contacts', id: contactId }}
			{navigate}
		/>

		<div class="section">
			<span class="section-label">Notizen</span>
			<textarea
				class="description-input"
				bind:value={editNotes}
				onfocus={detail.focus}
				onblur={saveField}
				placeholder="Notizen hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<div class="meta">
			{#if contact.createdAt}
				<span>Erstellt: {new Date(contact.createdAt).toLocaleDateString('de')}</span>
			{/if}
			{#if contact.updatedAt}
				<span>Bearbeitet: {new Date(contact.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>
	{/snippet}
</DetailViewShell>

<style>
	.profile-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.avatar-large {
		width: 56px;
		height: 56px;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		font-weight: 600;
		flex-shrink: 0;
	}
	.name-fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}
	.name-input {
		font-size: 0.9375rem;
		font-weight: 500;
		border: 1px solid transparent;
		background: transparent;
		outline: none;
		color: hsl(var(--color-foreground));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		transition: border-color 0.15s;
	}
	.name-input:hover,
	.name-input:focus {
		border-color: hsl(var(--color-border));
	}
	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.field-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.field-icon {
		flex-shrink: 0;
		color: hsl(var(--color-muted-foreground));
		display: flex;
		align-items: center;
		padding-top: 0.375rem;
		width: 1rem;
	}
	.field-input {
		flex: 1;
		min-width: 0;
		font-size: 0.8125rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: hsl(var(--color-foreground));
		outline: none;
		transition: border-color 0.15s;
	}
	.field-input:hover,
	.field-input:focus {
		border-color: hsl(var(--color-border));
	}
	.field-input.small {
		max-width: 5rem;
	}
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}
	.field-row-inline {
		display: flex;
		gap: 0.25rem;
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
		background: color-mix(in srgb, var(--tag-color) 12%, transparent);
		border: none;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
	}
	.tag-pill:hover {
		opacity: 0.8;
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
	}
</style>
