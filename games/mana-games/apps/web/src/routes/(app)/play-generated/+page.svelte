<script lang="ts">
	import { useAllGeneratedGames } from '$lib/data/queries';
	import { generatedGameCollection } from '$lib/data/local-store';

	const generatedGames = useAllGeneratedGames();

	let selectedGameId = $state<string | null>(null);

	let selectedGame = $derived(generatedGames.value.find((g) => g.id === selectedGameId));

	async function deleteGame(id: string) {
		await generatedGameCollection.remove(id);
		if (selectedGameId === id) {
			selectedGameId = null;
		}
	}
</script>

<svelte:head>
	<title>Generierte Spiele - Mana Games</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">Generierte Spiele</h1>
		<p class="text-muted-foreground mt-1">Deine mit KI erstellten Spiele</p>
	</div>

	{#if generatedGames.value.length === 0}
		<div class="text-center py-12 rounded-xl border border-dashed border-border">
			<p class="text-4xl mb-4">✨</p>
			<p class="text-muted-foreground">Noch keine generierten Spiele.</p>
			<a
				href="/create"
				class="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
			>
				Erstelle dein erstes Spiel!
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="space-y-2 lg:col-span-1">
				{#each generatedGames.value as game (game.id)}
					<button
						onclick={() => (selectedGameId = game.id)}
						class="w-full text-left rounded-lg border p-3 transition-colors {selectedGameId ===
						game.id
							? 'border-primary bg-primary/5'
							: 'border-border bg-card hover:bg-muted/50'}"
					>
						<p class="font-medium text-foreground text-sm truncate">{game.title}</p>
						<p class="text-xs text-muted-foreground mt-1">
							{game.model} &middot; {game.iterationCount} Iterationen
						</p>
					</button>
				{/each}
			</div>

			<div class="lg:col-span-2 rounded-xl border border-border bg-black overflow-hidden">
				{#if selectedGame}
					<div class="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
						<span class="text-sm text-foreground truncate">{selectedGame.title}</span>
						<button
							onclick={() => deleteGame(selectedGame!.id)}
							class="text-xs text-red-400 hover:text-red-300 transition-colors"
						>
							Löschen
						</button>
					</div>
					<iframe
						srcdoc={selectedGame.htmlCode}
						title={selectedGame.title}
						class="w-full aspect-[16/10] border-0"
						sandbox="allow-scripts"
					></iframe>
				{:else}
					<div class="w-full aspect-[16/10] flex items-center justify-center">
						<p class="text-muted-foreground text-sm">Wähle ein Spiel aus der Liste</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
