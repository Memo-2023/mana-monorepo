<script lang="ts">
	import { RoutePage } from '$lib/components/shell';
	import ListView from '$lib/modules/wardrobe/ListView.svelte';
</script>

<svelte:head>
	<title>Kleiderschrank · Mana</title>
</svelte:head>

<RoutePage appId="wardrobe">
	<ListView />
</RoutePage>
