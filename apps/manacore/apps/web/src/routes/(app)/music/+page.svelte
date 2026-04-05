<script lang="ts">
	import { getContext } from 'svelte';
	import { computeStats } from '$lib/modules/music/queries';
	import type { Song, Playlist, Project } from '$lib/modules/music/types';
	import { MusicNote, Plus, Playlist as PlaylistIcon, Note } from '@manacore/shared-icons';

	const songsCtx: { readonly value: Song[] } = getContext('songs');
	const playlistsCtx: { readonly value: Playlist[] } = getContext('playlists');
	const projectsCtx: { readonly value: Project[] } = getContext('projects');

	let stats = $derived(computeStats(songsCtx.value));

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Music - ManaCore</title>
</svelte:head>

<div class="space-y-8">
	<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Music</h1>

	<!-- Quick Stats -->
	<section>
		<h2
			class="mb-4 text-sm font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
		>
			Bibliothek
		</h2>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
				<p class="text-sm text-[hsl(var(--muted-foreground))]">Songs</p>
				<p class="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.totalSongs}</p>
			</div>
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
				<p class="text-sm text-[hsl(var(--muted-foreground))]">Alben</p>
				<p class="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.totalAlbums}</p>
			</div>
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
				<p class="text-sm text-[hsl(var(--muted-foreground))]">Kunstler</p>
				<p class="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.totalArtists}</p>
			</div>
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
				<p class="text-sm text-[hsl(var(--muted-foreground))]">Genres</p>
				<p class="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.totalGenres}</p>
			</div>
		</div>
	</section>

	<!-- Quick Actions -->
	<section>
		<h2
			class="mb-4 text-sm font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
		>
			Schnellzugriff
		</h2>
		<div class="flex flex-wrap gap-3">
			<a
				href="/music/library"
				class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
			>
				<MusicNote size={20} />
				Bibliothek
			</a>
			<a
				href="/music/playlists"
				class="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
			>
				<PlaylistIcon size={20} />
				Playlists
			</a>
			<a
				href="/music/projects"
				class="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
			>
				<Plus size={20} />
				Projekte
			</a>
		</div>
	</section>

	<!-- Recent Projects -->
	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
				Letzte Projekte
			</h2>
			<a href="/music/projects" class="text-sm text-[hsl(var(--primary))] hover:underline">
				Alle anzeigen
			</a>
		</div>
		{#if projectsCtx.value.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-12"
			>
				<Note size={40} class="mb-3 text-[hsl(var(--muted-foreground))]" />
				<p class="text-sm text-[hsl(var(--muted-foreground))]">Noch keine Projekte</p>
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each projectsCtx.value.slice(0, 6) as project (project.id)}
					<div
						class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:border-[hsl(var(--primary)/0.3)]"
					>
						<h3 class="font-medium text-[hsl(var(--foreground))]">{project.title}</h3>
						{#if project.description}
							<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
								{project.description}
							</p>
						{/if}
						<p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
							Aktualisiert {formatDate(project.updatedAt)}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
