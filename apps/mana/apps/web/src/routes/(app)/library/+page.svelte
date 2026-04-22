<script lang="ts">
	import ListView from '$lib/modules/library/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Bibliothek - Mana</title>
</svelte:head>

<RoutePage appId="library">
	<ListView />
</RoutePage>
