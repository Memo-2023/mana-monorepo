<script lang="ts">
	import ListView from '$lib/modules/journal/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Journal - Mana</title>
</svelte:head>

<RoutePage appId="journal">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
