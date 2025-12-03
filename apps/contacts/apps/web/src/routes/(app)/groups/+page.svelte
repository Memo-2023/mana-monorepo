<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { groupsApi, type ContactGroup } from '$lib/api/contacts';
	import '$lib/i18n';

	let loading = $state(true);
	let groups = $state<ContactGroup[]>([]);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	const filteredGroups = $derived(() => {
		if (!searchQuery.trim()) return groups;
		const query = searchQuery.toLowerCase();
		return groups.filter(
			(g) => g.name.toLowerCase().includes(query) || g.description?.toLowerCase().includes(query)
		);
	});

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

	async function handleDeleteGroup(e: MouseEvent, id: string) {
		e.stopPropagation();
		if (!confirm('Gruppe wirklich löschen?')) return;

		try {
			await groupsApi.delete(id);
			groups = groups.filter((g) => g.id !== id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Löschen';
		}
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
		<div class="groups-list">
			{#each filteredGroups() as group (group.id)}
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
							onclick={(e) => handleDeleteGroup(e, group.id)}
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

	.group-color {
		width: 3rem;
		height: 3rem;
		border-radius: 0.75rem;
		flex-shrink: 0;
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
