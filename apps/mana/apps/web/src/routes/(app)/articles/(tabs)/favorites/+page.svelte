<script lang="ts">
	import ArticlesTabShell from '$lib/modules/articles/ArticlesTabShell.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Favoriten — Artikel — Mana</title>
</svelte:head>

<RoutePage appId="articles" title="Artikel · Favoriten">
	<ArticlesTabShell initialTab="favorites" />
</RoutePage>
