<!--
  Legacy redirect: /news/saved → /articles.
  The "saved reading list" moved into the articles module in M5.
  Kept here so existing bookmarks and cross-links keep working.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/articles', { replaceState: true });
	});
</script>

<p class="redirect">Verschoben nach <a href="/articles">/articles</a>…</p>

<style>
	.redirect {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-muted, #64748b);
	}
</style>
