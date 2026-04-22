<script lang="ts">
	import ListView from '$lib/modules/dreams/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Dreams - Mana</title>
</svelte:head>

<RoutePage appId="dreams">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
