<script lang="ts">
	import ArticlesTabShell from '$lib/modules/articles/ArticlesTabShell.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Artikel - Mana</title>
</svelte:head>

<RoutePage appId="articles">
	<!-- /articles-Root → Leseliste als Default-Tab -->
	<ArticlesTabShell initialTab="list" />
</RoutePage>
