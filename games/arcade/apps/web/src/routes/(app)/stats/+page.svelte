<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useAllGameStats } from '$lib/data/queries';
	import { games } from '$lib/data/games';

	const allStats = useAllGameStats();

	let totalGamesPlayed = $derived(allStats.value.reduce((sum, s) => sum + s.gamesPlayed, 0));

	let totalPlayTime = $derived(allStats.value.reduce((sum, s) => sum + s.totalPlayTime, 0));

	let favoriteGame = $derived(() => {
		if (allStats.value.length === 0) return null;
		const top = allStats.value.reduce((fav, s) => (s.gamesPlayed > fav.gamesPlayed ? s : fav));
		return games.find((g) => g.slug === top.gameId || g.id === top.gameId);
	});

	let sortedStats = $derived([...allStats.value].sort((a, b) => b.highScore - a.highScore));

	function formatPlayTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}

	function getGameTitle(gameId: string): string {
		return games.find((g) => g.slug === gameId || g.id === gameId)?.title || gameId;
	}
</script>

<svelte:head>
	<title>{$_('stats.title')} - Arcade</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-foreground">{$_('stats.title')}</h1>

	{#if allStats.value.length === 0}
		<div class="text-center py-12">
			<p class="text-4xl mb-4">📊</p>
			<p class="text-muted-foreground">{$_('stats.noStats')}</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<p class="text-3xl font-bold text-primary">{totalGamesPlayed}</p>
				<p class="text-sm text-muted-foreground mt-1">{$_('stats.totalGames')}</p>
			</div>
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<p class="text-3xl font-bold text-primary">{formatPlayTime(totalPlayTime)}</p>
				<p class="text-sm text-muted-foreground mt-1">{$_('stats.totalTime')}</p>
			</div>
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<p class="text-3xl font-bold text-primary">{favoriteGame()?.title || '-'}</p>
				<p class="text-sm text-muted-foreground mt-1">{$_('stats.favoriteGame')}</p>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-card overflow-hidden">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border text-left">
						<th class="px-4 py-3 text-muted-foreground font-medium">Spiel</th>
						<th class="px-4 py-3 text-muted-foreground font-medium text-right"
							>{$_('game.highScore')}</th
						>
						<th class="px-4 py-3 text-muted-foreground font-medium text-right hidden sm:table-cell"
							>{$_('game.gamesPlayed')}</th
						>
						<th class="px-4 py-3 text-muted-foreground font-medium text-right hidden md:table-cell"
							>{$_('game.totalPlayTime')}</th
						>
					</tr>
				</thead>
				<tbody>
					{#each sortedStats as stat (stat.id)}
						<tr class="border-b border-border/50 hover:bg-muted/30 transition-colors">
							<td class="px-4 py-3 text-foreground">{getGameTitle(stat.gameId)}</td>
							<td class="px-4 py-3 text-foreground font-mono text-right"
								>{stat.highScore.toLocaleString()}</td
							>
							<td class="px-4 py-3 text-muted-foreground text-right hidden sm:table-cell"
								>{stat.gamesPlayed}</td
							>
							<td class="px-4 py-3 text-muted-foreground text-right hidden md:table-cell"
								>{formatPlayTime(stat.totalPlayTime)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
