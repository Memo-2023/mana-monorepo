<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { groupsApi } from '$lib/api/contacts';
	import type { ContactGroup } from '$lib/api/contacts';
	import '$lib/i18n';

	let loading = $state(true);
	let groups = $state<ContactGroup[]>([]);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	// Sort groups: preset groups first, then user groups
	const sortedGroups = $derived(() => {
		return [...groups].sort((a, b) => {
			// Preset groups first
			if (a.isPreset && !b.isPreset) return -1;
			if (!a.isPreset && b.isPreset) return 1;
			// Then alphabetically
			return a.name.localeCompare(b.name, 'de');
		});
	});

	const filteredGroups = $derived(() => {
		const sorted = sortedGroups();
		if (!searchQuery.trim()) return sorted;
		const query = searchQuery.toLowerCase();
		return sorted.filter(
			(g) => g.name.toLowerCase().includes(query) || g.description?.toLowerCase().includes(query)
		);
	});

	// Icon mapping for preset groups
	const iconMap: Record<string, string> = {
		home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
		briefcase: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
		building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
		handshake: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
		star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
		'map-pin': 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
		flag: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
	};

	async function loadGroups() {
		loading = true;
		error = null;
		try {
			groups = await groupsApi.list();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Gruppen';
		} finally {
			loading = false;
		}
	}

	function handleGroupClick(id: string) {
		goto(`/groups/${id}`);
	}

	async function handleDeleteGroup(e: MouseEvent, group: ContactGroup) {
		e.stopPropagation();
		if (group.isPreset) {
			error = 'Voreingestellte Gruppen können nicht gelöscht werden';
			return;
		}
		if (!confirm('Gruppe wirklich löschen?')) return;

		try {
			await groupsApi.delete(group.id);
			groups = groups.filter((g) => g.id !== group.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Löschen';
		}
	}

	function getIconPath(icon: string | null | undefined): string | null {
		if (!icon) return null;
		return iconMap[icon] || null;
	}

	function getGroupColor(color: string | null | undefined): string {
		return color || '#6366f1';
	}

	onMount(loadGroups);
</script>

<svelte:head>
	<title>Gruppen - Contacts</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/" class="back-button" aria-label="Zurück">
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="title">Gruppen</h1>
		<a href="/groups/new" class="add-button" aria-label="Neue Gruppe">
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</a>
	</header>

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
			placeholder="Gruppen durchsuchen..."
			bind:value={searchQuery}
			class="search-input"
		/>
	</div>

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
		</div>
	{/if}

	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
		</div>
	{:else if groups.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			</div>
			<h2 class="empty-title">Keine Gruppen</h2>
			<p class="empty-description">Erstelle deine erste Gruppe um Kontakte zu organisieren.</p>
			<a href="/groups/new" class="btn btn-primary">
				<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Neue Gruppe
			</a>
		</div>
	{:else if filteredGroups().length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
			<h2 class="empty-title">Keine Ergebnisse</h2>
			<p class="empty-description">Keine Gruppen gefunden für "{searchQuery}"</p>
		</div>
	{:else}
		<!-- Preset Groups Section -->
		{@const presetGroups = filteredGroups().filter((g) => g.isPreset)}
		{@const userGroups = filteredGroups().filter((g) => !g.isPreset)}

		{#if presetGroups.length > 0}
			<div class="section-header">
				<span class="section-title">Voreingestellte Gruppen</span>
			</div>
			<div class="groups-list">
				{#each presetGroups as group (group.id)}
					<div
						role="button"
						tabindex="0"
						onclick={() => handleGroupClick(group.id)}
						onkeydown={(e) => e.key === 'Enter' && handleGroupClick(group.id)}
						class="group-card"
					>
						<div class="group-color" style="background-color: {getGroupColor(group.color)}">
							{#if getIconPath(group.icon)}
								<svg class="group-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={getIconPath(group.icon)}
									/>
								</svg>
							{/if}
						</div>
						<div class="group-info">
							<h3 class="group-name">{group.name}</h3>
							{#if group.description}
								<p class="group-description">{group.description}</p>
							{/if}
						</div>
						<div class="group-actions">
							<svg class="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- User Groups Section -->
		{#if userGroups.length > 0}
			<div class="section-header" class:has-margin={presetGroups.length > 0}>
				<span class="section-title">Meine Gruppen</span>
			</div>
			<div class="groups-list">
				{#each userGroups as group (group.id)}
					<div
						role="button"
						tabindex="0"
						onclick={() => handleGroupClick(group.id)}
						onkeydown={(e) => e.key === 'Enter' && handleGroupClick(group.id)}
						class="group-card"
					>
						<div class="group-color" style="background-color: {getGroupColor(group.color)}"></div>
						<div class="group-info">
							<h3 class="group-name">{group.name}</h3>
							{#if group.description}
								<p class="group-description">{group.description}</p>
							{/if}
						</div>
						<div class="group-actions">
							<button
								onclick={(e) => handleDeleteGroup(e, group)}
								class="delete-button"
								aria-label="Gruppe löschen"
							>
								<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
							<svg class="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<p class="groups-count">{groups.length} Gruppe{groups.length !== 1 ? 'n' : ''}</p>
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

	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		transition: all 0.2s ease;
	}

	.add-button:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.3);
	}

	/* Search */
	.search-wrapper {
		position: relative;
		margin-bottom: 1.5rem;
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

	/* Error */
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
		max-width: 280px;
	}

	/* Groups List */
	.groups-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.group-card {
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

	.group-card:hover {
		border-color: hsl(var(--color-primary) / 0.3);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(var(--color-foreground) / 0.05);
	}

	/* Section Headers */
	.section-header {
		margin-bottom: 0.75rem;
	}

	.section-header.has-margin {
		margin-top: 1.5rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.group-color {
		width: 3rem;
		height: 3rem;
		border-radius: 0.75rem;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.group-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: white;
	}

	.group-info {
		flex: 1;
		min-width: 0;
	}

	.group-name {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.25rem;
	}

	.group-description {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.group-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.delete-button {
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

	.delete-button:hover {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	.chevron {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Count */
	.groups-count {
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
