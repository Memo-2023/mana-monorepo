<script lang="ts">
	import ListView from '$lib/modules/places/ListView.svelte';
	import { RoutePage } from '$lib/components/shell';
</script>

<svelte:head>
	<title>Places - Mana</title>
</svelte:head>

<RoutePage appId="places">
	<ListView navigate={() => {}} goBack={() => history.back()} params={{}} />
</RoutePage>
