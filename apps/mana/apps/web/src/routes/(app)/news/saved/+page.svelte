<!--
  Legacy redirect: /news/saved → /articles.
  The "saved reading list" moved into the articles module in M5.
  Kept here so existing bookmarks and cross-links keep working.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RoutePage } from '$lib/components/shell';

	onMount(() => {
		goto('/articles', { replaceState: true });
	});
</script>

<RoutePage appId="news" backHref="/news">
	<p class="redirect">Verschoben nach <a href="/articles">/articles</a>…</p>
</RoutePage>

<style>
	.redirect {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}
</style>
