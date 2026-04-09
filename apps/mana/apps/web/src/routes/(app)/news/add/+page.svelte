<!--
  /news/add — paste an arbitrary URL, hit save, get a saved article.

  Calls POST /api/v1/news/extract/save which runs Mozilla Readability
  on the server, returns the cleaned article shape, and we drop it
  into the encrypted reading list via articlesStore.saveFromUrl.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { articlesStore } from '$lib/modules/news/stores/articles.svelte';

	let url = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);

	function looksLikeUrl(s: string): boolean {
		try {
			const u = new URL(s.trim());
			return u.protocol === 'http:' || u.protocol === 'https:';
		} catch {
			return false;
		}
	}

	async function submit(e: Event) {
		e.preventDefault();
		if (busy || !looksLikeUrl(url)) return;
		busy = true;
		error = null;
		try {
			const article = await articlesStore.saveFromUrl(url.trim());
			goto(`/news/${article.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>URL hinzufügen — News — Mana</title>
</svelte:head>

<div class="page">
	<header class="header">
		<button type="button" class="back" onclick={() => goto('/news/saved')}>← Gespeichert</button>
		<h1>Artikel speichern</h1>
		<p class="hint">
			Füge eine URL ein. Wir extrahieren den Volltext (Mozilla Readability) und legen ihn in deine
			verschlüsselte Leseliste.
		</p>
	</header>

	<form class="form" onsubmit={submit}>
		<!-- svelte-ignore a11y_autofocus -->
		<input type="url" placeholder="https://…" bind:value={url} disabled={busy} autofocus required />
		<button type="submit" disabled={busy || !looksLikeUrl(url)}>
			{busy ? 'Lade…' : 'Speichern'}
		</button>
	</form>

	{#if error}
		<div class="error">{error}</div>
	{/if}
</div>

<style>
	.page {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.header {
		padding-top: 0.5rem;
	}
	.back {
		background: none;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.875rem;
	}
	.header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin-top: 0.25rem;
	}
	.hint {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}
	.form {
		display: flex;
		gap: 0.5rem;
	}
	.form input {
		flex: 1;
		padding: 0.625rem 0.875rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		outline: none;
	}
	.form input:focus {
		border-color: hsl(var(--color-primary));
	}
	.form button {
		padding: 0.625rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
	}
	.form button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.error {
		padding: 0.625rem 0.875rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-destructive) / 0.15);
		border: 1px solid hsl(var(--color-destructive) / 0.4);
		color: hsl(var(--color-destructive));
		font-size: 0.875rem;
	}
</style>
