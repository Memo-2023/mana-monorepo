<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { contactsApi } from '$lib/api/contacts';
	import type { Contact } from '$lib/api/contacts';
	import { getDisplayName, getInitials } from '$lib/utils/contact-display';
	import { ContactListSkeleton } from '$lib/components/skeletons';
	import '$lib/i18n';
	import {
		CaretLeft,
		Archive,
		MagnifyingGlass,
		Warning,
		Users,
		Info,
		ArrowCounterClockwise,
		Trash,
	} from '@manacore/shared-icons';

	let loading = $state(true);
	let contacts = $state<Contact[]>([]);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	const filteredContacts = $derived(() => {
		if (!searchQuery.trim()) return contacts;
		const query = searchQuery.toLowerCase();
		return contacts.filter((c) => {
			const name = getDisplayName(c).toLowerCase();
			return (
				name.includes(query) ||
				c.email?.toLowerCase().includes(query) ||
				c.company?.toLowerCase().includes(query)
			);
		});
	});

	async function loadArchived() {
		loading = true;
		error = null;
		try {
			const result = await contactsApi.list({ isArchived: true });
			contacts = result.contacts || result;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden des Archivs';
		} finally {
			loading = false;
		}
	}

	function handleContactClick(id: string) {
		goto(`/contacts/${id}`);
	}

	async function handleRestore(e: MouseEvent, contact: Contact) {
		e.stopPropagation();
		try {
			await contactsApi.toggleArchive(contact.id);
			contacts = contacts.filter((c) => c.id !== contact.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Wiederherstellen';
		}
	}

	async function handleDelete(e: MouseEvent, contact: Contact) {
		e.stopPropagation();
		if (!confirm(`"${getDisplayName(contact)}" endgültig löschen?`)) return;

		try {
			await contactsApi.delete(contact.id);
			contacts = contacts.filter((c) => c.id !== contact.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Löschen';
		}
	}

	onMount(loadArchived);
</script>

<svelte:head>
	<title>Archiv - Contacts</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/" class="back-button" aria-label="Zurück">
			<CaretLeft size={20} />
		</a>
		<h1 class="title">Archiv</h1>
		<div class="title-icon">
			<Archive size={20} />
		</div>
	</header>

	<!-- Search -->
	{#if contacts.length > 0}
		<div class="search-wrapper">
			<MagnifyingGlass class="search-icon" size={20} />
			<input
				type="text"
				placeholder="Archiv durchsuchen..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>
	{/if}

	{#if error}
		<div class="error-banner" role="alert">
			<Warning size={16} />
			<span>{error}</span>
			<button onclick={() => (error = null)} class="dismiss-btn">&times;</button>
		</div>
	{/if}

	{#if loading}
		<ContactListSkeleton count={6} />
	{:else if contacts.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Archive size={40} />
			</div>
			<h2 class="empty-title">Archiv ist leer</h2>
			<p class="empty-description">
				Archivierte Kontakte erscheinen hier. Du kannst sie später wiederherstellen oder endgültig
				löschen.
			</p>
			<a href="/" class="btn btn-primary">
				<Users size={16} />
				Zu Kontakten
			</a>
		</div>
	{:else if filteredContacts().length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<MagnifyingGlass size={40} />
			</div>
			<h2 class="empty-title">Keine Ergebnisse</h2>
			<p class="empty-description">Keine archivierten Kontakte gefunden für "{searchQuery}"</p>
		</div>
	{:else}
		<div class="info-banner">
			<Info size={16} />
			<span>Archivierte Kontakte können wiederhergestellt oder endgültig gelöscht werden.</span>
		</div>

		<div class="contacts-list">
			{#each filteredContacts() as contact (contact.id)}
				<div
					role="button"
					tabindex="0"
					onclick={() => handleContactClick(contact.id)}
					onkeydown={(e) => e.key === 'Enter' && handleContactClick(contact.id)}
					class="contact-card"
				>
					<!-- Avatar -->
					<div class="avatar archived">
						{#if contact.photoUrl}
							<img src={contact.photoUrl} alt={getDisplayName(contact)} />
						{:else}
							{getInitials(contact)}
						{/if}
					</div>

					<!-- Contact Info -->
					<div class="contact-info">
						<h3 class="contact-name">{getDisplayName(contact)}</h3>
						{#if contact.company || contact.jobTitle}
							<p class="contact-subtitle">
								{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
							</p>
						{/if}
						{#if contact.email}
							<p class="contact-email">{contact.email}</p>
						{/if}
					</div>

					<!-- Actions -->
					<div class="contact-actions">
						<button
							onclick={(e) => handleRestore(e, contact)}
							class="action-btn restore"
							aria-label="Wiederherstellen"
							title="Wiederherstellen"
						>
							<ArrowCounterClockwise size={16} />
						</button>
						<button
							onclick={(e) => handleDelete(e, contact)}
							class="action-btn delete"
							aria-label="Endgültig löschen"
							title="Endgültig löschen"
						>
							<Trash size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<p class="contacts-count">
			{contacts.length} archiviert{contacts.length !== 1 ? 'e Kontakte' : 'er Kontakt'}
		</p>
	{/if}
</div>

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

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--color-surface-hover));
		transform: translateX(-2px);
	}

	.title {
		flex: 1;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.title-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Search */
	.search-wrapper {
		position: relative;
		margin-bottom: 1rem;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 3rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.6);
	}

	/* Banners */
	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--color-error) / 0.1);
		border: 1px solid hsl(var(--color-error) / 0.3);
		border-radius: 0.75rem;
		color: hsl(var(--color-error));
		margin-bottom: 1rem;
	}

	.info-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		margin-bottom: 1rem;
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

	/* Loading */
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

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-icon {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.empty-icon svg {
		width: 2.5rem;
		height: 2.5rem;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 1.5rem;
		max-width: 300px;
	}

	/* Contacts List */
	.contacts-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.contact-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.contact-card:hover {
		border-color: hsl(var(--color-border));
		background: hsl(var(--color-surface-hover));
	}

	.avatar {
		width: 3rem;
		height: 3rem;
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
		font-size: 1rem;
		font-weight: 600;
		flex-shrink: 0;
		overflow: hidden;
	}

	.avatar.archived {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		filter: grayscale(0.5);
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar.archived img {
		filter: grayscale(0.5);
		opacity: 0.8;
	}

	.contact-info {
		flex: 1;
		min-width: 0;
	}

	.contact-name {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.125rem;
	}

	.contact-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contact-email {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground) / 0.8);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contact-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn.restore {
		color: hsl(var(--color-primary));
	}

	.action-btn.restore:hover {
		background: hsl(var(--color-primary) / 0.1);
	}

	.action-btn.delete {
		color: hsl(var(--color-muted-foreground));
	}

	.action-btn.delete:hover {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	/* Count */
	.contacts-count {
		text-align: center;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 1.5rem;
	}

	/* Button */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
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

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px hsl(var(--color-primary) / 0.4);
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
</style>
