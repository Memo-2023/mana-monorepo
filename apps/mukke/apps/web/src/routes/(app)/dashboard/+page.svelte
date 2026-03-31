<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { libraryStore } from '$lib/stores/library.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { DownloadSimple, Note, Plus } from '@manacore/shared-icons';

	let statsLoading = $state(true);
	let projectsLoading = $state(true);

	onMount(async () => {
		await Promise.all([
			libraryStore.loadStats().then(() => {
				statsLoading = false;
			}),
			projectStore.loadProjects().then(() => {
				projectsLoading = false;
			}),
		]);
	});

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Dashboard - Mukke</title>
</svelte:head>

<div class="p-6 max-w-6xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">Welcome to Mukke</h1>

	<!-- Quick Stats -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold mb-4 text-foreground-secondary">Library Stats</h2>
		{#if statsLoading}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each Array(4) as _}
					<div class="bg-surface rounded-lg p-4 animate-pulse">
						<div class="h-4 bg-background rounded w-16 mb-2"></div>
						<div class="h-8 bg-background rounded w-12"></div>
					</div>
				{/each}
			</div>
		{:else if libraryStore.stats}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="bg-surface rounded-lg p-4">
					<p class="text-sm text-foreground-secondary">Songs</p>
					<p class="text-2xl font-bold">{libraryStore.stats.totalSongs}</p>
				</div>
				<div class="bg-surface rounded-lg p-4">
					<p class="text-sm text-foreground-secondary">Albums</p>
					<p class="text-2xl font-bold">{libraryStore.stats.totalAlbums}</p>
				</div>
				<div class="bg-surface rounded-lg p-4">
					<p class="text-sm text-foreground-secondary">Artists</p>
					<p class="text-2xl font-bold">{libraryStore.stats.totalArtists}</p>
				</div>
				<div class="bg-surface rounded-lg p-4">
					<p class="text-sm text-foreground-secondary">Genres</p>
					<p class="text-2xl font-bold">{libraryStore.stats.totalGenres}</p>
				</div>
			</div>
		{:else}
			<p class="text-foreground-secondary">
				No library data yet. Upload some songs to get started.
			</p>
		{/if}
	</section>

	<!-- Quick Actions -->
	<section class="mb-8">
		<h2 class="text-lg font-semibold mb-4 text-foreground-secondary">Quick Actions</h2>
		<div class="flex flex-wrap gap-3">
			<a
				href="/upload"
				class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
			>
				<DownloadSimple size={20} />
				Upload Songs
			</a>
			<a
				href="/projects"
				class="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-foreground rounded-lg hover:bg-background transition-colors font-medium"
			>
				<Plus size={20} />
				Create Project
			</a>
		</div>
	</section>

	<!-- Recent Projects -->
	<section>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-foreground-secondary">Recent Projects</h2>
			<a href="/projects" class="text-sm text-primary hover:underline">View all</a>
		</div>
		{#if projectsLoading}
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each Array(3) as _}
					<div class="bg-surface rounded-lg p-4 animate-pulse">
						<div class="h-5 bg-background rounded w-32 mb-2"></div>
						<div class="h-4 bg-background rounded w-48 mb-3"></div>
						<div class="h-3 bg-background rounded w-24"></div>
					</div>
				{/each}
			</div>
		{:else if projectStore.projects.length === 0}
			<div class="text-center py-12 bg-surface rounded-lg">
				<Note size={48} class="text-foreground-secondary mx-auto mb-3" />
				<p class="text-foreground-secondary mb-2">No projects yet</p>
				<a href="/projects" class="text-sm text-primary hover:underline"
					>Create your first project</a
				>
			</div>
		{:else}
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each projectStore.projects.slice(0, 6) as project}
					<a
						href="/editor/{project.id}"
						class="block p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors group"
					>
						<h3 class="font-medium group-hover:text-primary transition-colors">
							{project.title}
						</h3>
						{#if project.description}
							<p class="text-sm text-foreground-secondary mt-1 line-clamp-2">
								{project.description}
							</p>
						{/if}
						<p class="text-xs text-foreground-secondary mt-2">
							Updated {formatDate(project.updatedAt)}
						</p>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>
