<script lang="ts">
	import ListView from '$lib/modules/myday/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Mein Tag - Mana</title>
</svelte:head>

<RoutePage appId="myday">
	<ListView />
</RoutePage>
