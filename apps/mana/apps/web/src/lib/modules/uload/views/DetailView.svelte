<!--
  uLoad — DetailView (inline editable overlay)
  All fields are always editable. Changes auto-save on blur.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { toastStore } from '@mana/shared-ui/toast';
	import { Trash } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalLink } from '../types';

	let { navigate, goBack, params }: ViewProps = $props();
	let linkId = $derived(params.linkId as string);

	let link = $state<LocalLink | null>(null);
	let confirmDelete = $state(false);

	// Edit fields
	let editTitle = $state('');
	let editOriginalUrl = $state('');
	let editCustomCode = $state('');
	let editDescription = $state('');
	let editIsActive = $state(true);
	let editExpiresAt = $state('');

	let focused = $state(false);

	$effect(() => {
		linkId;
		confirmDelete = false;
		focused = false;
	});

	$effect(() => {
		const sub = liveQuery(() => db.table<LocalLink>('links').get(linkId)).subscribe((val) => {
			link = val ?? null;
			if (val && !focused) {
				editTitle = val.title ?? '';
				editOriginalUrl = val.originalUrl;
				editCustomCode = val.customCode ?? '';
				editDescription = val.description ?? '';
				editIsActive = val.isActive;
				editExpiresAt = val.expiresAt?.split('T')[0] ?? '';
			}
		});
		return () => sub.unsubscribe();
	});

	async function saveField() {
		focused = false;
		await db.table('links').update(linkId, {
			title: editTitle.trim() || undefined,
			originalUrl: editOriginalUrl.trim() || link?.originalUrl || '',
			customCode: editCustomCode.trim() || undefined,
			description: editDescription.trim() || undefined,
			isActive: editIsActive,
			expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
			updatedAt: new Date().toISOString(),
		});
	}

	async function handleActiveToggle() {
		await db.table('links').update(linkId, {
			isActive: editIsActive,
			updatedAt: new Date().toISOString(),
		});
	}

	async function deleteLink() {
		const id = linkId;
		await db.table('links').update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		goBack();
		toastStore.undo('Link gelöscht', () => {
			db.table('links').update(id, { deletedAt: undefined, updatedAt: new Date().toISOString() });
		});
	}
</script>

<div class="detail-view">
	{#if !link}
		<p class="empty">Link nicht gefunden</p>
	{:else}
		<!-- Title -->
		<input
			class="title-input"
			bind:value={editTitle}
			onfocus={() => (focused = true)}
			onblur={saveField}
			placeholder="Titel..."
		/>

		<!-- Properties -->
		<div class="properties">
			<div class="prop-row">
				<span class="prop-label">URL</span>
				<input
					class="prop-input url-input"
					bind:value={editOriginalUrl}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="https://..."
				/>
			</div>

			<div class="prop-row">
				<span class="prop-label">Kurzcode</span>
				<input
					class="prop-input"
					bind:value={editCustomCode}
					onfocus={() => (focused = true)}
					onblur={saveField}
					placeholder="custom-code"
				/>
			</div>

			{#if link.shortCode}
				<div class="prop-row">
					<span class="prop-label">Short Code</span>
					<span class="prop-value">{link.shortCode}</span>
				</div>
			{/if}

			<div class="prop-row">
				<span class="prop-label">Aktiv</span>
				<label class="toggle-label">
					<input
						type="checkbox"
						class="toggle-input"
						bind:checked={editIsActive}
						onchange={handleActiveToggle}
					/>
					<span class="toggle-text">{editIsActive ? 'Ja' : 'Nein'}</span>
				</label>
			</div>

			<div class="prop-row">
				<span class="prop-label">Klicks</span>
				<span class="prop-value">{link.clickCount}</span>
			</div>

			<div class="prop-row">
				<span class="prop-label">Ablaufdatum</span>
				<input
					type="date"
					class="prop-input"
					bind:value={editExpiresAt}
					onfocus={() => (focused = true)}
					onblur={saveField}
				/>
			</div>
		</div>

		<!-- Description -->
		<div class="section">
			<span class="section-label">Beschreibung</span>
			<textarea
				class="description-input"
				bind:value={editDescription}
				onfocus={() => (focused = true)}
				onblur={saveField}
				placeholder="Beschreibung hinzufügen..."
				rows={3}
			></textarea>
		</div>

		<!-- Metadata -->
		<div class="meta">
			<span>Erstellt: {new Date(link.createdAt ?? '').toLocaleDateString('de')}</span>
			{#if link.updatedAt}
				<span>Bearbeitet: {new Date(link.updatedAt).toLocaleDateString('de')}</span>
			{/if}
		</div>

		<!-- Delete -->
		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">Link wirklich löschen?</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={deleteLink}>Löschen</button>
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

	/* Title */
	.title-input {
		font-size: 1.125rem;
		font-weight: 600;
		border: none;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0;
	}
	.title-input:focus {
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}
	:global(.dark) .title-input {
		color: #f3f4f6;
	}
	:global(.dark) .title-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Properties */
	.properties {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.prop-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
	}
	.prop-label {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	.prop-value {
		font-size: 0.8125rem;
		color: #374151;
	}
	:global(.dark) .prop-value {
		color: #e5e7eb;
	}
	.prop-input {
		font-size: 0.8125rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
		background: transparent;
		color: #374151;
		outline: none;
		transition: border-color 0.15s;
	}
	.prop-input:hover,
	.prop-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.url-input {
		flex: 1;
		min-width: 0;
		margin-left: 0.5rem;
		text-align: right;
	}
	:global(.dark) .prop-input {
		color: #e5e7eb;
	}
	:global(.dark) .prop-input:hover,
	:global(.dark) .prop-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Toggle */
	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		cursor: pointer;
	}
	.toggle-input {
		accent-color: #22c55e;
	}
	.toggle-text {
		font-size: 0.8125rem;
		color: #374151;
	}
	:global(.dark) .toggle-text {
		color: #e5e7eb;
	}

	/* Sections */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	.description-input {
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
	.description-input:hover,
	.description-input:focus {
		border-color: rgba(0, 0, 0, 0.1);
	}
	.description-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .description-input {
		color: #f3f4f6;
	}
	:global(.dark) .description-input:hover,
	:global(.dark) .description-input:focus {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(.dark) .description-input::placeholder {
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
		.action-btn,
		.toggle-label {
			min-height: 44px;
		}
		.prop-input {
			min-height: 44px;
		}
	}
</style>
