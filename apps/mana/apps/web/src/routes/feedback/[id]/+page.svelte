<script lang="ts">
	import { page } from '$app/stores';
	import DetailView from '$lib/modules/community/views/DetailView.svelte';

	let { data } = $props();
	let id = $derived($page.params.id ?? data.item.id);
</script>

<svelte:head>
	<title>{data.item.title ?? 'Community-Beitrag'} — Mana Community</title>
	<meta name="description" content={data.item.feedbackText.slice(0, 160)} />
</svelte:head>

<div class="detail-public">
	<a href="/community" class="back-link">← Zurück zum Feed</a>

	<DetailView {id} />

	<noscript>
		<article>
			<h1>{data.item.title ?? data.item.feedbackText.slice(0, 80)}</h1>
			<p>{data.item.feedbackText}</p>
			<p><em>— {data.item.displayName}</em></p>
			{#if data.replies.length > 0}
				<h2>Antworten ({data.replies.length})</h2>
				{#each data.replies as r (r.id)}
					<blockquote>
						<p>{r.feedbackText}</p>
						<p><em>— {r.displayName}</em></p>
					</blockquote>
				{/each}
			{/if}
		</article>
	</noscript>
</div>

<style>
	.detail-public {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
		font-size: 0.8125rem;
		padding: 0.5rem 0;
	}

	.back-link:hover {
		color: hsl(var(--color-foreground));
	}
</style>
