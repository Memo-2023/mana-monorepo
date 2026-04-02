<!--
  Contacts — Workbench AppView
  Contact list with search + quick create.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalContact } from './types';
	import { contactsStore } from './stores/contacts.svelte';
	import { Plus, Star } from '@manacore/shared-icons';

	let contacts = $state<LocalContact[]>([]);
	let search = $state('');

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalContact>('contacts')
				.toArray()
				.then((all) => all.filter((c) => !c.deletedAt && !c.isArchived));
		}).subscribe((val) => {
			contacts = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const filtered = $derived(() => {
		if (!search.trim()) return contacts;
		const q = search.toLowerCase();
		return contacts.filter(
			(c) =>
				c.firstName?.toLowerCase().includes(q) ||
				c.lastName?.toLowerCase().includes(q) ||
				c.email?.toLowerCase().includes(q) ||
				c.company?.toLowerCase().includes(q)
		);
	});

	function displayName(c: LocalContact): string {
		const parts = [c.firstName, c.lastName].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : (c.email ?? 'Unbenannt');
	}

	function initials(c: LocalContact): string {
		const f = c.firstName?.[0] ?? '';
		const l = c.lastName?.[0] ?? '';
		return (f + l).toUpperCase() || '?';
	}

	// Quick create
	let showCreate = $state(false);
	let newFirstName = $state('');
	let newLastName = $state('');
	let newEmail = $state('');

	async function createContact() {
		const firstName = newFirstName.trim();
		const lastName = newLastName.trim();
		if (!firstName && !lastName) return;
		await contactsStore.createContact({
			firstName: firstName || undefined,
			lastName: lastName || undefined,
			email: newEmail.trim() || undefined,
		});
		newFirstName = '';
		newLastName = '';
		newEmail = '';
		showCreate = false;
	}
</script>

<div class="app-view">
	<div class="search-row">
		<input bind:value={search} placeholder="Kontakt suchen..." class="search-input" />
		<button class="add-btn" onclick={() => (showCreate = !showCreate)} title="Neuer Kontakt">
			<Plus size={14} />
		</button>
	</div>

	{#if showCreate}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				createContact();
			}}
			class="create-form"
		>
			<div class="form-row">
				<input bind:value={newFirstName} placeholder="Vorname" class="form-input" autofocus />
				<input bind:value={newLastName} placeholder="Nachname" class="form-input" />
			</div>
			<div class="form-row">
				<input
					bind:value={newEmail}
					placeholder="E-Mail (optional)"
					class="form-input full"
					type="email"
				/>
				<button type="submit" class="form-submit">Anlegen</button>
			</div>
		</form>
	{/if}

	<p class="count">{filtered().length} Kontakte</p>

	<div class="contact-list">
		{#each filtered() as contact (contact.id)}
			<div class="contact-item">
				<div class="avatar">{initials(contact)}</div>
				<div class="contact-info">
					<p class="contact-name">{displayName(contact)}</p>
					{#if contact.company}
						<p class="contact-company">{contact.company}</p>
					{/if}
				</div>
				{#if contact.isFavorite}
					<span class="fav"><Star size={12} weight="fill" /></span>
				{/if}
			</div>
		{/each}

		{#if filtered().length === 0}
			<p class="empty">Keine Kontakte gefunden</p>
		{/if}
	</div>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		height: 100%;
	}
	.search-row {
		display: flex;
		gap: 0.375rem;
	}
	.search-input {
		flex: 1;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.8125rem;
		color: #374151;
		outline: none;
	}
	.search-input::placeholder {
		color: #c0bfba;
	}
	.search-input:focus {
		border-color: rgba(0, 0, 0, 0.15);
	}
	:global(.dark) .search-input {
		border-color: rgba(255, 255, 255, 0.08);
		color: #f3f4f6;
	}
	:global(.dark) .search-input::placeholder {
		color: #4b5563;
	}
	:global(.dark) .search-input:focus {
		border-color: rgba(255, 255, 255, 0.15);
	}
	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 0.375rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #22c55e;
	}
	:global(.dark) .add-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #4ade80;
	}
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		animation: slideDown 0.15s ease-out;
	}
	:global(.dark) .create-form {
		border-color: rgba(255, 255, 255, 0.08);
	}
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.form-row {
		display: flex;
		gap: 0.375rem;
	}
	.form-input {
		flex: 1;
		padding: 0.3125rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid rgba(0, 0, 0, 0.06);
		background: transparent;
		font-size: 0.75rem;
		color: #374151;
		outline: none;
		min-width: 0;
	}
	.form-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .form-input {
		border-color: rgba(255, 255, 255, 0.06);
		color: #f3f4f6;
	}
	:global(.dark) .form-input::placeholder {
		color: #4b5563;
	}
	.form-input.full {
		flex: 2;
	}
	.form-submit {
		padding: 0.3125rem 0.625rem;
		border: none;
		border-radius: 0.25rem;
		background: #22c55e;
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}
	.count {
		font-size: 0.6875rem;
		color: #9ca3af;
	}
	.contact-list {
		flex: 1;
		overflow-y: auto;
	}
	.contact-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.375rem 0.25rem;
		border-radius: 0.25rem;
		transition: background 0.15s;
	}
	.contact-item:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	:global(.dark) .contact-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 9999px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.06);
		font-size: 0.6875rem;
		font-weight: 600;
		color: #6b7280;
	}
	:global(.dark) .avatar {
		background: rgba(255, 255, 255, 0.08);
		color: #9ca3af;
	}
	.contact-info {
		min-width: 0;
		flex: 1;
	}
	.contact-name {
		font-size: 0.8125rem;
		color: #374151;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dark) .contact-name {
		color: #e5e7eb;
	}
	.contact-company {
		font-size: 0.6875rem;
		color: #9ca3af;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.fav {
		color: #f59e0b;
		display: flex;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
