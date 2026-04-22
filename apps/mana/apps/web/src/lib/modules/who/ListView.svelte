<!--
  Who — main module view.

  Shows the four decks at the top, the user's past games below.
  Picking a deck starts a game and shows PlayView inline. Past
  games can be reopened (won/surrendered show the full chat
  read-only) or deleted.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { allGames$, gameStatusLabel } from './queries';
	import { whoGamesStore } from './stores/games.svelte';
	import type { WhoDeckId, WhoGame, WhoDeckMeta } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { authStore } from '$lib/stores/auth.svelte';
	import PlayView from './views/PlayView.svelte';

	let { navigate, goBack, params }: ViewProps = $props();

	let games = $state<WhoGame[]>([]);
	let decks = $state<WhoDeckMeta[]>([]);
	let loadingDecks = $state(true);
	let starting = $state<WhoDeckId | null>(null);
	let error = $state<string | null>(null);
	let activeGameId = $state<string | null>(null);

	$effect(() => {
		const sub = allGames$.subscribe((val) => {
			games = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	onMount(async () => {
		try {
			const token = await authStore.getValidToken();
			if (!token) {
				loadingDecks = false;
				return;
			}
			// Same-origin path — proxied by the SvelteKit handler at
			// /api/v1/who/[...path] to mana-api:3060 over the docker
			// network. See routes/api/v1/who/[...path]/+server.ts.
			const res = await fetch('/api/v1/who/decks', {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = (await res.json()) as { decks: WhoDeckMeta[] };
				decks = data.decks;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Decks konnten nicht geladen werden';
		} finally {
			loadingDecks = false;
		}
	});

	async function startGame(deckId: WhoDeckId) {
		starting = deckId;
		error = null;
		try {
			const gameId = await whoGamesStore.start(deckId);
			activeGameId = gameId;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Spiel konnte nicht gestartet werden';
		} finally {
			starting = null;
		}
	}

	function openGame(gameId: string) {
		activeGameId = gameId;
	}

	async function deleteGame(gameId: string) {
		if (!confirm('Spiel wirklich löschen?')) return;
		await whoGamesStore.deleteGame(gameId);
	}

	function deckColor(id: WhoDeckId): string {
		switch (id) {
			case 'historical':
				return '#a855f7';
			case 'women':
				return '#ec4899';
			case 'antiquity':
				return '#f59e0b';
			case 'inventors':
				return '#0ea5e9';
		}
	}

	function difficultyLabel(d: 'easy' | 'medium' | 'hard'): string {
		switch (d) {
			case 'easy':
				return 'leicht';
			case 'medium':
				return 'mittel';
			case 'hard':
				return 'schwer';
		}
	}

	function statusEmoji(s: WhoGame['status']): string {
		switch (s) {
			case 'playing':
				return '⏳';
			case 'won':
				return '✅';
			case 'surrendered':
				return '🏳️';
		}
	}
</script>

{#if activeGameId}
	<PlayView gameId={activeGameId} onBack={() => (activeGameId = null)} />
{:else}
	<div class="flex h-full flex-col gap-6 p-3 sm:p-4">
		<!-- Header -->
		<div>
			<h1 class="text-2xl font-bold text-foreground">Who?</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Errate die historische Persönlichkeit. Eine KI verkörpert sie ohne den Namen zu verraten.
			</p>
		</div>

		<!-- Deck picker -->
		<section>
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
				Neues Spiel starten
			</h2>
			{#if loadingDecks}
				<div class="grid gap-3 sm:grid-cols-2">
					{#each Array(4) as _, i (i)}
						<div class="h-24 animate-pulse rounded-lg bg-muted/30"></div>
					{/each}
				</div>
			{:else if decks.length === 0}
				<p class="text-sm text-muted-foreground">Keine Decks verfügbar.</p>
			{:else}
				<div class="grid gap-3 sm:grid-cols-2">
					{#each decks as deck (deck.id)}
						<button
							type="button"
							onclick={() => startGame(deck.id)}
							disabled={starting !== null}
							class="group flex flex-col items-start gap-2 rounded-lg border border-border bg-muted/20 p-4 text-left transition hover:border-border-strong hover:bg-muted/40 disabled:cursor-wait disabled:opacity-50"
							style="border-left: 3px solid {deckColor(deck.id)}"
						>
							<div class="flex w-full items-center justify-between">
								<span class="text-base font-medium text-foreground">{deck.name.de}</span>
								<span
									class="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
								>
									{difficultyLabel(deck.difficulty)}
								</span>
							</div>
							<p class="text-xs text-muted-foreground">{deck.description.de}</p>
							<p class="text-[11px] text-muted-foreground/70">
								{deck.characterCount} Personen · {deck.categories.join(', ')}
							</p>
							{#if starting === deck.id}
								<p class="text-xs text-foreground/80">Starte…</p>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Past games -->
		{#if games.length > 0}
			<section>
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
					Vergangene Spiele
				</h2>
				<ul class="divide-y divide-border rounded-lg border border-border bg-muted/20">
					{#each games as game (game.id)}
						<li class="flex items-center gap-3 px-3 py-2.5">
							<span class="text-lg">{statusEmoji(game.status)}</span>
							<button type="button" class="flex-1 text-left" onclick={() => openGame(game.id)}>
								<div class="text-sm text-foreground">
									{#if game.revealedName}
										<span class="font-medium">{game.revealedName}</span>
									{:else if game.status === 'playing'}
										<span class="text-muted-foreground">Laufendes Spiel</span>
									{:else}
										<span class="text-muted-foreground">Aufgegeben</span>
									{/if}
								</div>
								<div class="text-[11px] text-muted-foreground/70">
									{game.deckId} · {game.messageCount} Nachrichten · {gameStatusLabel(game.status)}
								</div>
							</button>
							<button
								type="button"
								class="rounded p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
								onclick={() => deleteGame(game.id)}
								title="Löschen"
							>
								✕
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if error}
			<div class="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
				{error}
			</div>
		{/if}
	</div>
{/if}
