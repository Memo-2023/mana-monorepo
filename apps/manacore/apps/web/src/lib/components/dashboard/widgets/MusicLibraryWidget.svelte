<script lang="ts">
	/**
	 * MukkeLibraryWidget - Music library stats (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useMukkeStats } from '$lib/data/cross-app-queries';
	const stats = useMukkeStats();

	function formatDuration(seconds?: number): string {
		if (!seconds) return '';
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>🎵</span>
			{$_('dashboard.widgets.mukke.title')}
		</h3>
	</div>

	{#if stats.loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else}
		<div class="mb-3 flex gap-4 text-sm">
			<div>
				<span class="font-semibold">{stats.value.totalSongs}</span>
				<span class="text-muted-foreground"> Songs</span>
			</div>
			<div>
				<span class="font-semibold">{stats.value.totalPlaylists}</span>
				<span class="text-muted-foreground"> Playlists</span>
			</div>
			<div>
				<span class="font-semibold">{stats.value.favoriteCount}</span>
				<span class="text-muted-foreground"> ⭐</span>
			</div>
		</div>

		{#if stats.value.recentSongs.length > 0}
			<div class="space-y-1">
				{#each stats.value.recentSongs as song (song.id)}
					<div class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover">
						<span class="text-sm">🎵</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{song.title}</p>
							{#if song.artist}
								<p class="truncate text-xs text-muted-foreground">{song.artist}</p>
							{/if}
						</div>
						{#if song.duration}
							<span class="flex-shrink-0 text-xs text-muted-foreground">
								{formatDuration(song.duration)}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<p class="mt-2 text-center text-xs text-muted-foreground">Mukke</p>
	{/if}
</div>
