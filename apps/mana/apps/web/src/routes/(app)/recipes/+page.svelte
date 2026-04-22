<script lang="ts">
	import ListView from '$lib/modules/recipes/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Rezepte - Mana</title>
</svelte:head>

<RoutePage appId="recipes">
	<ListView />
</RoutePage>
