<script lang="ts">
	/**
	 * MukkeLibraryWidget - Music library stats and recent songs
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { mukkeService, type MukkeStats, type Song } from '$lib/api/services';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const mukkeUrl = isDev ? 'http://localhost:5180' : 'https://mukke.mana.how';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let stats = $state<MukkeStats | null>(null);
	let recentSongs = $state<Song[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	async function load() {
		state = 'loading';
		retrying = true;

		const [statsResult, songsResult] = await Promise.all([
			mukkeService.getStats(),
			mukkeService.getRecentSongs(5),
		]);

		if (statsResult.data) {
			stats = statsResult.data;
			recentSongs = songsResult.data || [];
			state = 'success';
			retryCount = 0;
		} else {
			error = statsResult.error || songsResult.error;
			state = 'error';

			const isServiceUnavailable = error?.includes('nicht erreichbar');
			if (!isServiceUnavailable && retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>🎵</span>
			{$_('dashboard.widgets.mukke.title')}
		</h3>
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if !stats || stats.totalSongs === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">🎶</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.mukke.empty')}
			</p>
			<a
				href={mukkeUrl}
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Musik entdecken
			</a>
		</div>
	{:else}
		<!-- Stats row -->
		<div class="mb-4 grid grid-cols-3 gap-2 text-center">
			<div class="rounded-lg bg-surface-hover p-2">
				<div class="text-xl font-bold text-primary">{stats.totalSongs}</div>
				<div class="text-xs text-muted-foreground">Songs</div>
			</div>
			<div class="rounded-lg bg-surface-hover p-2">
				<div class="text-xl font-bold text-orange-500">{stats.totalPlaylists}</div>
				<div class="text-xs text-muted-foreground">Playlists</div>
			</div>
			<div class="rounded-lg bg-surface-hover p-2">
				<div class="text-xl font-bold text-green-500">{stats.favoriteCount}</div>
				<div class="text-xs text-muted-foreground">Favoriten</div>
			</div>
		</div>

		<!-- Recent songs -->
		{#if recentSongs.length > 0}
			<div class="space-y-1">
				{#each recentSongs as song}
					<div
						class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
					>
						<span class="text-base">{song.favorite ? '❤️' : '🎵'}</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{song.title}</p>
							{#if song.artist}
								<p class="truncate text-xs text-muted-foreground">{song.artist}</p>
							{/if}
						</div>
						{#if song.duration}
							<span class="flex-shrink-0 text-xs text-muted-foreground">
								{mukkeService.formatDuration(song.duration)}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-3 text-center">
			<a
				href={mukkeUrl}
				target="_blank"
				rel="noopener"
				class="text-sm text-primary hover:underline"
			>
				Bibliothek öffnen
			</a>
		</div>
	{/if}
</div>
