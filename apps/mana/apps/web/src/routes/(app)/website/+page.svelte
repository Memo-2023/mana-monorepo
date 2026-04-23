<script lang="ts">
	import ListView from '$lib/modules/website/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Website - Mana</title>
</svelte:head>

<RoutePage appId="website">
	<ListView />
</RoutePage>
