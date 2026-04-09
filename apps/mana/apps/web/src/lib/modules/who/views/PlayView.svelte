<!--
  Who — play view.

  The chat-loop screen for an active game. Shows scrollback, an input
  box, a "I think it's..." submit button as escape hatch when the LLM
  forgets to emit the sentinel, and a "give up" button. After the
  game ends, transitions to read-only mode and shows the result
  banner inline.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { whoGamesStore } from '../stores/games.svelte';
	import { gameByIdLive, messagesForGameLive } from '../queries';
	import type { WhoGame, WhoMessage } from '../types';

	let { gameId }: { gameId: string } = $props();

	let game = $state<WhoGame | null>(null);
	let messages = $state<WhoMessage[]>([]);
	let inputText = $state('');
	let sending = $state(false);
	let error = $state<string | null>(null);
	let showGuessModal = $state(false);
	let guessText = $state('');
	let scrollContainer: HTMLDivElement | null = $state(null);
	let notesText = $state('');
	let notesDirty = $state(false);

	$effect(() => {
		const sub = gameByIdLive(gameId).subscribe((val) => {
			game = val ?? null;
			if (val && !notesDirty) {
				notesText = val.notes ?? '';
			}
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = messagesForGameLive(gameId).subscribe((val) => {
			messages = (val ?? []).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
			tick().then(() => {
				if (scrollContainer) {
					scrollContainer.scrollTop = scrollContainer.scrollHeight;
				}
			});
		});
		return () => sub.unsubscribe();
	});

	async function send() {
		const text = inputText.trim();
		if (!text || !game || game.status !== 'playing') return;
		sending = true;
		error = null;
		try {
			inputText = '';
			await whoGamesStore.sendMessage(gameId, text);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Nachricht fehlgeschlagen';
		} finally {
			sending = false;
		}
	}

	function onInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	async function submitGuess() {
		const guess = guessText.trim();
		if (!guess || !game || game.status !== 'playing') return;
		try {
			const matched = await whoGamesStore.submitGuess(gameId, guess);
			showGuessModal = false;
			guessText = '';
			if (!matched) {
				error = 'Das war nicht der richtige Name.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Tipp fehlgeschlagen';
		}
	}

	async function surrender() {
		if (!confirm('Spiel wirklich aufgeben?')) return;
		await whoGamesStore.surrender(gameId);
	}

	let saveNotesTimer: ReturnType<typeof setTimeout> | null = null;
	function onNotesInput() {
		notesDirty = true;
		if (saveNotesTimer) clearTimeout(saveNotesTimer);
		saveNotesTimer = setTimeout(async () => {
			await whoGamesStore.setNotes(gameId, notesText);
			notesDirty = false;
		}, 800);
	}

	onMount(() => {
		return () => {
			if (saveNotesTimer) {
				clearTimeout(saveNotesTimer);
			}
		};
	});

	function difficultyEmoji(d: 'easy' | 'medium' | 'hard'): string {
		return d === 'easy' ? '⭐' : d === 'medium' ? '⭐⭐' : '⭐⭐⭐';
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<header class="flex items-center gap-2 border-b border-white/5 px-3 py-2">
		<button
			type="button"
			class="rounded p-1.5 text-white/60 hover:bg-white/5 hover:text-white/90"
			onclick={() => goto('/who')}
			aria-label="Zurück"
		>
			←
		</button>
		<div class="flex-1">
			<div class="text-sm font-medium text-white/90">
				{#if game?.status === 'won'}
					✅ {game.revealedName}
				{:else if game?.status === 'surrendered'}
					🏳️ Aufgegeben
				{:else if game}
					Wer bin ich?
				{/if}
			</div>
			<div class="text-[11px] text-white/40">
				{#if game}
					{game.deckId} · {difficultyEmoji(game.difficulty)} · {game.messageCount} Fragen
				{/if}
			</div>
		</div>
		{#if game?.status === 'playing'}
			<button
				type="button"
				class="rounded px-2 py-1 text-xs text-white/60 hover:bg-white/5 hover:text-white/90"
				onclick={() => (showGuessModal = true)}
			>
				Tippen
			</button>
			<button
				type="button"
				class="rounded px-2 py-1 text-xs text-white/40 hover:bg-white/5 hover:text-white/70"
				onclick={surrender}
			>
				Aufgeben
			</button>
		{/if}
	</header>

	<!-- Result banner (post-game only) -->
	{#if game && game.status !== 'playing'}
		<div
			class="border-b border-white/5 px-4 py-3"
			class:bg-emerald-500={game.status === 'won'}
			class:bg-opacity-10={game.status === 'won'}
			class:bg-amber-500={game.status === 'surrendered'}
			class:bg-amber-500-10={game.status === 'surrendered'}
		>
			{#if game.status === 'won'}
				<p class="text-sm font-medium text-emerald-300">
					Erraten in {game.messageCount} Nachrichten!
				</p>
				<p class="mt-0.5 text-xs text-white/60">
					Das war {game.revealedName}.
				</p>
			{:else}
				<p class="text-sm font-medium text-amber-300">Spiel beendet — aufgegeben.</p>
			{/if}
		</div>
	{/if}

	<!-- Messages scroll -->
	<div bind:this={scrollContainer} class="flex-1 overflow-y-auto px-3 py-4">
		{#if messages.length === 0}
			<div class="flex h-full items-center justify-center text-center text-sm text-white/40">
				<p>
					Stell die erste Frage.<br />
					Versuche, die Persönlichkeit durch geschickte Fragen herauszufinden.
				</p>
			</div>
		{:else}
			<div class="mx-auto flex max-w-2xl flex-col gap-3">
				{#each messages as msg (msg.id)}
					<div class:flex-row-reverse={msg.sender === 'user'} class="flex gap-2">
						<div
							class="max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed"
							class:bg-purple-500={msg.sender === 'user'}
							class:bg-opacity-20={msg.sender === 'user'}
							class:text-white={msg.sender === 'user'}
							class:bg-white={msg.sender === 'npc'}
							class:bg-opacity-5={msg.sender === 'npc'}
							class:text-white-90={msg.sender === 'npc'}
						>
							{msg.content}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if error}
		<div class="border-t border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
			{error}
		</div>
	{/if}

	<!-- Input or notes -->
	{#if game?.status === 'playing'}
		<div class="border-t border-white/5 p-3">
			<div class="mx-auto flex max-w-2xl items-end gap-2">
				<textarea
					bind:value={inputText}
					onkeydown={onInputKeydown}
					placeholder="Frag mich etwas…"
					rows="1"
					class="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:border-purple-400/50 focus:outline-none"
					disabled={sending}
				></textarea>
				<button
					type="button"
					onclick={send}
					disabled={sending || !inputText.trim()}
					class="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{sending ? '…' : 'Senden'}
				</button>
			</div>
		</div>
	{:else if game}
		<div class="border-t border-white/5 p-3">
			<div class="mx-auto max-w-2xl">
				<label for="who-notes" class="mb-1 block text-[11px] uppercase tracking-wide text-white/40">
					Notiz {notesDirty ? '(speichert…)' : ''}
				</label>
				<textarea
					id="who-notes"
					bind:value={notesText}
					oninput={onNotesInput}
					placeholder="Notiz zum Spiel…"
					rows="2"
					class="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:border-white/20 focus:outline-none"
				></textarea>
			</div>
		</div>
	{/if}
</div>

<!-- Guess modal -->
{#if showGuessModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		onclick={(e) => e.target === e.currentTarget && (showGuessModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showGuessModal = false)}
		role="presentation"
	>
		<div class="w-full max-w-md rounded-lg bg-zinc-900 p-5">
			<h3 class="mb-3 text-base font-medium text-white/90">Wer ist es?</h3>
			<p class="mb-3 text-xs text-white/50">
				Wenn die KI deine Vermutung nicht erkannt hat, kannst du den Namen hier direkt eintragen.
			</p>
			<input
				type="text"
				bind:value={guessText}
				onkeydown={(e) => e.key === 'Enter' && submitGuess()}
				placeholder="z.B. Marie Curie"
				class="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:border-purple-400/50 focus:outline-none"
				autofocus
			/>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="rounded px-3 py-1.5 text-sm text-white/60 hover:bg-white/5"
					onclick={() => {
						showGuessModal = false;
						guessText = '';
					}}
				>
					Abbrechen
				</button>
				<button
					type="button"
					class="rounded bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50"
					onclick={submitGuess}
					disabled={!guessText.trim()}
				>
					Tippen
				</button>
			</div>
		</div>
	</div>
{/if}
