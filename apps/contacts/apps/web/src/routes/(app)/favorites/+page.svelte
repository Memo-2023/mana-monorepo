<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { contactsApi } from '$lib/api/contacts';
	import type { Contact } from '$lib/api/contacts';
	import FavoriteCardView from '$lib/components/favorites/FavoriteCardView.svelte';
	import FavoriteListView from '$lib/components/favorites/FavoriteListView.svelte';
	import FavoriteAlphabetView from '$lib/components/favorites/FavoriteAlphabetView.svelte';
	import '$lib/i18n';

	type ViewMode = 'cards' | 'list' | 'alphabet';

	let loading = $state(true);
	let contacts = $state<Contact[]>([]);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let viewMode = $state<ViewMode>('cards');

	const filteredContacts = $derived.by(() => {
		if (!searchQuery.trim()) return contacts;
		const query = searchQuery.toLowerCase();
		return contacts.filter((c) => {
			const name = getDisplayName(c).toLowerCase();
			return (
				name.includes(query) ||
				c.email?.toLowerCase().includes(query) ||
				c.company?.toLowerCase().includes(query) ||
				c.phone?.includes(query) ||
				c.mobile?.includes(query)
			);
		});
	});

	async function loadFavorites() {
		loading = true;
		error = null;
		try {
			const result = await contactsApi.list({ isFavorite: true });
			contacts = result.contacts || result;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Favoriten';
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

	function handleContactClick(id: string) {
		goto(`/contacts/${id}`);
	}

	async function handleToggleFavorite(e: MouseEvent, id: string) {
		e.stopPropagation();
		try {
			await contactsApi.toggleFavorite(id);
			// Remove from list since it's no longer a favorite
			contacts = contacts.filter((c) => c.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Entfernen';
		}
	}

	// Save view mode to localStorage
	function setViewMode(mode: ViewMode) {
		viewMode = mode;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('favorites-view-mode', mode);
		}
	}

	onMount(() => {
		loadFavorites();
		// Load saved view mode
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('favorites-view-mode') as ViewMode | null;
			if (saved && ['cards', 'list', 'alphabet'].includes(saved)) {
				viewMode = saved;
			}
		}
	});
</script>

<svelte:head>
	<title>Favoriten - Contacts</title>
</svelte:head>

<div class="favorites-page">
	<!-- Hero Header -->
	<div class="hero-header">
		<div class="hero-content">
			<div class="hero-icon">
				<svg fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
					/>
				</svg>
			</div>
			<div class="hero-text">
				<h1 class="hero-title">Favoriten</h1>
				<p class="hero-subtitle">
					{#if contacts.length === 0}
						Markiere Kontakte als Favoriten für schnellen Zugriff
					{:else}
						{contacts.length} Favorit{contacts.length !== 1 ? 'en' : ''} für schnellen Zugriff
					{/if}
				</p>
			</div>
		</div>

		<!-- Stats Cards -->
		{#if contacts.length > 0}
			<div class="stats-row">
				<div class="stat-card">
					<div class="stat-icon stat-icon-contacts">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<div class="stat-content">
						<span class="stat-value">{contacts.length}</span>
						<span class="stat-label">Favoriten</span>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon stat-icon-email">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div class="stat-content">
						<span class="stat-value">{contacts.filter((c) => c.email).length}</span>
						<span class="stat-label">Mit E-Mail</span>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon stat-icon-phone">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
							/>
						</svg>
					</div>
					<div class="stat-content">
						<span class="stat-value">{contacts.filter((c) => c.phone || c.mobile).length}</span>
						<span class="stat-label">Mit Telefon</span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Controls Bar -->
	<div class="controls-bar">
		<!-- Search -->
		<div class="search-wrapper">
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
				placeholder="Favoriten durchsuchen..."
				bind:value={searchQuery}
				class="search-input"
			/>
			{#if searchQuery}
				<button class="search-clear" onclick={() => (searchQuery = '')}>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>

		<!-- View Mode Toggle -->
		<div class="view-toggle">
			<button
				type="button"
				class="view-btn"
				class:active={viewMode === 'cards'}
				onclick={() => setViewMode('cards')}
				title="Kachelansicht"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
					/>
				</svg>
			</button>
			<button
				type="button"
				class="view-btn"
				class:active={viewMode === 'list'}
				onclick={() => setViewMode('list')}
				title="Listenansicht"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 10h16M4 14h16M4 18h16"
					/>
				</svg>
			</button>
			<button
				type="button"
				class="view-btn"
				class:active={viewMode === 'alphabet'}
				onclick={() => setViewMode('alphabet')}
				title="Alphabetisch"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
					/>
				</svg>
			</button>
		</div>
	</div>

	{#if error}
		<div class="error-banner" role="alert">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
			<p class="loading-text">Favoriten werden geladen...</p>
		</div>
	{:else if contacts.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
					/>
				</svg>
			</div>
			<h2 class="empty-title">Keine Favoriten</h2>
			<p class="empty-description">
				Markiere Kontakte als Favoriten, um sie hier schnell wiederzufinden. Klicke einfach auf das
				Herz-Symbol bei einem Kontakt.
			</p>
			<a href="/" class="btn-primary">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
				Zu allen Kontakten
			</a>
		</div>
	{:else if filteredContacts.length === 0}
		<div class="empty-state">
			<div class="empty-icon empty-icon-search">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
			<h2 class="empty-title">Keine Ergebnisse</h2>
			<p class="empty-description">Keine Favoriten gefunden für "{searchQuery}"</p>
			<button class="btn-secondary" onclick={() => (searchQuery = '')}>Suche zurücksetzen</button>
		</div>
	{:else}
		<!-- View Content -->
		<div class="view-content">
			{#if viewMode === 'cards'}
				<FavoriteCardView
					contacts={filteredContacts}
					onContactClick={handleContactClick}
					onToggleFavorite={handleToggleFavorite}
				/>
			{:else if viewMode === 'list'}
				<FavoriteListView
					contacts={filteredContacts}
					onContactClick={handleContactClick}
					onToggleFavorite={handleToggleFavorite}
				/>
			{:else}
				<FavoriteAlphabetView
					contacts={filteredContacts}
					onContactClick={handleContactClick}
					onToggleFavorite={handleToggleFavorite}
				/>
			{/if}
		</div>

		<!-- Footer count -->
		<p class="footer-count">
			{filteredContacts.length} von {contacts.length} Favorit{contacts.length !== 1 ? 'en' : ''}
		</p>
	{/if}
</div>

<style>
	.favorites-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Hero Header */
	.hero-header {
		margin-bottom: 2rem;
		padding: 2rem;
		background: linear-gradient(135deg, hsl(0 84% 60% / 0.08), hsl(340 82% 52% / 0.05));
		border: 1px solid hsl(0 84% 60% / 0.15);
		border-radius: 1.5rem;
	}

	.hero-content {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.hero-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4.5rem;
		height: 4.5rem;
		background: linear-gradient(135deg, #ef4444, #ec4899);
		border-radius: 1rem;
		color: white;
		box-shadow: 0 8px 24px -4px hsl(0 84% 60% / 0.4);
	}

	.hero-icon svg {
		width: 2.5rem;
		height: 2.5rem;
	}

	.hero-text {
		flex: 1;
	}

	.hero-title {
		font-size: 2rem;
		font-weight: 800;
		color: hsl(var(--foreground));
		margin-bottom: 0.375rem;
	}

	.hero-subtitle {
		font-size: 1.0625rem;
		color: hsl(var(--muted-foreground));
	}

	/* Stats */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 1rem 1.25rem;
		background: hsl(var(--background) / 0.8);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 0.875rem;
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.625rem;
	}

	.stat-icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.stat-icon-contacts {
		background: hsl(0 84% 60% / 0.15);
		color: #ef4444;
	}

	.stat-icon-email {
		background: hsl(var(--primary) / 0.15);
		color: hsl(var(--primary));
	}

	.stat-icon-phone {
		background: hsl(142 76% 36% / 0.15);
		color: hsl(142 76% 36%);
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.375rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		line-height: 1.2;
	}

	.stat-label {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	/* Controls Bar */
	.controls-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.search-wrapper {
		position: relative;
		flex: 1;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--muted-foreground));
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.875rem 2.5rem 0.875rem 3rem;
		border: 1.5px solid hsl(var(--border));
		border-radius: 0.875rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #ef4444;
		box-shadow: 0 0 0 3px hsl(0 84% 60% / 0.1);
	}

	.search-input::placeholder {
		color: hsl(var(--muted-foreground) / 0.6);
	}

	.search-clear {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: hsl(var(--muted));
		border: none;
		border-radius: 9999px;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.search-clear:hover {
		background: hsl(var(--muted-foreground) / 0.2);
		color: hsl(var(--foreground));
	}

	/* View Toggle */
	.view-toggle {
		display: flex;
		background: hsl(var(--muted) / 0.5);
		border-radius: 0.75rem;
		padding: 0.25rem;
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.view-btn:hover {
		color: hsl(var(--foreground));
	}

	.view-btn.active {
		background: hsl(var(--background));
		color: #ef4444;
		box-shadow: 0 2px 8px hsl(var(--foreground) / 0.08);
	}

	/* Error */
	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: hsl(var(--destructive) / 0.1);
		border: 1px solid hsl(var(--destructive) / 0.3);
		border-radius: 0.875rem;
		color: hsl(var(--destructive));
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

	/* Loading */
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4rem 0;
		gap: 1rem;
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid hsl(var(--muted));
		border-top-color: #ef4444;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-text {
		color: hsl(var(--muted-foreground));
		font-size: 0.9375rem;
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
		padding: 4rem 1rem;
		text-align: center;
	}

	.empty-icon {
		width: 6rem;
		height: 6rem;
		border-radius: 50%;
		background: linear-gradient(135deg, hsl(0 84% 60% / 0.15), hsl(340 82% 52% / 0.1));
		color: #ef4444;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.empty-icon svg {
		width: 3rem;
		height: 3rem;
	}

	.empty-icon-search {
		background: linear-gradient(135deg, hsl(var(--muted)), hsl(var(--muted) / 0.5));
		color: hsl(var(--muted-foreground));
	}

	.empty-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: hsl(var(--muted-foreground));
		margin-bottom: 1.75rem;
		max-width: 320px;
		line-height: 1.6;
	}

	/* Buttons */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.75rem;
		background: linear-gradient(135deg, #ef4444, #ec4899);
		color: white;
		border-radius: 0.875rem;
		font-weight: 600;
		font-size: 0.9375rem;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px hsl(0 84% 60% / 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px hsl(0 84% 60% / 0.4);
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
		border: none;
		border-radius: 0.75rem;
		font-weight: 500;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		background: hsl(var(--muted-foreground) / 0.15);
	}

	/* View Content */
	.view-content {
		margin-bottom: 2rem;
	}

	/* Footer */
	.footer-count {
		text-align: center;
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
		padding: 1rem 0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-header {
			padding: 1.5rem;
		}

		.hero-content {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.hero-title {
			font-size: 1.5rem;
		}

		.stats-row {
			grid-template-columns: 1fr;
		}

		.controls-bar {
			flex-direction: column;
			gap: 0.75rem;
		}

		.search-wrapper {
			width: 100%;
		}

		.view-toggle {
			width: 100%;
			justify-content: center;
		}
	}
</style>
