<script lang="ts">
	import ListView from '$lib/modules/picture/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Picture - Mana</title>
</svelte:head>

<RoutePage appId="picture">
	<ListView />
</RoutePage>
