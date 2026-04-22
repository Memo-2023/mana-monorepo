<script lang="ts">
	import ListView from '$lib/modules/research-lab/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Research Lab · Mana</title>
</svelte:head>

<RoutePage appId="research-lab">
	<ListView />
</RoutePage>
