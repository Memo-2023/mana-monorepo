<script lang="ts">
	import ArticlesTabShell from '$lib/modules/articles/ArticlesTabShell.svelte';
</script>

<svelte:head>
	<title>Artikel - Mana</title>
</svelte:head>

<!-- /articles-Root → Leseliste als Default-Tab -->
<ArticlesTabShell initialTab="list" />
