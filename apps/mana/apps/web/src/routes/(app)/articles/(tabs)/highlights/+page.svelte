<script lang="ts">
	import ArticlesTabShell from '$lib/modules/articles/ArticlesTabShell.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Highlights — Artikel — Mana</title>
</svelte:head>

<RoutePage appId="articles" title="Artikel · Highlights">
	<ArticlesTabShell initialTab="highlights" />
</RoutePage>
