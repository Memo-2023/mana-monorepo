<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { getGameBySlug } from '$lib/data/games';
	import { initGameCommunication } from '$lib/services/game-communication';
	import { gameStatsCollection, type LocalGameStats } from '$lib/data/local-store';

	const slug = $derived($page.params.slug);
	const game = $derived(getGameBySlug(slug));

	let stats = $state<LocalGameStats | null>(null);
	let isFullscreen = $state(false);
	let iframeEl: HTMLIFrameElement;
	let cleanup: (() => void) | undefined;

	onMount(async () => {
		if (!slug) return;
		cleanup = initGameCommunication(slug);

		const all = await gameStatsCollection.getAll();
		stats = all.find((s) => s.gameId === slug) || null;
	});

	onDestroy(() => {
		cleanup?.();
	});

	function toggleFullscreen() {
		if (!iframeEl) return;
		if (!document.fullscreenElement) {
			iframeEl.requestFullscreen();
			isFullscreen = true;
		} else {
			document.exitFullscreen();
			isFullscreen = false;
		}
	}

	function formatPlayTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
</script>

<svelte:head>
	<title>{game?.title || 'Spiel'} - Arcade</title>
</svelte:head>

{#if game}
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<a href="/" class="text-muted-foreground hover:text-foreground transition-colors">
					&larr; {$_('game.back')}
				</a>
				<h1 class="text-xl font-bold text-foreground">{game.title}</h1>
			</div>
			<div class="flex gap-2">
				<button
					onclick={toggleFullscreen}
					class="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
				>
					{$_('game.fullscreen')}
				</button>
			</div>
		</div>

		<div class="rounded-xl overflow-hidden border border-border bg-black">
			<iframe
				bind:this={iframeEl}
				src={game.htmlFile}
				title={game.title}
				class="w-full aspect-[16/10] border-0"
				sandbox="allow-scripts allow-same-origin"
			></iframe>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="rounded-xl border border-border bg-card p-4 space-y-3">
				<h2 class="font-semibold text-foreground">{game.title}</h2>
				<p class="text-sm text-muted-foreground">{game.description}</p>

				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">{$_('game.difficulty')}</span>
						<span class="text-foreground">{game.difficulty}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">{$_('game.controls')}</span>
						<span class="text-foreground text-right max-w-[60%]">{game.controls}</span>
					</div>
				</div>

				<div class="flex flex-wrap gap-1 pt-2">
					{#each game.tags as tag}
						<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
							{tag}
						</span>
					{/each}
				</div>
			</div>

			{#if stats}
				<div class="rounded-xl border border-border bg-card p-4 space-y-3">
					<h2 class="font-semibold text-foreground">{$_('game.stats')}</h2>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">{$_('game.highScore')}</span>
							<span class="text-foreground font-mono">{stats.highScore.toLocaleString()}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">{$_('game.gamesPlayed')}</span>
							<span class="text-foreground">{stats.gamesPlayed}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">{$_('game.totalPlayTime')}</span>
							<span class="text-foreground">{formatPlayTime(stats.totalPlayTime)}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="text-center py-12">
		<p class="text-muted-foreground">Spiel nicht gefunden.</p>
		<a href="/" class="text-primary hover:underline mt-2 inline-block">Zurück zur Übersicht</a>
	</div>
{/if}
