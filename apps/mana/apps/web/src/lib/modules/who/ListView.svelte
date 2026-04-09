<!--
  Who — main module view.

  Shows the four decks at the top, the user's past games below.
  Picking a deck calls whoGamesStore.start() and navigates to the
  play view. Past games can be reopened (won/surrendered show the
  full chat read-only) or deleted.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { allGames$, gameStatusLabel } from './queries';
	import { whoGamesStore } from './stores/games.svelte';
	import type { WhoDeckId, WhoGame, WhoDeckMeta } from './types';
	import { authStore } from '$lib/stores/auth.svelte';

	let games = $state<WhoGame[]>([]);
	let decks = $state<WhoDeckMeta[]>([]);
	let loadingDecks = $state(true);
	let starting = $state<WhoDeckId | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		const sub = allGames$.subscribe((val) => {
			games = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	onMount(async () => {
		try {
			const token = await authStore.getAccessToken();
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
			await goto(`/who/play/${gameId}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Spiel konnte nicht gestartet werden';
		} finally {
			starting = null;
		}
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

<div class="flex h-full flex-col gap-6 p-3 sm:p-4">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-white/90">Who?</h1>
		<p class="mt-1 text-sm text-white/60">
			Errate die historische Persönlichkeit. Eine KI verkörpert sie ohne den Namen zu verraten.
		</p>
	</div>

	<!-- Deck picker -->
	<section>
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
			Neues Spiel starten
		</h2>
		{#if loadingDecks}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each Array(4) as _, i (i)}
					<div class="h-24 animate-pulse rounded-lg bg-white/5"></div>
				{/each}
			</div>
		{:else if decks.length === 0}
			<p class="text-sm text-white/40">Keine Decks verfügbar.</p>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each decks as deck (deck.id)}
					<button
						type="button"
						onclick={() => startGame(deck.id)}
						disabled={starting !== null}
						class="group flex flex-col items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-wait disabled:opacity-50"
						style="border-left: 3px solid {deckColor(deck.id)}"
					>
						<div class="flex w-full items-center justify-between">
							<span class="text-base font-medium text-white/90">{deck.name.de}</span>
							<span
								class="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50"
							>
								{difficultyLabel(deck.difficulty)}
							</span>
						</div>
						<p class="text-xs text-white/60">{deck.description.de}</p>
						<p class="text-[11px] text-white/40">
							{deck.characterCount} Personen · {deck.categories.join(', ')}
						</p>
						{#if starting === deck.id}
							<p class="text-xs text-white/70">Starte…</p>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Past games -->
	{#if games.length > 0}
		<section>
			<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
				Vergangene Spiele
			</h2>
			<ul class="divide-y divide-white/5 rounded-lg border border-white/10 bg-white/[0.02]">
				{#each games as game (game.id)}
					<li class="flex items-center gap-3 px-3 py-2.5">
						<span class="text-lg">{statusEmoji(game.status)}</span>
						<button
							type="button"
							class="flex-1 text-left"
							onclick={() => goto(`/who/play/${game.id}`)}
						>
							<div class="text-sm text-white/90">
								{#if game.revealedName}
									<span class="font-medium">{game.revealedName}</span>
								{:else if game.status === 'playing'}
									<span class="text-white/60">Laufendes Spiel</span>
								{:else}
									<span class="text-white/60">Aufgegeben</span>
								{/if}
							</div>
							<div class="text-[11px] text-white/40">
								{game.deckId} · {game.messageCount} Nachrichten · {gameStatusLabel(game.status)}
							</div>
						</button>
						<button
							type="button"
							class="rounded p-1 text-white/30 hover:bg-white/5 hover:text-white/60"
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
		<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
			{error}
		</div>
	{/if}
</div>
